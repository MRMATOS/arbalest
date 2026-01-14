import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Search, Printer, PlusCircle, FileText, Filter, History, Copy } from 'lucide-react';
import { ButcherFilterModal } from './components/ButcherFilterModal';
import { AddButcherOrderModal } from './components/AddButcherOrderModal';
import { ButcherPermissions } from '../../utils/permissions';

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
    // ... (state remains same)
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);

    // Filters
    const [selectedPeriod, setSelectedPeriod] = useState('7_days'); // today, 7_days, 30_days, all
    const [selectedStore, setSelectedStore] = useState('all');
    const [selectedMeatGroup, setSelectedMeatGroup] = useState('all');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // ... (derived data remains same)
    const stores = Array.from(new Set(orders
        .filter(o => o.requester_store)
        .map(o => JSON.stringify({ id: o.requester_store.id, name: o.requester_store.name }))
    )).map(s => JSON.parse(s));

    const meatGroups = Array.from(new Set(orders.map(o => o.product?.meat_group).filter(Boolean))) as string[];

    useEffect(() => {
        fetchHistory();
    }, [selectedPeriod]); // Refetch when date range changes (optimization)

    const fetchHistory = async () => {
        // ... (fetch logic remains same)
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

    // ... (rest of logic remains same)
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

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Optional: toast notification
    };

    // Logic for Mobile Action Button (Same as Dashboard for consistency)
    const canProduce = ButcherPermissions.canProduce(user);
    const canRequest = ButcherPermissions.canRequest(user);

    let mobileActionButton = null;

    if (canProduce) {
        // Production users in History view see disabled Print button
        mobileActionButton = (
            <button
                className="nav-btn add-btn-mobile"
                disabled={true}
                style={{ border: 'none', background: 'transparent', opacity: 0.5, cursor: 'not-allowed' }}
            >
                <Printer size={24} color="var(--text-tertiary)" />
                <span style={{ color: "var(--text-tertiary)" }}>Imprimir</span>
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
    const historyLink = (
        <div
            className="nav-btn active"
            style={{ cursor: 'default' }}
        >
            <History size={24} />
            <span>Histórico</span>
        </div>
    );

    const filterButton = (
        <div
            onClick={() => setIsFilterModalOpen(true)}
            className="nav-btn"
            style={{ cursor: 'pointer' }}
        >
            <Filter size={24} />
            <span>Filtrar</span>
        </div>
    );

    const pedidosLink = (
        <div
            onClick={() => navigate('/butcher')}
            className="nav-btn"
            style={{ cursor: 'pointer' }}
        >
            <FileText size={24} />
            <span>Pedidos</span>
        </div>
    );

    return (
        <DashboardLayout
            // Slots: Menu, History, Filter, Module (Pedidos), Action
            mobileHistory={historyLink}
            mobileFilter={filterButton}
            mobileModule={pedidosLink}
            mobileAction={mobileActionButton}
        >
            <div className="arbalest-layout-container">
                {/* Header */}
                <div className="arbalest-header">
                    <div className="header-text" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Back Arrow Removed */}
                        <div>
                            <h1>Histórico de Pedidos</h1>
                            <p>Registro de entregas e cancelamentos do açougue</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {/* Filters (Moved to Modal) */}

                {/* Search */}
                <div className="arbalest-filter-section arbalest-glass" style={{ marginTop: 0, paddingTop: '12px', paddingBottom: '12px' }}>
                    <div className="arbalest-search-wrapper">
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
                <div className="arbalest-table-container arbalest-glass">
                    {loading ? (
                        <div className="arbalest-loading-state">
                            <div className="arbalest-spinner" />
                            <p>Carregando histórico...</p>
                        </div>
                    ) : (
                        <table className="arbalest-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Código</th>
                                    <th>Loja</th>
                                    <th>Quantidade</th>
                                    <th>Solicitante</th>
                                    <th>Pedido Em</th>
                                    <th>Recebido Em</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                            Nenhum registro encontrado neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>
                                                <span className="product-name">{order.product?.name}</span>
                                            </td>
                                            <td>
                                                <div
                                                    onClick={() => handleCopy(order.product?.code)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '0.85rem'
                                                    }}
                                                    title="Clique para copiar"
                                                >
                                                    {order.product?.code}
                                                    <Copy size={12} strokeWidth={1.5} />
                                                </div>
                                            </td>
                                            <td>
                                                <span className="arbalest-badge arbalest-badge-neutral">{order.requester_store?.name}</span>
                                            </td>
                                            <td>
                                                <span className="arbalest-badge arbalest-badge-neutral" style={{ fontSize: '0.9rem' }}>
                                                    {order.quantity} {order.unit === 'bandeja' ? 'bandejas' : order.unit}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{order.requester_user?.name || '-'}</span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {' '}
                                                {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {order.received_at ? (
                                                    <>
                                                        {new Date(order.received_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {' '}
                                                        {new Date(order.received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <span className={`arbalest-badge ${order.status === 'received' ? 'arbalest-badge-success' : 'arbalest-badge-danger'}`}>
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
                            <div key={order.id} className="arbalest-card arbalest-glass">
                                <div className="arbalest-card-header">
                                    <span className="product-name">{order.product?.name}</span>
                                    <span className={`arbalest-badge ${order.status === 'received' ? 'arbalest-badge-success' : 'arbalest-badge-danger'}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>
                                <div className="arbalest-card-body">
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Código</label>
                                            <div
                                                onClick={() => handleCopy(order.product?.code)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                            >
                                                <span>{order.product?.code}</span>
                                                <Copy size={12} strokeWidth={1.5} color="var(--text-tertiary)" />
                                            </div>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Loja</label>
                                            <span>{order.requester_store?.name}</span>
                                        </div>
                                    </div>
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Quantidade</label>
                                            <span>{order.quantity} {order.unit === 'bandeja' ? 'bandejas' : order.unit}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Solicitante</label>
                                            <span>{order.requester_user?.name || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Pedido Em</label>
                                            <span>
                                                {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {' '}
                                                {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Recebido Em</label>
                                            <span>
                                                {order.received_at ? (
                                                    <>
                                                        {new Date(order.received_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {' '}
                                                        {new Date(order.received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </>
                                                ) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            <ButcherFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={{ store: selectedStore, meatGroup: selectedMeatGroup, period: selectedPeriod }}
                setFilter={(key, value) => {
                    if (key === 'store') setSelectedStore(value);
                    if (key === 'meatGroup') setSelectedMeatGroup(value);
                    if (key === 'period') setSelectedPeriod(value);
                }}
                stores={stores}
                meatGroups={meatGroups}
                type="history"
            />

            {/* Modals for Mobile Actions */}


            <AddButcherOrderModal
                isOpen={isAddOrderModalOpen}
                onClose={() => setIsAddOrderModalOpen(false)}
                onSuccess={() => {
                    // Refresh history if new order affects it (partially unlikely but good for consistency)
                    fetchHistory();
                }}
            />
        </DashboardLayout >
    );
};
