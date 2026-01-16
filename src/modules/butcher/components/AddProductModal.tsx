import React, { useState } from 'react';
import { Search, Loader, Package, X } from 'lucide-react';
import { useProductSearch, type Product } from '../../../hooks/useProductSearch';
import type { ButcherOrderItem } from '../../../types/butcher';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: ButcherOrderItem) => void;
}

// Auto-detect unit based on input
function detectUnit(input: string): { value: number; unit: 'bandeja' | 'kg' } {
    const cleaned = input.trim();
    if (!cleaned) return { value: 0, unit: 'bandeja' };

    // Trailing . or , = integer (bandeja)
    if (cleaned.endsWith('.') || cleaned.endsWith(',')) {
        return { value: parseInt(cleaned.slice(0, -1)) || 0, unit: 'bandeja' };
    }

    // Has decimal = kg
    const hasDecimal = /[.,]\d/.test(cleaned);
    const normalized = parseFloat(cleaned.replace(',', '.')) || 0;

    return {
        value: normalized,
        unit: hasDecimal ? 'kg' : 'bandeja'
    };
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { results, loading, search } = useProductSearch();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('');
    const [detectedUnit, setDetectedUnit] = useState<'bandeja' | 'kg'>('bandeja');
    const [notes, setNotes] = useState('');

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        search(value, { meatOnly: true }); // Pass filter to search method
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setSearchTerm('');
    };

    const handleQuantityChange = (value: string) => {
        setQuantity(value);
        const { unit } = detectUnit(value);
        setDetectedUnit(unit);
    };

    const handleSubmit = () => {
        if (!selectedProduct) return;

        const { value } = detectUnit(quantity);

        const item: ButcherOrderItem = {
            product_id: selectedProduct.id,
            product_code: selectedProduct.code || '',
            product_name: selectedProduct.name,
            product_ean: selectedProduct.ean || undefined,
            quantity: value,
            unit: detectedUnit,
            notes: notes || undefined
        };

        onAdd(item);
        handleReset();
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedProduct(null);
        setQuantity('');
        setDetectedUnit('bandeja');
        setNotes('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="arbalest-modal-overlay" onClick={handleClose}>
            <div
                className="arbalest-modal"
                style={{ maxWidth: '500px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="arbalest-modal-header">
                    <h2>Adicionar Produto</h2>
                    <button className="arbalest-icon-btn" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="arbalest-form">
                    {/* Step 1: Search Product */}
                    {!selectedProduct && (
                        <>
                            <div className="arbalest-form-group">
                                <label className="arbalest-label">
                                    <Search size={16} />
                                    Buscar Produto
                                </label>
                                <div className="arbalest-search-wrapper">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome, código ou EAN..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        autoFocus
                                    />
                                    {loading && <Loader size={18} className="spinner" />}
                                </div>
                            </div>

                            {/* Search Results */}
                            {results.length > 0 && (
                                <div style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px'
                                }}>
                                    {results.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductSelect(product)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Package size={20} style={{ color: 'var(--brand-primary)' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{product.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                    {product.meat_group && `${product.meat_group} • `}{product.code} {product.ean && `• ${product.ean}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchTerm && !loading && results.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px' }}>
                                    Nenhum produto encontrado
                                </p>
                            )}
                        </>
                    )}

                    {/* Step 2: Enter Quantity */}
                    {selectedProduct && (
                        <>
                            {/* Selected Product Display */}
                            <div style={{
                                padding: '16px',
                                background: 'var(--bg-accent)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <Package size={24} style={{ color: 'var(--brand-primary)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{selectedProduct.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                        {selectedProduct.meat_group && `${selectedProduct.meat_group} • `}{selectedProduct.code}
                                    </div>
                                </div>
                                <button
                                    className="arbalest-icon-btn"
                                    onClick={() => setSelectedProduct(null)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Quantity Input */}
                            <div className="arbalest-form-group">
                                <label className="arbalest-label">Quantidade</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="arbalest-input"
                                        style={{ flex: 1 }}
                                        placeholder="Ex: 10 (bandejas) ou 1.5 (kg)"
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        autoFocus
                                    />
                                    {quantity && (
                                        <span className={`arbalest-badge ${detectedUnit === 'kg' ? 'arbalest-badge-warning' : 'arbalest-badge-info'}`}>
                                            {detectedUnit === 'bandeja' ? 'Bandejas' : 'Kg'}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                    Número inteiro = Bandejas | Número decimal = Kg
                                </p>
                            </div>

                            {/* Notes (optional) */}
                            <div className="arbalest-form-group">
                                <label className="arbalest-label">Observação (opcional)</label>
                                <input
                                    type="text"
                                    className="arbalest-input"
                                    placeholder="Ex: Sem gordura"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Actions */}
                            <div className="arbalest-modal-actions">
                                <button
                                    type="button"
                                    className="arbalest-btn arbalest-btn-neutral"
                                    onClick={handleClose}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="arbalest-btn arbalest-btn-primary"
                                    onClick={handleSubmit}
                                    disabled={!quantity || detectUnit(quantity).value === 0}
                                >
                                    Adicionar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


