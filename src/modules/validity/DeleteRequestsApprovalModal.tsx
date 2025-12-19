import React from 'react';
import { X, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { type ValidityEntry } from '../../hooks/useValidityEntries';
import './DeleteRequestsApprovalModal.css';

interface DeleteRequestsApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: ValidityEntry[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export const DeleteRequestsApprovalModal: React.FC<DeleteRequestsApprovalModalProps> = ({
    isOpen,
    onClose,
    entries,
    onApprove,
    onReject
}) => {
    if (!isOpen) return null;

    // Filter only pending requests
    const pendingRequests = entries.filter(e => e.has_pending_delete_request && e.pending_delete_request);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            className="approval-modal"
        >
            <div className="modal-header">
                <div className="header-title">
                    <AlertOctagon size={24} className="text-warning" />
                    <h2>Aprovar Exclusões</h2>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>
            </div>

            <div className="modal-body-approval-wrapper">
                {pendingRequests.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhuma solicitação de exclusão pendente.</p>
                    </div>
                ) : (
                    <div className="requests-list">
                        {pendingRequests.map(entry => (
                            <div key={entry.id} className="request-card glass">
                                <div className="request-info">
                                    <h4>{entry.product.name}</h4>
                                    <div className="meta-info">
                                        <span>Qtd: {entry.quantity}</span>
                                        <span>Val: {new Date(entry.expires_at).toLocaleDateString()}</span>
                                        {entry.lot && <span>Lote: {entry.lot}</span>}
                                    </div>
                                    <div className="reason-box">
                                        <span className="reason-label">Motivo:</span>
                                        <p className="reason-text">{entry.pending_delete_request?.reason}</p>
                                    </div>
                                    <div className="request-date">
                                        Solicitado em: {new Date(entry.pending_delete_request?.requested_at || '').toLocaleString()}
                                    </div>
                                </div>

                                <div className="request-actions">
                                    <button
                                        className="btn-reject"
                                        onClick={() => onReject(entry.id)}
                                        title="Rejeitar"
                                    >
                                        <X size={20} /> Rejeitar
                                    </button>
                                    <button
                                        className="btn-approve"
                                        onClick={() => onApprove(entry.id)}
                                        title="Aprovar"
                                    >
                                        <CheckCircle2 size={20} /> Aprovar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
