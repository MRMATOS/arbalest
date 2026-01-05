import React, { useState } from 'react';
import { Printer, Check } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { supabase } from '../../../services/supabase';

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

    // Filters
    const [period, setPeriod] = useState('all'); // 1h, 4h, today, all

    // Load available orders when modal opens
    React.useEffect(() => {
        if (isOpen) {
            fetchPendingOrders();
        }
    }, [isOpen]);

    const fetchPendingOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .schema('butcher')
                .from('orders')
                .select(`
                    id, quantity, unit, created_at, sim_poa_code,
                    product:product_id (name, code, ean, meat_group),
                    requester_store:requester_store_id (name)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true }); // Oldest first for production priority

            if (error) throw error;

            // Map to handle potential array returns from joins
            const formattedData = (data || []).map((item: any) => ({
                ...item,
                product: Array.isArray(item.product) ? item.product[0] : item.product,
                requester_store: Array.isArray(item.requester_store) ? item.requester_store[0] : item.requester_store
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
            // We'll create a temporary print structure or use a dedicated route? 
            // For simplicity, we'll try to just print the current selection via a print-only visible section
            // or better, a hidden iframe approach, but let's stick to simple window.print() + CSS media queries hiding everything else.

            // To do this effectively, we need to render the print layout into the DOM first.
            // We'll trust the user to hit print dialog.
            window.print();

            onClose();
        } catch (err) {
            console.error('Error printing:', err);
            alert('Erro ao processar impressão.');
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
            <Modal isOpen={isOpen} onClose={onClose} title="Imprimir Lista de Produção">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '600px' }}>
                    <div className="modal-header-actions">
                        <button className="btn-secondary small" onClick={selectAll}>
                            {selection.length === orders.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                        <span className="selection-count">{selection.length} pedidos selecionados</span>
                    </div>

                    <div className="orders-selection-list">
                        {loading ? (
                            <p>Carregando...</p>
                        ) : orders.length === 0 ? (
                            <p className="empty">Nenhum pedido pendente para produção.</p>
                        ) : (
                            orders.map(order => (
                                <div
                                    key={order.id}
                                    className={`order-item ${selection.includes(order.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelect(order.id)}
                                >
                                    <div className="checkbox">
                                        {selection.includes(order.id) && <Check size={14} />}
                                    </div>
                                    <div className="order-details">
                                        <div className="main-row">
                                            <strong>{order.product.name}</strong>
                                            <span className="qty">{order.quantity} {order.unit}</span>
                                        </div>
                                        <div className="sub-row">
                                            <span>{order.requester_store.name}</span>
                                            <span className="divider">•</span>
                                            <span>{order.product.code}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn-primary full-width" onClick={handlePrint} disabled={selection.length === 0}>
                            <Printer size={18} />
                            Confirmar e Imprimir
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
                            <th>Qtd</th>
                            <th>SIM/POA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.filter(o => selection.includes(o.id)).map(order => (
                            <tr key={order.id}>
                                <td>{order.product.name}</td>
                                <td>{order.product.code}</td>
                                <td>{order.requester_store.name}</td>
                                <td className="bold">{order.quantity} {order.unit}</td>
                                <td>{order.sim_poa_code || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .orders-selection-list {
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    background: rgba(0,0,0,0.2);
                }
                .order-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .order-item:hover {
                    background: rgba(255,255,255,0.05);
                }
                .order-item.selected {
                    background: rgba(244, 63, 94, 0.1); /* Rose tint */
                }
                .checkbox {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .selected .checkbox {
                    background: var(--brand-primary);
                    border-color: var(--brand-primary);
                }
                .order-details {
                    flex: 1;
                }
                .main-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .sub-row {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    display: flex;
                    gap: 8px;
                }
                .qty {
                    font-weight: bold;
                    color: var(--brand-primary);
                }

                /* PRINT STYLES */
                @media screen {
                    #print-area {
                        display: none;
                    }
                }
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
                    
                    /* Reset Dark Mode for Print */
                    .print-header {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                    }
                    .print-header h1 {
                        font-size: 24px;
                        margin: 0;
                    }
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .print-table th {
                        border-bottom: 1px solid #000;
                        text-align: left;
                        padding: 8px;
                        font-weight: bold;
                    }
                    .print-table td {
                        border-bottom: 1px solid #ddd;
                        padding: 8px;
                    }
                    .print-table .bold {
                        font-weight: bold;
                        font-size: 1.1em;
                    }
                }
            `}</style>
        </React.Fragment>
    );
};
