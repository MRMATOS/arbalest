import React, { useState } from 'react';
import { Search, Loader, Package, Camera } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useProductSearch, type Product } from '../../hooks/useProductSearch';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import './AddValidityModal.css';

interface AddValidityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddValidityModal: React.FC<AddValidityModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { results, loading: searchLoading, search } = useProductSearch();
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);


    const [formData, setFormData] = useState({
        expires_at: '',
        lot: '',
        quantity: ''
    });
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        search(value);
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setSearchTerm('');
    };



    // State
    const handleSubmit = async (e: React.SyntheticEvent) => {
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
        } catch (err) {
            console.error('Error saving validity entry:', err);
            if (err instanceof Error) setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        // Only clear selected product if it wasn't pre-selected (to avoid flickering if checking again)
        // But actually, we want to clear everything on close usually.
        setSelectedProduct(null);
        setSearchTerm('');
        setFormData({ expires_at: '', lot: '', quantity: '' });
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Novo Registro de Validade"
        >
            <form onSubmit={handleSubmit} className="modal-body-add-validity">
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
                                onClick={() => setIsScannerOpen(true)}
                                title="Escanear código de barras"
                            >
                                <Camera size={20} color="black" />
                            </button>
                        </div>

                        <BarcodeScannerModal
                            isOpen={isScannerOpen}
                            onClose={() => setIsScannerOpen(false)}
                            onScan={(code) => {
                                handleSearchChange(code);
                                setIsScannerOpen(false);
                            }}
                        />

                        {/* Search Results */}
                        {results.length > 0 && (
                            <div className="search-results">
                                {results.map((product) => (
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

            {/* Footer placed outside form but inside Modal if needed, logic here follows original structure */}
            {selectedProduct && (
                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={handleClose}>
                        Cancelar
                    </button>
                    <button
                        type="button" // Changed to button to avoid form submission issues if placed outside, but onClick calls handleSubmit
                        className="btn-primary"
                        onClick={(e) => {
                            // Assuming handleSubmit expects a FormEvent, but we can pass synthetic event or just call logic.
                            // Actually better to keep it inside form or use form id.
                            // Original code: form wraps everything.
                            // Here I wrapped content in form.
                            handleSubmit(e);
                        }}
                        disabled={saving || !formData.expires_at || !formData.quantity}
                    >
                        {saving ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                </div>
            )}
        </Modal>
    );
};
