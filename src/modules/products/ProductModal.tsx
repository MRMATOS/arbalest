import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { X, Save } from 'lucide-react';
import './ProductModal.css';

interface Product {
    id: string;
    code: string;
    ean: string | null;
    name: string;
    supplier: string | null;
    type: string | null;
    is_active: boolean;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product;
    onSuccess: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        ean: '',
        name: '',
        supplier: '',
        type: 'mercado'
    });

    useEffect(() => {
        if (product) {
            setFormData({
                code: product.code,
                ean: product.ean || '',
                name: product.name,
                supplier: product.supplier || '',
                type: product.type || 'mercado'
            });
        } else {
            setFormData({
                code: '',
                ean: '',
                name: '',
                supplier: '',
                type: 'mercado'
            });
        }
    }, [product, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                code: formData.code,
                ean: formData.ean || null,
                name: formData.name.toUpperCase(),
                supplier: formData.supplier?.toUpperCase() || null,
                type: formData.type,
                updated_at: new Date().toISOString()
            };

            let error;

            if (product) {
                // Update
                const { error: updateError } = await supabase
                    .from('products')
                    .update(dataToSave)
                    .eq('id', product.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([{
                        ...dataToSave,
                        is_active: true
                    }]);
                error = insertError;
            }

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto. Verifique se o código já existe.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="product-modal-overlay">
            <div className="product-modal">
                <div className="product-modal-header">
                    <h2>{product ? 'Editar Produto' : 'Novo Produto'}</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form className="product-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Código Interno *</label>
                            <input
                                required
                                type="text"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Ex: 123"
                            />
                        </div>
                        <div className="form-group">
                            <label>EAN (Código de Barras)</label>
                            <input
                                type="text"
                                value={formData.ean}
                                onChange={e => setFormData({ ...formData, ean: e.target.value })}
                                placeholder="Ex: 789..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nome do Produto *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: ARROZ BRANCO TIPO 1"
                        />
                    </div>

                    <div className="form-group">
                        <label>Fornecedor</label>
                        <input
                            type="text"
                            value={formData.supplier}
                            onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="Ex: DISTRIBUIDORA XYZ"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo / Categoria</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="mercado">Mercado</option>
                            <option value="farmacia">Farmácia</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
