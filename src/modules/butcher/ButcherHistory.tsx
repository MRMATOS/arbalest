import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Search, Filter, Calendar, Printer, PlusCircle, List, History } from 'lucide-react';
import './styles/ButcherHistory.css';
import { PrintOrdersModal } from './components/PrintOrdersModal';
import { AddButcherOrderModal } from './components/AddButcherOrderModal';

interface Order {
    id: string;
    product: {
        name: string;
        code: string;
        ean?: string;
        meat_group?: string;
    };
    quantity: number;
    unit: 'bandeja' | 'kg';
    status: 'pending' | 'production' | 'received' | 'cancelled';
    requester_store: {
        name: string;
        id: string;
    };
    requester_user?: {
        name: string;
    };
    created_at: string;
    received_at?: string;
}

export const ButcherHistory: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);

    // Filters
    const [selectedPeriod, setSelectedPeriod] = useState('7_days'); // today, 7_days, 30_days, all
    const [selectedStore, setSelectedStore] = useState('all');
    const [selectedMeatGroup, setSelectedMeatGroup] = useState('all');

    // Derived Data for Filter Options
    const stores = Array.from(new Set(orders
        .filter(o => o.requester_store)
        .map(o => JSON.stringify({ id: o.requester_store.id, name: o.requester_store.name }))
    )).map(s => JSON.parse(s));

    const meatGroups = Array.from(new Set(orders.map(o => o.product?.meat_group).filter(Boolean)));

    useEffect(() => {
        fetchHistory();
    }, [selectedPeriod]); // Refetch when date range changes (optimization)

    const fetchHistory = async () => {
        try {
            setLoading(true);

            // Date Filter Logic
            let startDate = new Date();
            if (selectedPeriod === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (selectedPeriod === '7_days') {
                startDate.setDate(startDate.getDate() - 7);
            } else if (selectedPeriod === '30_days') {
                startDate.setDate(startDate.getDate() - 30);
            } else {
                startDate = new Date(0); // 'all' -> beginning of time
            }

            // 1. Fetch Orders from Butcher Schema
            let query = supabase
                .schema('butcher')
                .from('orders')
                .select('*')
                .in('status', ['received', 'cancelled'])
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            const { data: ordersData, error: ordersError } = await query;

            if (ordersError) throw ordersError;

            // 2. Extract IDs
            const productIds = [...new Set((ordersData || []).map((o: any) => o.product_id).filter(Boolean))];
            const storeIds = [...new Set((ordersData || []).map((o: any) => o.requester_store_id).filter(Boolean))];
            const userIds = [...new Set((ordersData || []).map((o: any) => o.created_by).filter(Boolean))];

            // 3. Fetch Products (Public Schema)
            const { data: productsData } = await supabase
                .from('products')
                .select('id, name, code, ean, meat_group')
                .in('id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

            // 4. Fetch Stores (Public Schema)
            const { data: storesData } = await supabase
                .from('stores')
                .select('id, name')
                .in('id', storeIds.length > 0 ? storeIds : ['00000000-0000-0000-0000-000000000000']);

            // 5. Fetch Profiles (Public Schema) - For requester Name
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

            // 6. Create Maps
            const productsMap = new Map((productsData || []).map((p: any) => [p.id, p]));
            const storesMap = new Map((storesData || []).map((s: any) => [s.id, s]));
            const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

            // 7. Merge Data
            const formattedData = (ordersData || []).map((order: any) => ({
                ...order,
                product: productsMap.get(order.product_id) || { name: 'Produto não encontrado', code: '-' },
                requester_store: storesMap.get(order.requester_store_id) || { name: 'Loja desconhecida' },
                requester_user: profilesMap.get(order.created_by) || { name: 'Sistema' }
            }));

            setOrders(formattedData);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const prod = order.product || {};
        const store = order.requester_store || {};

        const matchesSearch =
            (prod.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (prod.code || '').includes(searchTerm);

        const matchesStore = selectedStore === 'all' || store.id === selectedStore;
        const matchesGroup = selectedMeatGroup === 'all' || prod.meat_group === selectedMeatGroup;

        return matchesSearch && matchesStore && matchesGroup;
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'received': return 'Entregue';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    // Logic for Mobile Action Button (Same as Dashboard for consistency)
    const canProduce = user?.role === 'admin' || user?.butcher_role === 'producer';
    const canRequest = user?.role === 'admin' || user?.butcher_role === 'requester';

    let mobileActionButton = null;

    if (canProduce) {
        mobileActionButton = (
            <button
                className="nav-btn add-btn-mobile"
                onClick={() => setIsPrintModalOpen(true)}
                style={{ border: 'none', background: 'transparent' }}
            >
                <Printer size={24} />
                <span>Imprimir</span>
            </button>
        );
    } else if (canRequest) {
        mobileActionButton = (
            <button
                className="nav-btn add-btn-mobile"
                onClick={() => setIsAddOrderModalOpen(true)}
                style={{ border: 'none', background: 'transparent' }}
            >
                <PlusCircle size={24} />
                <span>Pedir</span>
            </button>
        );
    }

    // Navigation Links
    const pedidosLink = (
        <div
            onClick={() => navigate('/butcher')}
            className="nav-btn"
            style={{ cursor: 'pointer' }}
        >
            <List size={24} />
            <span>Pedidos</span>
        </div>
    );

    const historyLink = (
        <div
            onClick={() => navigate('/butcher/history')}
            className="nav-btn active"
            style={{ cursor: 'pointer' }}
        >
            <History size={24} />
            <span>Histórico</span>
        </div>
    );

    return (
        <DashboardLayout
            customMobileAction={mobileActionButton}
            filterMobileAction={pedidosLink}
            secondaryMobileAction={historyLink}
        >
            <div className="butcher-container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-text" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Back Arrow Removed */}
                        <div>
                            <h1>Histórico de Pedidos</h1>
                            <p>Registro de entregas e cancelamentos do açougue</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filter-section glass desktop-filters">
                    <div className="filter-grid">
                        <div className="filter-group">
                            <label>Período</label>
                            <select
                                className="filter-select text-select"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            >
                                <option value="today">Hoje</option>
                                <option value="7_days">Últimos 7 Dias</option>
                                <option value="30_days">Últimos 30 Dias</option>
                                <option value="all">Todo o Período</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Loja</label>
                            <select
                                className="filter-select"
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                            >
                                <option value="all">Todas as Lojas</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Grupo de Carne</label>
                            <select
                                className="filter-select"
                                value={selectedMeatGroup}
                                onChange={(e) => setSelectedMeatGroup(e.target.value)}
                            >
                                <option value="all">Todos os Grupos</option>
                                {meatGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="filter-section glass" style={{ marginTop: 0, paddingTop: '12px', paddingBottom: '12px' }}>
                    <div className="search-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por produto ou código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="desktop-view glass">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner" />
                            <p>Carregando histórico...</p>
                        </div>
                    ) : (
                        <table className="butcher-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Qtd.</th>
                                    <th>Loja</th>
                                    <th>Solicitante</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                            Nenhum registro encontrado neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {new Date(order.created_at).toLocaleDateString()} <br />
                                                <small>{new Date(order.created_at).toLocaleTimeString().slice(0, 5)}</small>
                                            </td>
                                            <td>
                                                <span className="product-name">{order.product?.name}</span>
                                                <span className="code-info" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                    {order.product?.code}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="quantity-badge" style={{ fontSize: '0.9rem' }}>
                                                    {order.quantity} {order.unit}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="store-tag">{order.requester_store?.name}</span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{order.requester_user?.name || '-'}</span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${order.status}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                    )}
                </div>

                {/* Mobile View */}
                <div className="mobile-view">
                    <div className="card-list">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="butcher-card glass">
                                <div className="card-header">
                                    <span className="product-name">{order.product?.name}</span>
                                    <span className={`status-pill ${order.status}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <div className="card-row">
                                        <div className="card-info">
                                            <label>Data</label>
                                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="card-info">
                                            <label>Qtd</label>
                                            <span>{order.quantity} {order.unit}</span>
                                        </div>
                                    </div>
                                    <div className="card-row">
                                        <div className="card-info">
                                            <label>Loja</label>
                                            <span>{order.requester_store?.name}</span>
                                        </div>
                                        <div className="card-info">
                                            <label>Solicitante</label>
                                            <span>{order.requester_user?.name || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            {/* Modals for Mobile Actions */}
            <PrintOrdersModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
            />

            <AddButcherOrderModal
                isOpen={isAddOrderModalOpen}
                onClose={() => setIsAddOrderModalOpen(false)}
                onSuccess={() => {
                    // Refresh history if new order affects it (partially unlikely but good for consistency)
                    fetchHistory();
                }}
            />
        </DashboardLayout>
    );
};
