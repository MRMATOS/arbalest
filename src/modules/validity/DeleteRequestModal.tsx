import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import '../../components/ConfirmModal.css'; // Reusing ConfirmModal styles for buttons

interface DeleteRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    productName: string;
}

export const DeleteRequestModal: React.FC<DeleteRequestModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    productName
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Solicitar Exclusão"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error)', marginBottom: '8px' }}>
                    <Trash2 size={24} />
                    <p style={{ fontWeight: 500 }}>
                        Solicitando exclusão para: <strong style={{ color: 'var(--text-primary)' }}>{productName}</strong>
                    </p>
                </div>

                <div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Motivo da exclusão (obrigatório):</p>
                    <textarea
                        autoFocus
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ex: Produto cadastrado errado; Vencimento incorreto..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '12px',
                            color: 'var(--text-primary)',
                            resize: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <div className="confirm-footer" style={{ marginTop: '8px', padding: 0, border: 'none' }}>
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn-confirm danger"
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        style={{ opacity: !reason.trim() ? 0.5 : 1 }}
                    >
                        Solicitar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
