import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Plus, History, Save, Trash2, Printer,
    FileText, Filter, CheckCircle, Copy
} from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useButcherOrders } from '../../hooks/useButcherOrders';
import { ButcherPermissions, getModuleStoreId } from '../../utils/permissions';
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from '../../types/butcher';
import type { ButcherOrder, ButcherOrderItem } from '../../types/butcher';
import { AddProductModal } from './components';

export const OrderEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getOrder, createOrder, updateOrderItems, updateOrderStatus, deleteOrder, copyOrder } = useButcherOrders();

    const [order, setOrder] = useState<ButcherOrder | null>(null);
    const [items, setItems] = useState<ButcherOrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fix: Check URL path instead of id param for new orders
    const isNew = location.pathname.endsWith('/order/new');
    const userStoreId = getModuleStoreId(user, 'butcher');

    // Determine edit permissions
    const canRequest = ButcherPermissions.canRequest(user);

    // Check if user belongs to the store that created the order (or is Admin)
    const isStoreOwner = user?.is_admin || !order || (userStoreId && order.requester_store_id === userStoreId);

    // Solicitantes podem editar pedidos draft ou pending APENAS da sua loja
    const canEdit = (isNew || ((order?.status === 'draft' || order?.status === 'pending') && ButcherPermissions.canEdit(user))) && isStoreOwner;

    // Item 14: Producers can print/re-print at any time (removed status === 'pending' check)
    const canProduce = !isNew && ButcherPermissions.canProduce(user);
    const canRemoveItems = canEdit;

    useEffect(() => {
        const loadOrder = async () => {
            console.log('🔍 loadOrder called, id:', id, 'isNew:', isNew, 'userStoreId:', userStoreId);

            // Wait for user to be loaded before creating order
            if (isNew && !userStoreId) {
                console.log('⏳ Waiting for user store ID to load...');
                return; // Will re-run when userStoreId changes
            }

            if (isNew) {
                // Create new draft order
                console.log('📝 Creating new order for store:', userStoreId);
                try {
                    const newOrder = await createOrder(userStoreId!, []);
                    console.log('✅ Order created:', newOrder);
                    if (newOrder) {
                        navigate(`/butcher/order/${newOrder.id}/edit`, { replace: true });
                    }
                } catch (err) {
                    console.error('❌ Failed to create order:', err);
                    alert('Erro ao criar pedido. Verifique o console.');
                    navigate('/butcher');
                }
                return;
            }

            if (id) {
                console.log('📦 Loading existing order:', id);
                const data = await getOrder(id);
                console.log('📦 Order data:', data);
                if (data) {
                    setOrder(data);
                    setItems(data.items);
                } else {
                    console.error('❌ Order not found');
                }
            }
            setLoading(false);
        };

        loadOrder();
    }, [id, isNew, userStoreId]); // Added userStoreId as dependency

    // Auto-save items when they change (debounced)
    useEffect(() => {
        if (!order || loading) return;

        const timeout = setTimeout(async () => {
            await updateOrderItems(order.id, items);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [items]);

    // Refs to track current state for cleanup
    const orderRef = React.useRef(order);
    const itemsRef = React.useRef(items);

    // Update refs whenever state changes
    useEffect(() => {
        orderRef.current = order;
        itemsRef.current = items;
    }, [order, items]);

    // Auto-discard empty draft orders when leaving the page (unmount only)
    useEffect(() => {
        return () => {
            const currentOrder = orderRef.current;
            const currentItems = itemsRef.current;

            // Only discard if order exists, is a draft, and has no items
            if (currentOrder && currentOrder.status === 'draft' && currentItems.length === 0) {
                console.log('🗑️ Auto-discarding empty draft order:', currentOrder.id);
                deleteOrder(currentOrder.id);
            }
        };
    }, []); // Empty dependency array ensures this ONLY runs on unmount

    const handleAddProduct = (product: ButcherOrderItem) => {
        // Check if product already exists
        const existing = items.find(i => i.product_id === product.product_id);
        if (existing) {
            // Update quantity
            setItems(prev => prev.map(i =>
                i.product_id === product.product_id
                    ? { ...i, quantity: i.quantity + product.quantity }
                    : i
            ));
        } else {
            setItems(prev => [...prev, product]);
        }
        setIsAddModalOpen(false);
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        setItems(prev => prev.map(i =>
            i.product_id === productId ? { ...i, quantity } : i
        ));
    };

    const handleRemoveItem = (productId: string) => {
        if (!canRemoveItems) return;
        setItems(prev => prev.filter(i => i.product_id !== productId));
    };

    const handleFinalize = async () => {
        if (!order) return;
        setSaving(true);
        await updateOrderItems(order.id, items);
        await updateOrderStatus(order.id, 'pending');
        setSaving(false);
        navigate('/butcher');
    };

    const handleDelete = async () => {
        if (!order) return;
        if (confirm('Tem certeza que deseja excluir este pedido?')) {
            await deleteOrder(order.id);
            navigate('/butcher');
        }
    };

    const handlePrint = async () => {
        if (!order) return;

        if (items.length === 0) {
            alert('Nenhum item para imprimir');
            return;
        }

        try {
            // Import PDF utility dynamically
            const { downloadButcherOrderPDF } = await import('../../utils/butcherPdf');

            // Generate and download PDF for all items
            downloadButcherOrderPDF(order, items);

            // Show success message
            alert(`PDF gerado com ${items.length} item(s) do pedido #${order.order_number}`);

            // Update status to printed
            const success = await updateOrderStatus(order.id, 'printed');

            if (success) {
                setOrder(prev => prev ? { ...prev, status: 'printed' } : null);
            }
        } catch (err) {
            console.error('❌ Error generating PDF:', err);
            alert('Erro ao gerar PDF. Verifique o console.');
        }
    };

    const handleComplete = async () => {
        if (!order) return;
        await updateOrderStatus(order.id, 'completed');
        navigate('/butcher/history');
    };

    const handleCopyOrder = async () => {
        if (!order) return;
        const newOrder = await copyOrder(order.id);
        if (newOrder) {
            navigate(`/butcher/order/${newOrder.id}/edit`);
        }
    };

    // Format unit display
    const formatUnit = (unit: string) => {
        return unit === 'bandeja' ? 'Bandejas' : 'Kg';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="arbalest-layout-container">
                    <div className="arbalest-loading-state">
                        <p>Carregando pedido...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

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
                <button
                    className={`nav-btn ${location.pathname.startsWith('/butcher/order') ? 'active' : ''}`}
                    onClick={() => navigate('/butcher')}
                >
                    <FileText size={24} />
                    <span>Pedidos</span>
                </button>
            }
            mobileAction={
                /* Logic:
                   - If Manager (Request + Produce):
                        - Draft/Pending (canEdit): Show Add (Request action).
                        - Printed: Show Print (Produce action, replacing Add).
                        - Completed: Show Copy.
                   - If Request only: Show Add/Copy.
                   - If Produce only: Show Print.
                */
                (canRequest && canProduce) ? (
                    canEdit ? (
                        <button className="nav-btn" onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={24} />
                            <span>Adicionar</span>
                        </button>
                    ) : (order?.status === 'printed') ? (
                        <button className="nav-btn" onClick={handlePrint}>
                            <Printer size={24} />
                            <span>Imprimir</span>
                        </button>
                    ) : (order?.status === 'completed') ? (
                        <button className="nav-btn" onClick={handleCopyOrder}>
                            <Copy size={24} />
                            <span>Copiar</span>
                        </button>
                    ) : undefined
                ) : canRequest ? (
                    canEdit ? (
                        <button className="nav-btn" onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={24} />
                            <span>Adicionar</span>
                        </button>
                    ) : order?.status === 'completed' ? (
                        <button className="nav-btn" onClick={handleCopyOrder}>
                            <Copy size={24} />
                            <span>Copiar</span>
                        </button>
                    ) : undefined
                ) : canProduce ? (
                    <button className="nav-btn" onClick={handlePrint}>
                        <Printer size={24} />
                        <span>Imprimir</span>
                    </button>
                ) : undefined
            }
        >
            <div className="arbalest-layout-container">
                {/* Header */}
                <div className="arbalest-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Item 8: Removed left back button */}
                            <h1>
                                {order ? `Pedido #${order.order_number}` : 'Novo Pedido'}
                            </h1>
                        </div>
                        <p style={{ marginLeft: '40px' }}>
                            {order?.requester_store?.name || ''} -
                            <span className={`arbalest-badge ${ORDER_STATUS_BADGE[order?.status || 'draft']}`} style={{ marginLeft: '8px' }}>
                                {ORDER_STATUS_LABELS[order?.status || 'draft']}
                            </span>
                        </p>
                    </div>

                    <div className="arbalest-header-actions">
                        <button
                            className="arbalest-btn arbalest-btn-outline"
                            onClick={() => navigate('/butcher')}
                        >
                            <ArrowLeft size={18} />
                            Voltar
                        </button>
                        {canEdit && (
                            <>
                                <button
                                    className="arbalest-btn arbalest-btn-primary"
                                    onClick={() => setIsAddModalOpen(true)}
                                >
                                    <Plus size={18} />
                                    Adicionar Produto
                                </button>
                            </>
                        )}
                        {!canEdit && canRequest && !isNew && order?.status === 'completed' && (
                            <button
                                className="arbalest-btn arbalest-btn-outline"
                                onClick={handleCopyOrder}
                            >
                                <Copy size={18} />
                                Copiar Pedido
                            </button>
                        )}
                        {canProduce && (
                            <>
                                <button
                                    className="arbalest-btn arbalest-btn-outline"
                                    onClick={handlePrint}
                                >
                                    <Printer size={18} />
                                    Imprimir Pedido
                                </button>
                                {order?.status === 'printed' && (
                                    <button
                                        className="arbalest-btn arbalest-btn-primary"
                                        onClick={handleComplete}
                                    >
                                        <CheckCircle size={18} />
                                        Concluir
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="arbalest-table-container">
                    <table className="arbalest-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Obs</th>
                                <th>Código</th>
                                <th style={{ width: '120px' }}>Quantidade</th>
                                <th>Unidade</th>
                                {canEdit && <th style={{ width: '80px' }}>Ação</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={canEdit ? 6 : 5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                                        Nenhum item adicionado
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <tr key={`${item.product_id}-${idx}`}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {item.notes || '-'}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                            {item.product_code || '-'}
                                        </td>
                                        <td>
                                            {canEdit ? (
                                                <input
                                                    type="number"
                                                    className="arbalest-input"
                                                    style={{ width: '80px', padding: '4px 8px' }}
                                                    value={item.quantity || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleUpdateQuantity(
                                                        item.product_id,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                                            )}
                                        </td>
                                        <td>{formatUnit(item.unit)}</td>
                                        {canEdit && (
                                            <td style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                {canEdit && canRemoveItems && (
                                                    <button
                                                        className="arbalest-icon-btn"
                                                        style={{ color: 'var(--error)' }}
                                                        onClick={() => handleRemoveItem(item.product_id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="mobile-view">
                    <div className="card-list">
                        {items.map((item, idx) => (
                            <div key={`${item.product_id}-${idx}`} className="arbalest-card">
                                <div className="arbalest-card-header">
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.product_name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {item.product_code}
                                        </p>
                                    </div>


                                </div>
                                <div className="arbalest-card-body">
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label>Unidade</label>
                                            <span>{formatUnit(item.unit)}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label>Quantidade</label>
                                            {canEdit ? (
                                                <input
                                                    type="number"
                                                    className="arbalest-input"
                                                    style={{
                                                        width: '80px',
                                                        padding: '6px 8px',
                                                        textAlign: 'right'
                                                    }}
                                                    value={item.quantity || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleUpdateQuantity(
                                                        item.product_id,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes at bottom */}
                                    {item.notes && (
                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            <strong>Obs:</strong> {item.notes}
                                        </div>
                                    )}
                                </div>

                                {/* Footer with delete button - Following Validity pattern */}
                                {canEdit && canRemoveItems && (
                                    <div className="arbalest-card-footer">
                                        <button
                                            className="arbalest-btn arbalest-btn-outline-danger"
                                            onClick={() => handleRemoveItem(item.product_id)}
                                        >
                                            <Trash2 size={16} />
                                            Excluir
                                        </button>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                {canEdit && (!order || order.status === 'draft' || order.status === 'pending') && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 0 8px 0',
                        marginTop: '16px'
                    }}>
                        {items.length === 0 ? (
                            <div style={{
                                width: '100%',
                                textAlign: 'center',
                                color: 'var(--brand-primary)',
                                fontSize: '1rem',
                                padding: '12px'
                            }}>
                                Toque em <strong>Adicionar</strong> para inserir um produto
                            </div>
                        ) : (
                            <>
                                <button
                                    className="arbalest-btn arbalest-btn-outline-danger"
                                    onClick={order?.status === 'pending' ? () => navigate('/butcher') : handleDelete}
                                    disabled={!order}
                                >
                                    <Trash2 size={18} />
                                    {order?.status === 'pending' ? 'Cancelar Edição' : 'Excluir Pedido'}
                                </button>
                                <button
                                    className="arbalest-btn arbalest-btn-primary"
                                    onClick={handleFinalize}
                                    disabled={saving || items.length === 0 || !order}
                                >
                                    <Save size={18} />
                                    {saving ? 'Salvando...' : (order?.status === 'pending' ? 'Atualizar Pedido' : 'Finalizar Pedido')}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Mobile-only Print Button for Managers/Producers */}
                {/* This appears below the main actions as requested */}
                {/* Mobile-only Actions for Producers/Managers (Body) */}
                {/* 
                    Logic:
                    - Producer: Never sees Print here (in Nav). If Printed, sees Conclude.
                    - Manager: 
                        - Draft/Pending: Sees Print (Nav has Add).
                        - Printed: Sees Conclude (Nav has Print).
                */}
                {canProduce && order && items.length > 0 && (
                    <div className="mobile-view" style={{ marginTop: '16px', paddingBottom: '16px' }}>
                        {order.status === 'printed' ? (
                            <button
                                className="arbalest-btn arbalest-btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={handleComplete}
                            >
                                <CheckCircle size={18} />
                                Concluir Pedido
                            </button>
                        ) : (canRequest && order.status !== 'completed') ? (
                            /* Only Manager sees Print in body for non-printed/non-completed orders (Draft/Pending) */
                            <button
                                className="arbalest-btn arbalest-btn-outline"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={handlePrint}
                            >
                                <Printer size={18} />
                                Imprimir Pedido
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddProduct}
            />
        </DashboardLayout >
    );
};

export default OrderEditPage;
