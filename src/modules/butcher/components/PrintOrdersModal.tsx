import React, { useState } from 'react';
import { Printer, Check, Loader } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { supabase } from '../../../services/supabase';
import '../styles/PrintOrdersModal.css';

interface PrintOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PrintableOrder {
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
    requester_store: {
        name: string;
    };
    created_at: string;
}

export const PrintOrdersModal: React.FC<PrintOrdersModalProps> = ({ isOpen, onClose }) => {
    const [orders, setOrders] = useState<PrintableOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [selection, setSelection] = useState<string[]>([]);
    const [printing, setPrinting] = useState(false);

    // Load available orders when modal opens
    React.useEffect(() => {
        if (isOpen) {
            fetchPendingOrders();
        }
    }, [isOpen]);

    const fetchPendingOrders = async () => {
        setLoading(true);
        try {
            // 1. Fetch Orders from Butcher Schema
            const { data: ordersData, error: ordersError } = await supabase
                .schema('butcher')
                .from('orders')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true }); // Oldest first for production priority

            if (ordersError) throw ordersError;

            // 2. Extract IDs
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

            // 5. Create Maps
            const productsMap = new Map((productsData || []).map((p: any) => [p.id, p]));
            const storesMap = new Map((storesData || []).map((s: any) => [s.id, s]));

            // 6. Merge Data
            const formattedData = (ordersData || []).map((item: any) => ({
                ...item,
                product: productsMap.get(item.product_id) || { name: 'Produto não encontrado', code: '-' },
                requester_store: storesMap.get(item.requester_store_id) || { name: 'Loja desconhecida' }
            }));

            setOrders(formattedData);
            setSelection([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (selection.length === 0) return;
        setPrinting(true);

        try {
            // 1. Update Status
            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .update({
                    status: 'production',
                    printed_at: new Date().toISOString()
                })
                .in('id', selection);

            if (error) throw error;

            // 2. Trigger Print
            // Small delay to ensure status update is processed and UI updates if needed
            setTimeout(() => {
                window.print();
                setPrinting(false);
                onClose();
            }, 500);

        } catch (err) {
            console.error('Error printing:', err);
            alert('Erro ao processar impressão: ' + (err as any).message);
            setPrinting(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelection(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selection.length === orders.length) setSelection([]);
        else setSelection(orders.map(o => o.id));
    };

    return (
        <React.Fragment>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Imprimir Pedidos de Produção"
            >
                <div className="print-modal-container">
                    <div className="modal-header-actions">
                        <button
                            className="btn-secondary"
                            onClick={selectAll}
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                            {selection.length === orders.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                        <span className="selection-count">
                            {selection.length} pedido{selection.length !== 1 ? 's' : ''} selecionado{selection.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="orders-selection-list">
                        {loading ? (
                            <div className="empty-state">
                                <Loader className="spinner" size={24} />
                                <span style={{ marginLeft: 8 }}>Carregando pedidos...</span>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="empty-state">
                                <p>Não há pedidos pendentes para impressão.</p>
                            </div>
                        ) : (
                            orders.map(order => {
                                const isSelected = selection.includes(order.id);
                                return (
                                    <div
                                        key={order.id}
                                        className={`order-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSelect(order.id)}
                                    >
                                        <div className="checkbox-custom">
                                            {isSelected && <Check size={14} strokeWidth={3} />}
                                        </div>

                                        <div className="order-details">
                                            <div className="main-row">
                                                <span className="product-name">
                                                    {order.product?.name || 'Produto Desconhecido'}
                                                </span>
                                                <span className="quantity-pill">
                                                    {order.quantity} {order.unit}
                                                </span>
                                            </div>

                                            <div className="sub-row">
                                                <span>Filial: {order.requester_store?.name || 'N/A'}</span>
                                                <span className="divider">•</span>
                                                <span>Prod: {order.product.code}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={printing}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-confirm-print"
                            onClick={handlePrint}
                            disabled={printing || selection.length === 0}
                        >
                            {printing ? (
                                <>
                                    <Loader size={18} className="spinner" />
                                    <span>Imprimindo...</span>
                                </>
                            ) : (
                                <>
                                    <Printer size={18} />
                                    <span>Confirmar e Imprimir</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Hidden Print Layout - Only Valid When Printing */}
            <div id="print-area">
                <div className="print-header">
                    <h1>Lista de Produção - Açougue</h1>
                    <p>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                </div>
                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Cód. / EAN</th>
                            <th>Loja</th>
                            <th style={{ textAlign: 'right' }}>Qtd</th>
                            <th>SIM/POA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.filter(o => selection.includes(o.id)).map(order => (
                            <tr key={order.id}>
                                <td>{order.product.name}</td>
                                <td>{order.product.code}{order.product.ean ? ` / ${order.product.ean}` : ''}</td>
                                <td>{order.requester_store.name}</td>
                                <td className="qty-col" style={{ textAlign: 'right' }}>{order.quantity} {order.unit}</td>
                                <td>{order.sim_poa_code || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </React.Fragment>
    );
};
