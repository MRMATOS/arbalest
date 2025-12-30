import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { Modal } from '../../../components/Modal';

interface Store {
    id: string;
    name: string;
    show_validity: boolean;
    show_planogram: boolean;
}

interface StoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeToEdit?: Store | null;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose, onSuccess, storeToEdit }) => {
    const [name, setName] = useState('');
    const [showValidity, setShowValidity] = useState(true);
    const [showPlanogram, setShowPlanogram] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (storeToEdit) {
                setName(storeToEdit.name);
                setShowValidity(storeToEdit.show_validity);
                setShowPlanogram(storeToEdit.show_planogram);
            } else {
                setName('');
                setShowValidity(true);
                setShowPlanogram(true);
            }
            setError(null);
        }
    }, [isOpen, storeToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (storeToEdit) {
                const { error } = await supabase
                    .from('stores')
                    .update({
                        name,
                        show_validity: showValidity,
                        show_planogram: showPlanogram
                    })
                    .eq('id', storeToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('stores')
                    .insert([{
                        name,
                        show_validity: showValidity,
                        show_planogram: showPlanogram
                    }]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving store:', err);
            setError(err.message || 'Erro ao salvar loja.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={storeToEdit ? 'Editar Loja' : 'Nova Loja'}
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '8px', color: 'var(--error)' }}>
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label>Nome da Loja</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Ex: Loja 01 - Centro"
                        className="glass-input"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Módulos Ativos</label>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 500 }}>Módulo de Validade</span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={showValidity}
                                onChange={(e) => setShowValidity(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 500 }}>Módulo de Planogramas</span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={showPlanogram}
                                onChange={(e) => setShowPlanogram(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Salvando...' : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={18} />
                                Salvar
                            </span>
                        )}
                    </button>
                </div>
            </form>
            <style>{`
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 48px;
                    height: 24px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255, 255, 255, 0.2);
                    transition: .4s;
                    border-radius: 24px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: var(--brand-primary);
                }
                input:checked + .slider:before {
                    transform: translateX(24px);
                }
            `}</style>
        </Modal>
    );
};
