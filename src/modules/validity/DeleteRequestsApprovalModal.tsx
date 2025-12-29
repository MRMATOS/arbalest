import React from 'react';
import { X, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { type ValidityEntry } from '../../hooks/useValidityEntries';
import { type Profile } from '../../contexts/AuthContext';
import './DeleteRequestsApprovalModal.css';

interface DeleteRequestsApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: ValidityEntry[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    user: Profile | null;
}

export const DeleteRequestsApprovalModal: React.FC<DeleteRequestsApprovalModalProps> = ({
    isOpen,
    onClose,
    entries,
    onApprove,
    onReject,
    user
}) => {
    if (!isOpen) return null;

    // Filter logic based on role
    const isEncarregado = user?.role === 'encarregado';

    // Filter pending requests
    const pendingRequests = entries.filter(e => {
        if (!e.has_pending_delete_request || !e.pending_delete_request) return false;

        // If Encarregado, only show their own requests
        try {
            if (isEncarregado) {
                return e.pending_delete_request.requested_by === user.id;
            }
        } catch (error: unknown) { // Changed 'error' to 'error: unknown' as per instruction
            // If an error occurs during the check, perhaps we should not show it,
            // or handle it based on specific requirements.
            // For now, returning false to exclude it if an error occurs during this specific check.
            console.error("Error checking encarregado's request:", error);
            return false; // Or handle as appropriate for your application's error policy
        }


        // Conferente/Admin sees all
        return true;
    });

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
                    <h2>{isEncarregado ? 'Solicitações de Exclusão' : 'Aprovar Exclusões'}</h2>
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

                                {!isEncarregado && (
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
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
