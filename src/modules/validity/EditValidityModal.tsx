import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useValidityEntries, type ValidityEntry } from '../../hooks/useValidityEntries';
import './AddValidityModal.css'; // Reuse styles

interface EditValidityModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: ValidityEntry | null;
    onSuccess?: () => void;
}

export const EditValidityModal: React.FC<EditValidityModalProps> = ({ isOpen, onClose, entry, onSuccess }) => {
    const { updateEntry } = useValidityEntries();
    const [formData, setFormData] = useState({
        expires_at: '',
        lot: '',
        quantity: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (entry) {
            setFormData({
                expires_at: entry.expires_at.split('T')[0],
                lot: entry.lot || '',
                quantity: entry.quantity.toString()
            });
        }
    }, [entry]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entry) return;

        setSaving(true);
        setError(null);

        try {
            await updateEntry(entry.id, {
                expires_at: formData.expires_at,
                lot: formData.lot || null,
                quantity: parseFloat(formData.quantity)
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating validity:', err);
            if (err instanceof Error) setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !entry) return null;

    if (!isOpen || !entry) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Registro"
        >
            <form onSubmit={handleSubmit} className="modal-body-content">
                <div className="selected-product glass">
                    <div className="product-header">
                        <Package size={20} />
                        <div className="product-details">
                            <span className="name">{entry.product.name}</span>
                            <span className="code">
                                {entry.product.ean && `${entry.product.ean} • `}
                                {entry.product.code}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="form-fields">
                    <div className="form-group">
                        <label>Data de Validade *</label>
                        <input
                            type="date"
                            value={formData.expires_at}
                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Quantidade *</label>
                        <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Lote</label>
                        <input
                            type="text"
                            value={formData.lot}
                            onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                        />
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Atualizar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
