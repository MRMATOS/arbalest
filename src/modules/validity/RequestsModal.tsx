import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import './RequestsModal.css';

interface RequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface RequestItem {
    id: string;
    product_name: string;
    product_code: string;
    req_user?: string;
    requester_name?: string;
    requested_at: string;
    status: 'pendente' | 'resolvido' | 'arquivado';
    observation?: string;
}

export const RequestsModal: React.FC<RequestsModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [view, setView] = useState<'pending' | 'history'>('pending');
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchRequests = React.useCallback(async () => {
        if (!user?.store_id) return;

        setLoading(true);
        try {
            let query = supabase
                .schema('validity')
                .from('solicitations_view')
                .select('*')
                .eq('store_id', user.store_id)
                .order('requested_at', { ascending: false });

            if (view === 'pending') {
                query = query.eq('status', 'pendente');
            } else {
                query = query.neq('status', 'pendente');
            }

            const { data, error } = await query as { data: RequestItem[] | null, error: unknown };

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.store_id, view]);

    useEffect(() => {
        if (isOpen && user?.store_id) {
            fetchRequests();
        }
    }, [isOpen, view, user?.store_id, fetchRequests]);





    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={view === 'pending' ? "Solicitações Pendentes" : "Histórico de Solicitações"}
            className="requests-modal"
        >
            <div className="requests-header">
                <div className="view-toggle">
                    <button
                        className={view === 'pending' ? 'active' : ''}
                        onClick={() => setView('pending')}
                    >
                        Pendentes
                    </button>
                    <button
                        className={view === 'history' ? 'active' : ''}
                        onClick={() => setView('history')}
                    >
                        Histórico
                    </button>
                </div>
            </div>

            <div className="requests-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner modal-spinner" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhuma solicitação encontrada.</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className={`request-card ${req.status}`}>
                            <div className="req-main">
                                <div className="req-product">
                                    <strong>{req.product_name}</strong>
                                    <span className="req-code">{req.product_code}</span>
                                </div>
                                <div className="req-meta">
                                    <span className="req-user">
                                        Solicitado por: {req.requester_name || 'Usuário'}
                                    </span>
                                    <span className="req-date">
                                        {new Date(req.requested_at).toLocaleDateString()} às {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {req.observation && (
                                    <div className="req-obs">
                                        <AlertCircle size={14} />
                                        <span>{req.observation}</span>
                                    </div>
                                )}
                            </div>

                            <div className="req-actions">
                                <span className={`status-badge ${req.status}`}>
                                    {req.status === 'pendente' ? 'Pendente' : (req.status === 'resolvido' ? 'Resolvido' : 'Arquivado')}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};
