import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    showCloseButton = true
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle Escape Key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent scrolling when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Handle Click Outside
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-content glass ${className}`} ref={modalRef}>
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        {title && <h2>{title}</h2>}
                        {showCloseButton && (
                            <button className="close-btn" onClick={onClose}>
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body-wrapper">
                    {children}
                </div>
            </div>
        </div>
    );
};
