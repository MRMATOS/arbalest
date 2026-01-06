import React, { useState, useEffect } from 'react';
import { Search, Loader, Package, Camera } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useProductSearch, type Product } from '../../../hooks/useProductSearch';
import { BarcodeScannerModal } from '../../validity/BarcodeScannerModal';
import './AddButcherOrderModal.css';

interface AddButcherOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AddButcherOrderModal: React.FC<AddButcherOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const { results, loading: searchLoading, search } = useProductSearch();

    // State
    const [step, setStep] = useState<'search' | 'form'>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Form Data
    const [quantity, setQuantity] = useState<number | ''>('');
    const [unit, setUnit] = useState<'bandeja' | 'kg'>('bandeja');
    const [simPoa, setSimPoa] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setStep('search');
        setSearchTerm('');
        setSelectedProduct(null);
        setQuantity('');
        setUnit('bandeja');
        setSimPoa('');
        setSubmitting(false);
    };

    const processSearch = (term: string) => {
        setSearchTerm(term);

        // Scale Label Logic (EAN-13 starting with 2)
        // Format: 2 I I I I I V V V V C
        // 2: Prefix
        // I: 5 digits Item Code (Internal Code)
        // V: 4 digits Value/Weight
        // C: Checksum
        if (term.length === 13 && term.startsWith('2')) {
            const internalCode = term.substring(1, 6);
            console.log(`Scale Code Detected: ${term} -> Searching Internal Code: ${internalCode}`);
            search(internalCode);
        } else {
            search(term);
        }
    };

    const handleProductSelect = async (product: Product) => {
        // Validate duplicates
        try {
            if (!user?.store_id) return;

            // Check if there is already a pending order for this product in this store
            const { data: existing, error } = await supabase
                .schema('butcher')
                .from('orders')
                .select('id')
                .eq('requester_store_id', user.store_id)
                .eq('product_id', product.id)
                .in('status', ['pending', 'production']) // Check active orders
                .maybeSingle();

            if (error) throw error;

            if (existing) {
                alert('Atenção: Já existe um pedido pendente ou em produção para este item nesta loja.');
                return;
            }

            setSelectedProduct(product);
            setStep('form');
        } catch (err) {
            console.error('Error checking duplicates:', err);
            // Allow proceed on error? Better to warn
            setSelectedProduct(product);
            setStep('form');
        }
    };

    const handleSubmit = async () => {
        if (!selectedProduct || !quantity || !user?.store_id) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .insert({
                    requester_store_id: user.store_id,
                    product_id: selectedProduct.id,
                    quantity: Number(quantity),
                    unit: unit,
                    sim_poa_code: simPoa || null,
                    status: 'pending',
                    // requested_by: user.id // Schema might verify this via trigger or RLS, simpler to just insert basics
                });

            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Erro ao criar pedido.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Novo Pedido de Açougue"
                className="add-butcher-modal"
            >
                {step === 'search' ? (
                    <div className="search-step">
                        <label className="field-label">Qual produto deseja pedir?</label>
                        <div className="search-input-group">
                            <div className="input-wrapper">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Nome, EAN ou Código..."
                                    value={searchTerm}
                                    onChange={(e) => processSearch(e.target.value)}
                                    autoFocus
                                />
                                {searchLoading && <Loader className="spinner" size={18} />}
                            </div>
                            <button className="scan-btn" onClick={() => setIsScannerOpen(true)}>
                                <Camera size={20} />
                            </button>
                        </div>

                        <div className="results-list">
                            {results.map(product => (
                                <div key={product.id} className="result-item" onClick={() => handleProductSelect(product)}>
                                    <Package size={24} className="product-icon" />
                                    <div className="product-info">
                                        <span className="name">{product.name}</span>
                                        <span className="codes">
                                            {product.ean && `EAN: ${product.ean} • `} Cód: {product.code}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {searchTerm.length > 2 && results.length === 0 && !searchLoading && (
                                <div className="empty-state">
                                    <Package size={40} />
                                    <p>Nenhum produto encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="form-step">
                        <div className="selected-product-summary">
                            <div className="summary-icon">
                                <Package size={24} />
                            </div>
                            <div className="summary-info">
                                <strong>{selectedProduct?.name}</strong>
                                <span>Cód: {selectedProduct?.code}</span>
                            </div>
                            <button className="change-product-btn" onClick={() => setStep('search')}>
                                Trocar
                            </button>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                    min="1"
                                    className="qty-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Unidade</label>
                                <div className="unit-toggle">
                                    <button
                                        className={unit === 'bandeja' ? 'active' : ''}
                                        onClick={() => setUnit('bandeja')}
                                    >
                                        Bandeja
                                    </button>
                                    <button
                                        className={unit === 'kg' ? 'active' : ''}
                                        onClick={() => setUnit('kg')}
                                    >
                                        Kg
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>SIM / POA (Opcional)</label>
                            <input
                                type="text"
                                value={simPoa}
                                onChange={(e) => setSimPoa(e.target.value)}
                                placeholder="Ex: 1234/2024"
                                className="text-input"
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={onClose} disabled={submitting}>
                                Cancelar
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={handleSubmit}
                                disabled={submitting || !quantity}
                            >
                                {submitting ? 'Salvando...' : 'Confirmar Pedido'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={(code) => {
                    setIsScannerOpen(false);
                    processSearch(code);
                }}
            />
        </>
    );
};
