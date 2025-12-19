import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Modal } from './Modal';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning'
}) => {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            className={`confirm-modal ${type}`}
        >
            <div className={`confirm-header ${type}`}>
                <AlertTriangle size={24} />
                <h2>{title}</h2>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="confirm-body">
                <p>{message}</p>
            </div>

            <div className="confirm-footer">
                <button className="btn-cancel" onClick={onClose}>
                    {cancelText}
                </button>
                <button
                    className={`btn-confirm ${type}`}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};
