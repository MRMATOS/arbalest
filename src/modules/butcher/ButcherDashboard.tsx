import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Search, History, Printer, Check, Trash2, PlusCircle, FileText, Filter } from 'lucide-react';
import { ButcherFilterModal } from './components/ButcherFilterModal';
import { AddButcherOrderModal } from './components/AddButcherOrderModal';


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
    const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
    const [printQueue, setPrintQueue] = useState<string[]>([]);
    const [isPrinting, setIsPrinting] = useState(false);

    // Filters State
    const [selectedStore, setSelectedStore] = useState('all');
    const [selectedMeatGroup, setSelectedMeatGroup] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [sortBy] = useState('recent'); // recent, oldest

    // Derived Data for Filters
    // Derived Data for Filters
    const stores = Array.from(new Set(orders
        .filter(o => o.requester_store)
        .map(o => JSON.stringify({ id: o.requester_store.id, name: o.requester_store.name }))
    )).map(s => JSON.parse(s));

    const meatGroups = Array.from(new Set(orders.map(o => o.product?.meat_group).filter(Boolean))) as string[];

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

            // 1. Fetch Orders from Butcher Schema
            const { data: ordersData, error: ordersError } = await supabase
                .schema('butcher')
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // 2. Extract IDs for related data
            const productIds = [...new Set((ordersData || []).map((o: any) => o.product_id).filter(Boolean))];
            const storeIds = [...new Set((ordersData || []).map((o: any) => o.requester_store_id).filter(Boolean))];

            // 3. Fetch Products (Public Schema)
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, name, code, ean, meat_group')
                .in('id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

            if (productsError) throw productsError;

            // 4. Fetch Stores (Public Schema)
            const { data: storesData, error: storesError } = await supabase
                .from('stores')
                .select('id, name, code')
                .in('id', storeIds.length > 0 ? storeIds : ['00000000-0000-0000-0000-000000000000']);

            if (storesError) throw storesError;

            // 5. Create Maps for fast lookup
            const productsMap = new Map((productsData || []).map((p: any) => [p.id, p]));
            const storesMap = new Map((storesData || []).map((s: any) => [s.id, s]));

            // 6. Merge Data
            const formattedData = (ordersData || []).map((order: any) => ({
                ...order,
                product: productsMap.get(order.product_id) || null,
                requester_store: storesMap.get(order.requester_store_id) || null
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
            const updates: any = { status: newStatus };

            if (newStatus === 'production' && user?.store_id) {
                updates.production_store_id = user.store_id;
            } else if (newStatus === 'received') {
                updates.received_at = new Date().toISOString();
            }

            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            // Re-fetch handled by realtime subscription
            if (error) throw error;
            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const handleToggleQueue = (orderId: string) => {
        setPrintQueue(prev => {
            if (prev.includes(orderId)) {
                return prev.filter(id => id !== orderId);
            }
            return [...prev, orderId];
        });
    };

    const handlePrintQueue = async () => {
        if (printQueue.length === 0) return;
        setIsPrinting(true);

        try {
            // 1. Update statuses to 'production' (if not already)
            // We only need to update 'pending' orders. 'production' orders are re-prints.
            const ordersToUpdate = orders
                .filter(o => printQueue.includes(o.id) && o.status === 'pending')
                .map(o => o.id);

            if (ordersToUpdate.length > 0) {
                const { error } = await supabase
                    .schema('butcher')
                    .from('orders')
                    .update({
                        status: 'production',
                        production_store_id: user?.store_id
                    })
                    .in('id', ordersToUpdate);

                if (error) throw error;
            }

            // 2. Refresh local state immediately for UI feedback (though realtime might handle it)
            // Better to wait for realtime or optimistically update? Realtime is fast usually.
            // We'll proceed to print.

            // 3. Trigger Print
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
                setPrintQueue([]); // Clear queue after print? User didn't specify, but standard flow.
            }, 500); // Small delay to allow React to render any print updates if needed
        } catch (error) {
            console.error('Error processing print queue:', error);
            alert('Erro ao processar fila de impressão');
            setIsPrinting(false);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!window.confirm('Tem certeza que deseja cancelar este pedido?')) return;

        try {
            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Erro ao cancelar pedido');
        }
    };

    const filteredOrders = orders.filter(order => {
        const prod = order.product || {};
        const store = order.requester_store || {};

        const matchesSearch =
            (prod.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (prod.code || '').includes(searchTerm) ||
            (prod.ean && prod.ean.includes(searchTerm));

        const matchesStore = selectedStore === 'all' || store.id === selectedStore;
        const matchesGroup = selectedMeatGroup === 'all' || prod.meat_group === selectedMeatGroup;

        let matchesPeriod = true;
        if (selectedPeriod !== 'all') {
            const date = new Date(order.created_at);
            const now = new Date();
            date.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);

            if (selectedPeriod === 'today') {
                matchesPeriod = date.getTime() === now.getTime();
            } else if (selectedPeriod === 'week') {
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(now.getDate() - 7);
                matchesPeriod = date >= oneWeekAgo;
            } else if (selectedPeriod === 'month') {
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                matchesPeriod = date >= firstDayOfMonth;
            }
        }

        // Logic: Producers generally see "pending" and "production". "Received" goes to history.
        // Requesters see everything active.
        const isActive = order.status !== 'received';

        return matchesSearch && matchesStore && matchesGroup && matchesPeriod && isActive;
    }).sort((a, b) => {
        if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'production': return 'Produzindo';
            case 'received': return 'Entregue';
            default: return status;
        }
    };

    // Logic for Mobile Action Button
    let mobileActionButton = null;

    if (canProduce) {
        mobileActionButton = (
            <button
                className="nav-btn add-btn-mobile"
                onClick={handlePrintQueue}
                style={{ border: 'none', background: 'transparent', opacity: printQueue.length === 0 ? 0.5 : 1 }}
                disabled={printQueue.length === 0 || isPrinting}
            >
                <Printer size={24} color={printQueue.length > 0 ? "var(--brand-primary)" : "var(--text-tertiary)"} />
                <span style={{ color: printQueue.length > 0 ? "var(--brand-primary)" : "var(--text-tertiary)" }}>Imprimir</span>
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

    // Navigation Links (Reordered per request: History -> Filter -> Orders -> Action)

    // 1. History Link (goes to History page) - Will be in 'filterMobileAction' slot (first on left) based on Layout
    // Wait, Layout is: Filter -> Secondary -> Tertiary -> Custom.
    // User wants: Menu - Histórico - Filtrar - Pedidos - Pedir
    // So: 
    // FilterSlot = Historico
    // SecondarySlot = Filtrar
    // TertiarySlot = Pedidos (Active)
    // CustomSlot = Pedir/Imprimir

    const historyLink = (
        <div
            onClick={() => navigate('/butcher/history')}
            className="nav-btn"
            style={{ cursor: 'pointer' }}
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
            className="nav-btn active"
            style={{ cursor: 'default' }}
        >
            <FileText size={24} />
            <span>Pedidos</span>
        </div>
    );

    return (
        <DashboardLayout
            filterMobileAction={historyLink}
            secondaryMobileAction={filterButton}
            tertiaryMobileAction={pedidosLink}
            customMobileAction={mobileActionButton}
        >
            <div className="arbalest-layout-container">
                {/* Header */}
                <div className="arbalest-header">
                    <div className="header-text">
                        <h1>Pedidos do Açougue</h1>
                        <p>Gerencie solicitações e produção de cortes</p>
                    </div>
                    <div className="arbalest-header-actions hide-mobile">
                        <button
                            className="arbalest-btn arbalest-btn-neutral"
                            onClick={() => navigate('/butcher/history')}
                        >
                            <History size={20} />
                            <span>Histórico</span>
                        </button>

                        {canProduce && (
                            <button
                                className={`arbalest-btn arbalest-btn-primary ${printQueue.length === 0 ? 'disabled' : ''}`}
                                onClick={handlePrintQueue}
                                disabled={printQueue.length === 0 || isPrinting}
                                style={{ opacity: printQueue.length === 0 ? 0.5 : 1, cursor: printQueue.length === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                <Printer size={20} />
                                <span>{isPrinting ? 'Imprimindo...' : `Imprimir Selecionados (${printQueue.length})`}</span>
                            </button>
                        )}

                        {canRequest && (
                            <button
                                className="arbalest-btn arbalest-btn-primary"
                                onClick={() => setIsAddOrderModalOpen(true)}
                            >
                                <PlusCircle size={20} />
                                <span>Fazer pedido</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Filters */}
                <div className="arbalest-filter-section arbalest-glass desktop-filters hide-mobile" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="filter-group">
                            <label className="arbalest-label">Loja</label>
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                                className="arbalest-select"
                            >
                                <option value="all">Todas as Lojas</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="arbalest-label">Grupo</label>
                            <select
                                value={selectedMeatGroup}
                                onChange={(e) => setSelectedMeatGroup(e.target.value)}
                                className="arbalest-select"
                            >
                                <option value="all">Todos os Grupos</option>
                                {meatGroups.map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="arbalest-label">Período</label>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                                className="arbalest-select"
                            >
                                <option value="today">Hoje</option>
                                <option value="week">Esta Semana</option>
                                <option value="month">Este Mês</option>
                                <option value="all">Todo o Período</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Search Bar (Separate Section) */}
                <div className="arbalest-filter-section arbalest-glass">
                    <div className="arbalest-search-wrapper">
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
                <div className="desktop-view arbalest-table-container">
                    {
                        loading ? (
                            <div className="arbalest-loading-state" >
                                <div className="spinner" />
                                <p>Carregando pedidos...</p>
                            </div>
                        ) : (
                            <table className="arbalest-table">
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Grupo</th>
                                        <th>Cód / EAN</th>
                                        <th>Status</th>
                                        <th>Qtd.</th>
                                        <th>Loja</th>
                                        <th>Pedido Em</th>
                                        <th className="actions-col"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                Nenhum pedido encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <tr key={order.id}>
                                                <td>
                                                    <span className="product-name">{order.product?.name || 'Produto não encontrado'}</span>
                                                </td>
                                                <td>
                                                    <span className="code-info" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                        {order.product?.meat_group || 'Sem grupo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="code-info">
                                                        <span className="code">{order.product?.code || '-'}</span>
                                                        <span className="ean">{order.product?.ean || '-'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`arbalest-badge ${order.status === 'pending' ? 'arbalest-badge-warning' :
                                                        order.status === 'production' ? 'arbalest-badge-info' :
                                                            'arbalest-badge-success'
                                                        }`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="quantity-badge">
                                                        {order.quantity} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>{order.unit}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="store-tag">{order.requester_store?.name || 'Loja desconhecida'}</span>
                                                </td>
                                                <td>
                                                    <span className="date-tag" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {' '}
                                                        {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="actions-col">
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        {/* Actions logic */}
                                                        {canProduce && (
                                                            <button
                                                                className={`arbalest-icon-btn ${printQueue.includes(order.id) ? 'arbalest-btn-primary' : 'arbalest-btn-neutral'}`}
                                                                title={printQueue.includes(order.id) ? "Remover da fila" : "Adicionar à fila de impressão"}
                                                                onClick={() => handleToggleQueue(order.id)}
                                                                style={{ opacity: printQueue.includes(order.id) ? 1 : 0.6 }}
                                                            >
                                                                <Printer size={18} />
                                                            </button>
                                                        )}

                                                        {canRequest && order.status === 'production' && (
                                                            <button
                                                                className="arbalest-icon-btn arbalest-btn-primary"
                                                                title="Confirmar Recebimento"
                                                                onClick={() => handleUpdateStatus(order.id, 'received')}
                                                            >
                                                                <Check size={18} />
                                                            </button>
                                                        )}

                                                        {canRequest && order.status === 'pending' && (
                                                            <button
                                                                className="arbalest-icon-btn arbalest-btn-danger"
                                                                style={{ color: 'var(--error)' }}
                                                                title="Cancelar"
                                                                onClick={() => handleDeleteOrder(order.id)}
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
                            <div key={order.id} className="arbalest-card">
                                <div className="arbalest-card-header">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span className="product-name" style={{ fontSize: '1rem' }}>
                                            {order.product?.name || 'Produto não encontrado'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                            {order.product?.meat_group || 'Sem grupo'}
                                        </span>
                                    </div>
                                    <span className={`arbalest-badge ${order.status === 'pending' ? 'arbalest-badge-warning' :
                                        order.status === 'production' ? 'arbalest-badge-info' :
                                            'arbalest-badge-success'
                                        }`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>

                                <div className="arbalest-card-body">
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label>Quantidade</label>
                                            <span className="quantity-badge">{order.quantity} {order.unit}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label>Loja</label>
                                            <span>{order.requester_store?.name || 'Loja desconhecida'}</span>
                                        </div>
                                    </div>

                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label>Código / EAN</label>
                                            <span>{order.product?.code || '-'}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label>Pedido Em</label>
                                            <span>
                                                {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} {' '}
                                                {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>


                                {/* Action Footer - Only render if there are actions available */}
                                {(canProduce && order.status === 'pending') ||
                                    (canRequest && order.status === 'production') ||
                                    (canProduce && order.status === 'production') ||
                                    (canRequest && order.status === 'pending') ? (
                                    <div className="arbalest-card-footer">
                                        {canProduce && (
                                            <button
                                                className={`arbalest-btn mobile-no-hover ${printQueue.includes(order.id) ? 'arbalest-btn-outline-warning' : 'arbalest-btn-primary'}`}
                                                onClick={() => handleToggleQueue(order.id)}
                                            >
                                                {printQueue.includes(order.id) ? 'Remover da impressão' : 'Adicionar à impressão'} <Printer size={16} />
                                            </button>
                                        )}
                                        {canRequest && order.status === 'production' && (
                                            <button
                                                className="arbalest-btn arbalest-btn-primary"
                                                onClick={() => handleUpdateStatus(order.id, 'received')}
                                            >
                                                Confirmar Recebimento <Check size={16} />
                                            </button>
                                        )}
                                        {canRequest && order.status === 'pending' && (
                                            <button
                                                className="arbalest-btn arbalest-btn-outline"
                                                style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                                                onClick={() => handleDeleteOrder(order.id)}
                                            >
                                                Cancelar Pedido <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ) : null}
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
                type="dashboard"
            />

            <AddButcherOrderModal
                isOpen={isAddOrderModalOpen}
                onClose={() => setIsAddOrderModalOpen(false)}
                onSuccess={() => {
                    // Refresh is automatic via realtime, but could force fetch here if needed
                    fetchOrders();
                }}
            />

            {/* Hidden Print Area */}
            <div id="print-area" className="print-only">
                <style>
                    {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #print-area, #print-area * {
                            visibility: visible;
                        }
                        #print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                            color: black;
                            padding: 20px;
                        }
                        .print-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        .print-table th, .print-table td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                            font-size: 12px;
                        }
                        .print-table th {
                            background-color: #f2f2f2;
                            font-weight: bold;
                        }
                        .qty-col {
                            font-weight: bold;
                            font-size: 14px;
                        }
                    }
                    .print-only {
                        display: none;
                    }
                    @media print {
                        .print-only {
                            display: block;
                        }
                    }
                    @media (max-width: 768px) {
                        .mobile-no-hover:hover {
                            transform: none !important;
                        }
                        .mobile-no-hover.arbalest-btn-primary:hover {
                            background: var(--brand-primary) !important;
                        }
                        .mobile-no-hover.arbalest-btn-outline-warning:hover {
                            background: transparent !important;
                            border-color: rgba(245, 158, 11, 0.3) !important;
                        }
                    }
                    `}
                </style>
                <div className="print-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '18px', margin: 0 }}>Lista de Produção - Açougue</h1>
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                </div>
                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Cód. / EAN</th>
                            <th>Loja</th>
                            <th style={{ textAlign: 'right' }}>Qtd</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.filter(o => printQueue.includes(o.id)).map(order => (
                            <tr key={order.id}>
                                <td>{order.product.name}</td>
                                <td>{order.product.code}{order.product.ean ? ` / ${order.product.ean}` : ''}</td>
                                <td>{order.requester_store.name}</td>
                                <td className="qty-col" style={{ textAlign: 'right' }}>{order.quantity} {order.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout >
    );
};
