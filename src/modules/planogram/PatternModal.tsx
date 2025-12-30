import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';

export interface PatternData {
    id?: string;
    name: string;
    height_cm: number;
    width_cm: number;
    depth_cm: number;
    default_shelves_count: number;
}

interface PatternModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (pattern: PatternData) => void;
    patternToEdit?: PatternData | null;
}

export const PatternModal: React.FC<PatternModalProps> = ({ isOpen, onClose, onSuccess, patternToEdit }) => {
    const [formData, setFormData] = useState<PatternData>({
        name: '',
        height_cm: 0,
        width_cm: 0,
        depth_cm: 0,
        default_shelves_count: 0
    });

    useEffect(() => {
        if (patternToEdit) {
            setFormData(patternToEdit);
        } else {
            setFormData({
                name: '',
                height_cm: 0,
                width_cm: 0,
                depth_cm: 0,
                default_shelves_count: 0
            });
        }
    }, [patternToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSuccess(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={patternToEdit ? 'Editar Padrão' : 'Novo Padrão de Módulo'}
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                    <label>Nome do Padrão</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Gôndola Padrão Mercearia"
                        className="glass-input"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                        <label>Altura (cm)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.1"
                            value={formData.height_cm || ''}
                            onChange={e => setFormData({ ...formData, height_cm: parseFloat(e.target.value) })}
                            className="glass-input"
                            placeholder="0"
                        />
                    </div>
                    <div className="form-group">
                        <label>Largura (cm)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.1"
                            value={formData.width_cm || ''}
                            onChange={e => setFormData({ ...formData, width_cm: parseFloat(e.target.value) })}
                            className="glass-input"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                        <label>Profundidade (cm)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.1"
                            value={formData.depth_cm || ''}
                            onChange={e => setFormData({ ...formData, depth_cm: parseFloat(e.target.value) })}
                            className="glass-input"
                            placeholder="0"
                        />
                    </div>
                    <div className="form-group">
                        <label>Prateleiras (Padrão)</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.default_shelves_count || ''}
                            onChange={e => setFormData({ ...formData, default_shelves_count: parseInt(e.target.value) || 0 })}
                            className="glass-input"
                            placeholder="Ex: 5"
                        />
                    </div>
                </div>

                <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                        {patternToEdit ? 'Salvar Alterações' : 'Cadastrar Padrão'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
