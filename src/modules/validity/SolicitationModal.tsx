import React, { useState, useEffect } from 'react';
import { Search, Loader, Package, Store, Send, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useProductSearch, type Product } from '../../hooks/useProductSearch';
import './SolicitationModal.css';

interface SolicitationModalProps {
    isOpen: boolean;
    onClose: () => void;
}



interface HistoryRequest {
    id: string;
    status: string;
    requested_at: string;
    observation?: string;
    product_name: string;
    product_code?: string;
    store_name?: string;
}

interface Store {
    id: string;
    name: string;
}

export const SolicitationModal: React.FC<SolicitationModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { results, loading: searchLoading, search } = useProductSearch();

    // State
    const [view, setView] = useState<'create' | 'history'>('create');
    const [step, setStep] = useState<'search' | 'form' | 'success'>('search');
    const [stores, setStores] = useState<Store[]>([]);

    // History State
    const [historyRequests, setHistoryRequests] = useState<HistoryRequest[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form Data
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
    const [observation, setObservation] = useState('');
    const [sending, setSending] = useState(false);

    // Initial Fetch




    const fetchStores = async () => {
        const { data } = await supabase.schema('public').from('stores').select('id, name');
        if (data) setStores(data);
    };

    const fetchHistory = React.useCallback(async () => {
        if (!user?.id) return;
        setHistoryLoading(true);
        try {
            // 1. Fetch solicitations
            const { data: solicitations, error } = await supabase
                .schema('validity')
                .from('solicitations')
                .select('*')
                .eq('requested_by', user.id)
                .order('requested_at', { ascending: false });

            if (error) throw error;

            if (!solicitations || solicitations.length === 0) {
                setHistoryRequests([]);
                return;
            }

            // 2. Extract IDs for manual join
            const productIds = [...new Set(solicitations.map(s => s.product_id))];
            const storeIds = [...new Set(solicitations.map(s => s.store_id))];

            // 3. Fetch related data manually
            const { data: products } = await supabase
                .schema('public')
                .from('products')
                .select('id, name, code')
                .in('id', productIds);

            const { data: storesData } = await supabase
                .schema('public')
                .from('stores')
                .select('id, name')
                .in('id', storeIds);

            // 4. Create Maps
            const productsMap = new Map(products?.map(p => [p.id, p]));
            const storesMap = new Map(storesData?.map(s => [s.id, s]));

            // 5. Map final result
            const mappedData = solicitations.map(item => ({
                id: item.id,
                status: item.status,
                requested_at: item.requested_at,
                observation: item.observation,
                product_name: productsMap.get(item.product_id)?.name || 'Produto Desconhecido',
                product_code: productsMap.get(item.product_id)?.code,
                store_name: storesMap.get(item.store_id)?.name
            }));

            setHistoryRequests(mappedData);

        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isOpen) {
            fetchStores();
            resetForm();
            if (view === 'history') {
                fetchHistory();
            }
        }
    }, [isOpen, view, fetchHistory]);

    const cancelSolicitation = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) return;

        try {
            const { error } = await supabase
                .schema('validity')
                .from('solicitations')
                .delete()
                .eq('id', id)
                .eq('status', 'pendente'); // Security check

            if (error) throw error;
            fetchHistory(); // Refresh list
        } catch (err) {
            console.error('Error cancelling solicitation:', err);
            alert('Erro ao cancelar solicitação.');
        }
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

    const handleProductSelect = (product: Product) => {
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
                // If user wants to see history after submitting, could switch view
                // For now just close or reset? Let's switch to history to show it worked
                setView('history');
                setStep('search'); // Reset form state for next time
                fetchHistory();
            }, 1500);
        } catch (error: unknown) {
            console.error('Error sending solicitation:', error);
            alert('Erro ao enviar solicitação.');
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Minhas Solicitações"
            className="solicitation-modal"
        >
            <div className="solicitation-tabs">
                <button
                    className={`tab-btn ${view === 'create' ? 'active' : ''}`}
                    onClick={() => setView('create')}
                >
                    Nova Solicitação
                </button>
                <button
                    className={`tab-btn ${view === 'history' ? 'active' : ''}`}
                    onClick={() => setView('history')}
                >
                    Histórico
                </button>
            </div>

            <div className="modal-body-wrapper-solicitation">
                {view === 'history' ? (
                    <div className="history-list">
                        {historyLoading ? (
                            <div className="loading-state">
                                <Loader className="spinner" />
                            </div>
                        ) : historyRequests.length === 0 ? (
                            <div className="empty-state">
                                <p>Nenhuma solicitação encontrada.</p>
                            </div>
                        ) : (
                            historyRequests.map(req => (
                                <div key={req.id} className={`history-card ${req.status}`}>
                                    <div className="h-card-top">
                                        <div className="h-product">
                                            <strong>{req.product_name}</strong>
                                            <span>{req.product_code}</span>
                                        </div>
                                        <span className={`status-badge ${req.status}`}>
                                            {req.status === 'pendente' ? 'Pendente' : (req.status === 'resolvido' ? 'Resolvido' : 'Arquivado')}
                                        </span>
                                    </div>

                                    <div className="h-card-meta">
                                        <span>
                                            <Store size={12} /> {req.store_name || 'Loja Desconhecida'}
                                        </span>
                                        <span>
                                            <Clock size={12} /> {new Date(req.requested_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {req.observation && (
                                        <div className="h-card-obs">
                                            <AlertCircle size={12} /> {req.observation}
                                        </div>
                                    )}

                                    {req.status === 'pendente' && (
                                        <button
                                            className="cancel-req-btn"
                                            onClick={() => cancelSolicitation(req.id)}
                                            title="Cancelar Solicitação"
                                        >
                                            <Trash2 size={14} /> Cancelar
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // CREATE VIEW
                    <>
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
                                        {results.map((product) => (
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
                                            <strong>{selectedProduct?.name}</strong>
                                            <div className="meta">
                                                {selectedProduct?.code}
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
                                <button className="validity-cancel-btn" onClick={() => setStep('search')} disabled={sending}>
                                    Voltar
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
                    </>
                )}
            </div>
        </Modal>
    );
};
