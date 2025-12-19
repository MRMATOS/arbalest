import React, { useState, useEffect } from 'react';
import { Search, Loader, Package, Store, Send, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useProductSearch } from '../../hooks/useProductSearch';
import './SolicitationModal.css';

interface SolicitationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Store {
    id: string;
    name: string;
}

export const SolicitationModal: React.FC<SolicitationModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { results, loading: searchLoading, search } = useProductSearch();

    // State
    const [step, setStep] = useState<'search' | 'form' | 'success'>('search');
    const [stores, setStores] = useState<Store[]>([]);

    // Form Data
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
    const [observation, setObservation] = useState('');
    const [sending, setSending] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (isOpen) {
            fetchStores();
            resetForm();
        }
    }, [isOpen]);

    const fetchStores = async () => {
        const { data } = await supabase.schema('public').from('stores').select('id, name');
        if (data) setStores(data);
    };

    const resetForm = () => {
        setStep('search');
        setSearchTerm('');
        setSelectedProduct(null);
        setSelectedStoreId('all');
        setObservation('');
        setSending(false);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        search(value);
    };

    const handleProductSelect = (product: any) => {
        setSelectedProduct(product);
        setStep('form');
        setSearchTerm('');
    };

    const handleSubmit = async () => {
        if (!selectedProduct || !user) return;

        setSending(true);
        try {
            const targets = selectedStoreId === 'all'
                ? stores.map(s => s.id)
                : [selectedStoreId];

            const notifications = targets.map(targetStoreId => ({
                store_id: targetStoreId,
                product_id: selectedProduct.id,
                status: 'pendente',
                requested_by: user.id,
                observation: observation || null
            }));

            const { error } = await supabase
                .schema('validity')
                .from('solicitations')
                .insert(notifications);

            if (error) throw error;

            setStep('success');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error sending solicitation:', error);
            alert('Erro ao enviar solicitação.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Solicitar Validade"
            className="solicitation-modal"
        >
            <div className="modal-body-wrapper-solicitation"> {/* Wrapper to manage internal layout if needed */}
                {step === 'success' ? (
                    <div className="success-state">
                        <div className="success-icon-circle">
                            <Send size={32} />
                        </div>
                        <h4>Solicitação Enviada!</h4>
                        <p>Os encarregados foram notificados.</p>
                    </div>
                ) : step === 'search' ? (
                    <div className="search-section">
                        <label>Qual produto deseja solicitar?</label>
                        <div className="search-container">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, EAN ou código..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                autoFocus
                            />
                            {searchLoading && <Loader className="spinner" size={18} />}
                        </div>

                        {results.length > 0 && (
                            <div className="results-list">
                                {results.map((product: any) => (
                                    <div
                                        key={product.id}
                                        className="result-item"
                                        onClick={() => handleProductSelect(product)}
                                    >
                                        <Package size={20} className="item-icon" />
                                        <div className="item-details">
                                            <span className="item-name">{product.name}</span>
                                            <span className="item-meta">
                                                {product.ean ? `EAN: ${product.ean} • ` : ''} Código: {product.code}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchTerm.length >= 3 && results.length === 0 && !searchLoading && (
                            <div className="empty-state">
                                <Package size={40} />
                                <p>Nenhum produto encontrado</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="form-section">
                        <div className="selected-product-card">
                            <div className="card-top">
                                <Package size={24} />
                                <div>
                                    <strong>{selectedProduct.name}</strong>
                                    <div className="meta">
                                        {selectedProduct.code}
                                    </div>
                                </div>
                            </div>
                            <button className="change-btn" onClick={() => setStep('search')}>
                                Trocar
                            </button>
                        </div>

                        <div className="form-group">
                            <label><Store size={16} /> Loja Destino</label>
                            <select
                                value={selectedStoreId}
                                onChange={(e) => setSelectedStoreId(e.target.value)}
                            >
                                <option value="all">Todas as Lojas</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label><AlertCircle size={16} /> Observação (Opcional)</label>
                            <textarea
                                className="observation-input"
                                maxLength={300}
                                rows={4}
                                placeholder="Ex: Verificar se chegou novo lote..."
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                            />
                            <span className="chars-left">{300 - observation.length} caracteres rest.</span>
                        </div>
                    </div>
                )}

                {step === 'form' && (
                    <div className="modal-footer">
                        <button className="validity-cancel-btn" onClick={onClose} disabled={sending}>
                            Cancelar
                        </button>
                        <button
                            className="validity-confirm-btn"
                            onClick={handleSubmit}
                            disabled={sending}
                        >
                            {sending ? 'Enviando...' : 'Confirmar Solicitação'}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
