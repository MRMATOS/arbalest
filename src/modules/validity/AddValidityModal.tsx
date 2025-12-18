import React, { useState, useRef } from 'react';
import { X, Search, Loader, Package, Camera } from 'lucide-react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './AddValidityModal.css';

interface AddValidityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddValidityModal: React.FC<AddValidityModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { results, loading: searchLoading, search } = useProductSearch();
    const { user } = useAuth();
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        expires_at: '',
        lot: '',
        quantity: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        search(value);
    };

    const handleProductSelect = (product: any) => {
        setSelectedProduct(product);
        setSearchTerm('');
    };

    const handleCameraClick = () => {
        cameraInputRef.current?.click();
    };

    const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // TODO: Integrate barcode scanner library here
            console.log('Camera capture:', file);
            alert('Funcionalidade de scanner de código de barras será implementada em breve!');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProduct || !user) return;

        setSaving(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .schema('validity')
                .from('validity_entries')
                .insert({
                    product_id: selectedProduct.id,
                    store_id: user.store_id,
                    expires_at: formData.expires_at,
                    lot: formData.lot || null,
                    quantity: parseFloat(formData.quantity),
                    created_by: user.id,
                    status: 'ativo'
                });

            if (insertError) throw insertError;

            // Success - reset and close
            setSelectedProduct(null);
            setFormData({ expires_at: '', lot: '', quantity: '' });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving validity entry:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setSelectedProduct(null);
        setSearchTerm('');
        setFormData({ expires_at: '', lot: '', quantity: '' });
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Novo Registro de Validade</h2>
                    <button className="close-btn" onClick={handleClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Product Search Section */}
                    {!selectedProduct ? (
                        <div className="search-section">
                            <label>Buscar Produto</label>
                            <div className="search-input-wrapper">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Digite EAN, código ou nome do produto..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    autoFocus
                                />
                                {searchLoading && <Loader size={18} className="spinner" />}
                                <button
                                    type="button"
                                    className="camera-btn"
                                    onClick={handleCameraClick}
                                    title="Escanear código de barras"
                                >
                                    <Camera size={20} />
                                </button>
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCameraCapture}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Search Results */}
                            {results.length > 0 && (
                                <div className="search-results">
                                    {results.map((product: any) => (
                                        <div
                                            key={product.id}
                                            className="product-item"
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <Package size={20} />
                                            <div className="product-info">
                                                <span className="product-name">{product.name}</span>
                                                <span className="product-meta">
                                                    {product.ean && `EAN: ${product.ean} • `}
                                                    Código: {product.code}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchTerm.length >= 3 && results.length === 0 && !searchLoading && (
                                <div className="no-results">
                                    <Package size={32} />
                                    <p>Nenhum produto encontrado</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Selected Product Display */}
                            <div className="selected-product glass">
                                <div className="product-header">
                                    <Package size={20} />
                                    <div className="product-details">
                                        <span className="name">{selectedProduct.name}</span>
                                        <span className="code">
                                            {selectedProduct.ean && `${selectedProduct.ean} • `}
                                            {selectedProduct.code}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="change-btn"
                                        onClick={() => setSelectedProduct(null)}
                                    >
                                        Alterar
                                    </button>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="form-fields">
                                <div className="form-group">
                                    <label>Data de Validade *</label>
                                    <input
                                        type="date"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Quantidade *</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        placeholder="Ex: 24"
                                        required
                                        min="0"
                                        step="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Lote (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.lot}
                                        onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                                        placeholder="Ex: L-2024-X1"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </form>

                {selectedProduct && (
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={handleClose}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={saving || !formData.expires_at || !formData.quantity}
                        >
                            {saving ? 'Salvando...' : 'Salvar Registro'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
