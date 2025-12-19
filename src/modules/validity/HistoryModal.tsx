import React from 'react';
import { ArrowRight, User } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useValidityHistory } from '../../hooks/useValidityHistory';
import './HistoryModal.css';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entryId: string | null;
    productName?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    entryId,
    productName
}) => {
    const { history, loading } = useValidityHistory(isOpen ? entryId : null);

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFieldLabel = (field: string) => {
        const labels: Record<string, string> = {
            'expires_at': 'Validade',
            'quantity': 'Quantidade',
            'lot': 'Lote',
            'status': 'Status'
        };
        return labels[field] || field;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Histórico de Alterações"
            className="history-modal"
        >
            <div className="history-content-wrapper">
                {productName && (
                    <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Produto: <strong style={{ color: 'var(--text-primary)' }}>{productName}</strong>
                    </div>
                )}

                {loading ? (
                    <div className="spinner" style={{ alignSelf: 'center', margin: '2rem' }} />
                ) : history.length === 0 ? (
                    <div className="empty-history">
                        Nenhuma alteração registrada.
                    </div>
                ) : (
                    history.map(item => (
                        <div key={item.id} className="history-item">
                            <div className="history-icon">
                                <User size={12} />
                            </div>
                            <div className="history-details">
                                <div className="history-meta">
                                    <span>{formatDate(item.changed_at)}</span>
                                </div>
                                <div className="field-change">
                                    Alterou <span className="field-name">{getFieldLabel(item.field_name)}</span>
                                </div>
                                <div className="values">
                                    <span className="old-value">{item.old_value || 'Vazio'}</span>
                                    <ArrowRight size={12} className="arrow" />
                                    <span className="new-value">{item.new_value}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};
