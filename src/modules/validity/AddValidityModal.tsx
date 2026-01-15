import React, { useState, useEffect } from 'react';
import { Search, Loader, Package, Camera } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useProductSearch, type Product } from '../../hooks/useProductSearch';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getModuleStoreId } from '../../utils/permissions';
import { type ValidityEntry } from '../../hooks/useValidityEntries';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import './AddValidityModal.css';

interface AddValidityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editEntry?: ValidityEntry | null;
}

// Helper function to detect unit based on input
function detectUnit(input: string): { value: number; unit: 'un' | 'kg' } {
    const cleaned = input.trim();

    // Empty input
    if (!cleaned) {
        return { value: 0, unit: 'un' };
    }

    // Trailing . or , = integer (un)
    if (cleaned.endsWith('.') || cleaned.endsWith(',')) {
        const num = parseInt(cleaned.slice(0, -1)) || 0;
        return { value: num, unit: 'un' };
    }

    // Has decimal = kg
    const hasDecimal = /[.,]\d/.test(cleaned);
    const normalized = parseFloat(cleaned.replace(',', '.')) || 0;

    return {
        value: normalized,
        unit: hasDecimal ? 'kg' : 'un'
    };
}

export const AddValidityModal: React.FC<AddValidityModalProps> = ({ isOpen, onClose, onSuccess, editEntry }) => {
    const { results, loading: searchLoading, search } = useProductSearch();
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        expires_at: '',
        lot: '',
        quantity: ''
    });
    const [detectedUnit, setDetectedUnit] = useState<'un' | 'kg'>('un');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editEntry) {
            setSelectedProduct(editEntry.product as Product); // Cast compatible structure
            setFormData({
                expires_at: editEntry.expires_at.split('T')[0],
                lot: editEntry.lot || '',
                quantity: editEntry.quantity ? editEntry.quantity.toString() : ''
            });
            setDetectedUnit(editEntry.unit || 'un');
        }
    }, [editEntry]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        search(value);
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setSearchTerm('');
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!selectedProduct || !user) return;

        setSaving(true);
        setError(null);

        try {
            if (editEntry) {
                // Update Logic
                const { error: updateError } = await supabase
                    .schema('validity')
                    .from('validity_entries')
                    .update({
                        expires_at: formData.expires_at,
                        lot: formData.lot || null,
                        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editEntry.id);

                if (updateError) throw updateError;
            } else {
                // Add mode: Insert new entry
                const storeId = getModuleStoreId(user, 'validity');
                if (!storeId) {
                    throw new Error('Usuário sem acesso para adicionar registros');
                }
                const { value, unit } = detectUnit(formData.quantity);

                const { error: insertError } = await supabase
                    .schema('validity')
                    .from('validity_entries')
                    .insert({
                        product_id: selectedProduct.id,
                        store_id: storeId,
                        expires_at: formData.expires_at,
                        lot: formData.lot || null,
                        quantity: value,
                        unit: unit,
                        created_by: user.id,
                        status: 'pendente'
                    });

                if (insertError) throw insertError;
            }

            // Success - reset and close
            if (!editEntry) {
                // Only clear if adding, keep data if edit failed? No, success here.
                setSelectedProduct(null);
                setFormData({ expires_at: '', lot: '', quantity: '' });
            }
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
        // Reset everything on close
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
            title={editEntry ? "Editar Registro" : "Novo Registro de Validade"}
        >
            <form onSubmit={handleSubmit} className="modal-body-add-validity">
                {/* Product Search Section */}
                {!selectedProduct ? (
                    <div className="search-section">
                        <label className="arbalest-label">Buscar Produto</label>
                        <div className="arbalest-search-wrapper">
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
                        {/* Selected Product Display */}
                        <div className="selected-product arbalest-glass">
                            <div className="product-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <Package size={24} style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div className="product-details" style={{ width: '100%' }}>
                                        <span className="name" style={{ fontSize: '1rem', lineHeight: '1.4' }}>{selectedProduct.name}</span>
                                        <span className="code" style={{ marginTop: '4px', display: 'block' }}>
                                            {selectedProduct.ean && `${selectedProduct.ean} • `}
                                            {selectedProduct.code}
                                        </span>
                                    </div>
                                </div>

                                {!editEntry && (
                                    <button
                                        type="button"
                                        className="arbalest-btn arbalest-btn-neutral"
                                        style={{ fontSize: '0.9rem', padding: '10px', marginTop: '4px', width: '100%', justifyContent: 'center' }}
                                        onClick={() => setSelectedProduct(null)}
                                    >
                                        Alterar Produto
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="form-fields">
                            <div className="form-group">
                                <label className="arbalest-label">Data de Validade *</label>
                                <input
                                    type="date"
                                    className="arbalest-input"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    required
                                    min={editEntry ? undefined : new Date().toISOString().split('T')[0]} // Allow past dates on edit? Maybe not. Keep restriction or remove.
                                />
                            </div>

                            <div className="form-group">
                                <label className="arbalest-label">Quantidade (Opcional)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="arbalest-input"
                                        value={formData.quantity}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData({ ...formData, quantity: value });
                                            if (value) {
                                                const { unit } = detectUnit(value);
                                                setDetectedUnit(unit);
                                            } else {
                                                setDetectedUnit('un');
                                            }
                                        }}
                                        placeholder="Ex: 300 ou 11,45"
                                    />
                                    {formData.quantity && (
                                        <span className={`unit-badge unit-${detectedUnit}`}>
                                            {detectedUnit === 'un' ? '📦 un' : '⚖️ kg'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="arbalest-label">Lote (Opcional)</label>
                                <input
                                    type="text"
                                    className="arbalest-input"
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
                    <button type="button" className="arbalest-btn arbalest-btn-neutral" onClick={handleClose}>
                        Cancelar
                    </button>
                    <button
                        type="button" // Changed to button to avoid form submission issues if placed outside, but onClick calls handleSubmit
                        className="arbalest-btn arbalest-btn-primary"
                        onClick={(e) => {
                            // Assuming handleSubmit expects a FormEvent, but we can pass synthetic event or just call logic.
                            // Actually better to keep it inside form or use form id.
                            // Original code: form wraps everything.
                            // Here I wrapped content in form.
                            handleSubmit(e);
                        }}
                        disabled={saving || !formData.expires_at}
                    >
                        {saving ? 'Salvando...' : (editEntry ? 'Atualizar' : 'Salvar Registro')}
                    </button>
                </div>
            )}
        </Modal>
    );
};
