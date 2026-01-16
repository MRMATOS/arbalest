import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Filter, FileText, Copy, ArrowLeft, Plus } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useButcherOrders } from '../../hooks/useButcherOrders';
import { ButcherPermissions } from '../../utils/permissions';
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from '../../types/butcher';

export const ButcherHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { orders, loading, error, copyOrder } = useButcherOrders({ historyOnly: true });

    const canRequest = ButcherPermissions.canRequest(user);

    const handleCopyOrder = async (orderId: string) => {
        const newOrder = await copyOrder(orderId);
        if (newOrder) {
            navigate(`/butcher/order/${newOrder.id}/edit`);
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

    return (
        <DashboardLayout
            mobileHistory={
                <button className="nav-btn active">
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
                <button className="nav-btn" onClick={() => navigate('/butcher')}>
                    <FileText size={24} />
                    <span>Pedidos</span>
                </button>
            }
            mobileAction={
                <button className="nav-btn" onClick={() => navigate('/butcher/order/new')}>
                    <Plus size={24} />
                    <span>Pedir</span>
                </button>
            }
        >
            <div className="arbalest-layout-container">
                {/* Header */}
                {/* Header */}
                <div className="arbalest-header">
                    <div>
                        <h1>Histórico de Pedidos</h1>
                        <p>Pedidos concluídos e entregues</p>
                    </div>
                    <div className="arbalest-header-actions">
                        <button
                            className="arbalest-btn arbalest-btn-outline"
                            onClick={() => navigate('/butcher')}
                        >
                            <ArrowLeft size={18} />
                            Voltar
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="arbalest-loading-state">
                        <p>Carregando histórico...</p>
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
                                    <th>Data Pedido</th>
                                    <th>Concluído em</th>
                                    <th>Qtd Itens</th>
                                    <th>Status</th>
                                    {canRequest && <th style={{ width: '80px' }}>Ação</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={canRequest ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                                            Nenhum pedido no histórico
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
                                            <td>{formatDate(order.created_at)}</td>
                                            <td>{order.completed_at ? formatDate(order.completed_at) : '-'}</td>
                                            <td>{order.items.length}</td>
                                            <td>
                                                <span className={`arbalest-badge ${ORDER_STATUS_BADGE[order.status]}`}>
                                                    {ORDER_STATUS_LABELS[order.status]}
                                                </span>
                                            </td>
                                            {canRequest && (
                                                <td onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className="arbalest-btn arbalest-btn-outline"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        onClick={() => handleCopyOrder(order.id)}
                                                        title="Copiar Pedido"
                                                    >
                                                        <Copy size={16} />
                                                        Copiar
                                                    </button>
                                                </td>
                                            )}
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
                                        <div className="arbalest-card-row">
                                            <div className="arbalest-card-info">
                                                <label>Concluído em</label>
                                                <span>{formatDate(order.completed_at || order.created_at)}</span>
                                            </div>
                                            <div className="arbalest-card-info">
                                                <label>Itens</label>
                                                <span>{order.items.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {canRequest && (
                                        <div className="arbalest-card-footer" onClick={e => e.stopPropagation()}>
                                            <button
                                                className="arbalest-btn arbalest-btn-outline"
                                                onClick={() => handleCopyOrder(order.id)}
                                            >
                                                <Copy size={18} />
                                                Copiar Pedido
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ButcherHistory;
