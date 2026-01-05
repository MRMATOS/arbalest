import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Search, History, Printer, Check, Settings2, Trash2, Plus } from 'lucide-react';
import { PrintOrdersModal } from './components/PrintOrdersModal';
import { AddButcherOrderModal } from './components/AddButcherOrderModal';
import './styles/ButcherDashboard.css';

interface Order {
    id: string;
    product: {
        name: string;
        code: string;
        ean?: string;
        meat_group?: string;
    };
    sim_poa_code?: string;
    quantity: number;
    unit: 'bandeja' | 'kg';
    status: 'pending' | 'production' | 'received';
    requester_store: {
        name: string;
        code: string;
        id: string; // added id for filtering
    };
    created_at: string;
}

export const ButcherDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);

    // Filters State
    const [selectedStore, setSelectedStore] = useState('all');
    const [selectedMeatGroup, setSelectedMeatGroup] = useState('all');
    const [sortBy, setSortBy] = useState('recent'); // recent, oldest

    // Derived Data for Filters
    const stores = Array.from(new Set(orders.map(o => JSON.stringify({ id: o.requester_store.id, name: o.requester_store.name }))))
        .map(s => JSON.parse(s));

    const meatGroups = Array.from(new Set(orders.map(o => o.product.meat_group).filter(Boolean)));

    // Determines if user handles production (can print/update status)
    const canProduce = user?.role === 'admin' || user?.butcher_role === 'producer';
    const canRequest = user?.role === 'admin' || user?.butcher_role === 'requester';

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel('butcher_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'butcher', table: 'orders' },
                () => fetchOrders()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .schema('butcher')
                .from('orders')
                .select(`
                    id,
                    quantity,
                    unit,
                    status,
                    sim_poa_code,
                    created_at,
                    product:products!butcher_orders_products_fk (name, code, ean, meat_group),
                    requester_store:stores!butcher_orders_requester_store_fk (name, code, id)
                `, { count: 'exact' })
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = (data || []).map((item: any) => ({
                ...item,
                product: Array.isArray(item.product) ? item.product[0] : item.product,
                requester_store: Array.isArray(item.requester_store) ? item.requester_store[0] : item.requester_store
            }));

            setOrders(formattedData);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId); // Removed .schema call from here, handled by client or previous context if needed, but standard update is fine on public if schema is set, but better be explicit if using custom schema client

            // Re-fetch handled by realtime subscription
            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.product.code.includes(searchTerm) ||
            (order.product.ean && order.product.ean.includes(searchTerm));

        const matchesStore = selectedStore === 'all' || order.requester_store.id === selectedStore;
        const matchesGroup = selectedMeatGroup === 'all' || order.product.meat_group === selectedMeatGroup;

        // Logic: Producers generally see "pending" and "production". "Received" goes to history.
        // Requesters see everything active.
        const isActive = order.status !== 'received';

        return matchesSearch && matchesStore && matchesGroup && isActive;
    }).sort((a, b) => {
        if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'production': return 'Em Produção';
            case 'received': return 'Entregue';
            default: return status;
        }
    };

    return (
        <DashboardLayout>
            <div className="butcher-container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-text">
                        <h1>Pedidos do Açougue</h1>
                        <p>Gerencie solicitações e produção de cortes</p>
                    </div>
                    <div className="header-actions">
                        <button className="butcher-action-btn btn-secondary" onClick={() => navigate('/butcher/history')}>
                            <History size={20} />
                            <span>Histórico</span>
                        </button>

                        {canProduce && (
                            <button className="butcher-action-btn btn-primary" onClick={() => setIsPrintModalOpen(true)}>
                                <Printer size={20} />
                                <span>Imprimir Pedidos</span>
                            </button>
                        )}

                        {/* Novo Pedido (Requester Only) */}
                        {canRequest && (
                            <button className="butcher-action-btn btn-primary" onClick={() => setIsAddOrderModalOpen(true)}>
                                <Plus size={20} />
                                <span>Novo Pedido</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Filters */}
                <div className="filter-section glass desktop-filters">
                    <div className="filter-grid">
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

                        <div className="filter-group">
                            <label>Ordenar</label>
                            <select
                                className="filter-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="recent">Mais Recentes</option>
                                <option value="oldest">Mais Antigos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Search Bar (Separate Section) */}
                <div className="filter-section glass" style={{ marginTop: 0, paddingTop: '12px', paddingBottom: '12px' }}>
                    <div className="search-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por produto, código ou EAN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="desktop-view glass">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner" />
                            <p>Carregando pedidos...</p>
                        </div>
                    ) : (
                        <table className="butcher-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Cód / EAN</th>
                                    <th>Status</th>
                                    <th>Qtd.</th>
                                    <th>Loja</th>
                                    <th>SIM/POA</th>
                                    <th className="actions-col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                            Nenhum pedido encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>
                                                <span className="product-name">{order.product.name}</span>
                                                <span className="code-info" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                    {order.product.meat_group || 'Sem grupo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="code-info">
                                                    <span className="code">{order.product.code}</span>
                                                    <span className="ean">{order.product.ean || '-'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${order.status}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="quantity-badge">
                                                    {order.quantity} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>{order.unit}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <span className="store-tag">{order.requester_store.name}</span>
                                            </td>
                                            <td>
                                                <span className="lot-tag">{order.sim_poa_code || '-'}</span>
                                            </td>
                                            <td className="actions-col">
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {/* Actions logic */}
                                                    {canProduce && order.status === 'pending' && (
                                                        <button
                                                            className="butcher-action-btn"
                                                            title="Produzir"
                                                            onClick={() => handleUpdateStatus(order.id, 'production')}
                                                        >
                                                            <Settings2 size={18} />
                                                        </button>
                                                    )}

                                                    {canRequest && order.status === 'production' && (
                                                        <button
                                                            className="butcher-action-btn success"
                                                            title="Confirmar Recebimento"
                                                            onClick={() => handleUpdateStatus(order.id, 'received')}
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    )}

                                                    {canRequest && order.status === 'pending' && (
                                                        <button
                                                            className="butcher-action-btn danger"
                                                            title="Cancelar"
                                                        // onClick={() => handleDelete(order.id)}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="mobile-view">
                    <div className="card-list">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="butcher-card glass">
                                <div className="card-header">
                                    <span className="product-name" style={{ fontSize: '1rem' }}>{order.product.name}</span>
                                    <span className={`status-pill ${order.status}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="card-row">
                                        <div className="card-info">
                                            <label>Quantidade</label>
                                            <span className="quantity-badge">{order.quantity} {order.unit}</span>
                                        </div>
                                        <div className="card-info">
                                            <label>Loja</label>
                                            <span>{order.requester_store.name}</span>
                                        </div>
                                    </div>

                                    <div className="card-row">
                                        <div className="card-info">
                                            <label>Código / EAN</label>
                                            <span>{order.product.code}</span>
                                        </div>
                                        <div className="card-info">
                                            <label>SIM / POA</label>
                                            <span>{order.sim_poa_code || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    {canProduce && order.status === 'pending' && (
                                        <button
                                            className="card-action primary"
                                            onClick={() => handleUpdateStatus(order.id, 'production')}
                                        >
                                            Iniciar Produção <Settings2 size={16} />
                                        </button>
                                    )}
                                    {canRequest && order.status === 'production' && (
                                        <button
                                            className="card-action success"
                                            onClick={() => handleUpdateStatus(order.id, 'received')}
                                            style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
                                        >
                                            Confirmar Recebimento <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Print Modal */}
            <PrintOrdersModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
            />

            <AddButcherOrderModal
                isOpen={isAddOrderModalOpen}
                onClose={() => setIsAddOrderModalOpen(false)}
                onSuccess={() => {
                    // Refresh is automatic via realtime, but could force fetch here if needed
                    fetchOrders();
                }}
            />
        </DashboardLayout>
    );
};
