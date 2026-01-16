import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, History, Filter, Edit, Trash2, Printer, FileText } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useButcherOrders } from '../../hooks/useButcherOrders';
import { ButcherPermissions } from '../../utils/permissions';
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from '../../types/butcher';

export const ButcherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canRequest = ButcherPermissions.canRequest(user);
    const canProduce = ButcherPermissions.canProduce(user);
    const isProducerOnly = canProduce && !canRequest && !user?.is_admin;

    // Item 11 Updated: Production sees pending AND printed orders
    // Requesters see draft, pending, and printed (exclude completed)
    const statusFilter = isProducerOnly
        ? ['pending', 'printed']
        : ['draft', 'pending', 'printed'];

    const { orders, loading, error, deleteOrder, cleanupEmptyDrafts, refresh } = useButcherOrders({ statusFilter });

    // Cleanup empty drafts on mount
    React.useEffect(() => {
        const performCleanup = async () => {
            await cleanupEmptyDrafts();
            refresh();
        };
        performCleanup();
    }, [cleanupEmptyDrafts, refresh]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este pedido?')) {
            await deleteOrder(id);
        }
    };

    // Format date as DD/MM HH:mm
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month} ${hours}:${minutes}`;
    };

    // Check if order can be deleted
    const canDelete = (order: typeof orders[0]) => {
        if (user?.is_admin) return true;
        return !['printed', 'completed'].includes(order.status);
    };

    return (
        <DashboardLayout
            mobileHistory={
                <button className="nav-btn" onClick={() => navigate('/butcher/history')}>
                    <History size={24} />
                    <span>Histórico</span>
                </button>
            }
            mobileFilter={
                <button className="nav-btn">
                    <Filter size={24} />
                    <span>Filtrar</span>
                </button>
            }
            mobileModule={
                <button className="nav-btn active">
                    <FileText size={24} />
                    <span>Pedidos</span>
                </button>
            }
            mobileAction={
                canRequest ? (
                    <button className="nav-btn" onClick={() => navigate('/butcher/order/new')}>
                        <Plus size={24} />
                        <span>Pedir</span>
                    </button>
                ) : undefined
            }
        >
            <div className="arbalest-layout-container">
                {/* Header */}
                <div className="arbalest-header">
                    <div>
                        <h1>Pedidos do Açougue</h1>
                        <p>Total: {orders.length} pedidos</p>
                    </div>
                    <div className="arbalest-header-actions">
                        <button
                            className="arbalest-btn arbalest-btn-outline"
                            onClick={() => navigate('/butcher/history')}
                        >
                            <History size={18} />
                            Histórico
                        </button>
                        {canRequest && (
                            <button
                                className="arbalest-btn arbalest-btn-primary"
                                onClick={() => navigate('/butcher/order/new')}
                            >
                                <Plus size={18} />
                                Novo Pedido
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="arbalest-loading-state">
                        <p>Carregando pedidos...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="arbalest-error-state">
                        <p>{error}</p>
                    </div>
                )}

                {/* Desktop Table */}
                {!loading && !error && (
                    <div className="arbalest-table-container">
                        <table className="arbalest-table">
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Loja</th>
                                    <th>Data</th>
                                    <th>Qtd Itens</th>
                                    <th>Status</th>
                                    <th style={{ width: '100px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                                            Nenhum pedido encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map(order => (
                                        <tr
                                            key={order.id}
                                            onClick={() => navigate(`/butcher/order/${order.id}/edit`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
                                                    #{order.order_number}
                                                </span>
                                            </td>
                                            <td>{order.requester_store?.name || '-'}</td>
                                            <td>{formatDate(order.submitted_at || order.created_at)}</td>
                                            <td>{order.items.length}</td>
                                            <td>
                                                <span className={`arbalest-badge ${ORDER_STATUS_BADGE[order.status]}`}>
                                                    {ORDER_STATUS_LABELS[order.status]}
                                                </span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                {canRequest && (
                                                    <>
                                                        <button
                                                            className="arbalest-icon-btn"
                                                            onClick={() => navigate(`/butcher/order/${order.id}/edit`)}
                                                            title="Editar"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            className="arbalest-icon-btn"
                                                            onClick={() => handleDelete(order.id)}
                                                            disabled={!canDelete(order)}
                                                            style={{
                                                                color: canDelete(order) ? 'var(--error)' : 'var(--text-tertiary)',
                                                                opacity: canDelete(order) ? 1 : 0.5
                                                            }}
                                                            title={canDelete(order) ? 'Excluir' : 'Não pode excluir (já impresso)'}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {canProduce && (
                                                    <button
                                                        className="arbalest-icon-btn"
                                                        onClick={() => navigate(`/butcher/order/${order.id}/edit`)}
                                                        title="Imprimir"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Mobile Cards */}
                {!loading && !error && (
                    <div className="mobile-view">
                        <div className="card-list">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    className="arbalest-card"
                                    onClick={() => navigate(`/butcher/order/${order.id}/edit`)}
                                >
                                    <div className="arbalest-card-header">
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                                                #{order.order_number}
                                            </h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {order.requester_store?.name}
                                            </p>
                                        </div>
                                        <span className={`arbalest-badge ${ORDER_STATUS_BADGE[order.status]}`}>
                                            {ORDER_STATUS_LABELS[order.status]}
                                        </span>
                                    </div>
                                    <div className="arbalest-card-body">
                                        <div className="arbalest-card-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <div className="arbalest-card-info">
                                                <label>Pedido em</label>
                                                <span>{formatDate(order.submitted_at || order.created_at)}</span>
                                            </div>
                                            <div className="arbalest-card-info">
                                                {order.printed_at && (
                                                    <>
                                                        <label>Iniciado em</label>
                                                        <span>{formatDate(order.printed_at)}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="arbalest-card-info">
                                                <label>Itens</label>
                                                <span>{order.items.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ButcherDashboard;
