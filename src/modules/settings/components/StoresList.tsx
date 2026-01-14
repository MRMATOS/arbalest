import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Plus, Pencil, Trash2, Store as StoreIcon, ChevronRight } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { StoreModal } from './StoreModal';

interface Store {
    id: string;
    name: string;
    code: string;
    show_validity: boolean;
    show_planogram: boolean;
    is_butcher_active?: boolean;
    is_butcher_production?: boolean;
}

export const StoresList: React.FC = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [storeToEdit, setStoreToEdit] = useState<Store | null>(null);

    const fetchStores = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching stores:', error);
        } else {
            setStores(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta loja? Todos os usuários associados perderão o acesso.')) {
            const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', id);

            if (error) {
                alert('Erro ao excluir loja: ' + error.message);
            } else {
                fetchStores();
            }
        }
    };

    const handleEdit = (store: Store) => {
        setStoreToEdit(store);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setStoreToEdit(null);
        setIsModalOpen(true);
    };

    const mobileAddAction = (
        <button onClick={handleCreate} className="nav-btn">
            <Plus size={24} color="var(--brand-primary)" />
            <span>Adicionar</span>
        </button>
    );

    return (
        <DashboardLayout
            mobileAction={mobileAddAction}
        >
            <div className="fade-in">
                {/* Header with Breadcrumbs */}
                <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')}>Configurações</span>
                        <ChevronRight size={14} />
                        <span style={{ color: 'white' }}>Lojas</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Gerenciamento de Lojas</h1>
                        <button
                            className="btn-primary desktop-only"
                            onClick={handleCreate}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Plus size={20} />
                            Nova Loja
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-screen">
                        <div className="spinner" />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {stores.map(store => (
                            <div key={store.id} className="glass" style={{ padding: '24px', borderRadius: '16px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{
                                        background: 'var(--brand-primary)',
                                        borderRadius: '12px',
                                        width: '48px',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <StoreIcon size={24} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>{store.name}</h3>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {store.show_validity && (
                                                <span style={{
                                                    background: 'rgba(16, 185, 129, 0.2)',
                                                    color: '#34d399',
                                                    fontSize: '0.75rem',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>Validade</span>
                                            )}
                                            {store.show_planogram && (
                                                <span style={{
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    color: '#60a5fa',
                                                    fontSize: '0.75rem',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>Planogramas</span>
                                            )}
                                            {(!store.show_validity && !store.show_planogram) && (
                                                <span style={{
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    color: '#f87171',
                                                    fontSize: '0.75rem',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>Sem Módulos</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => handleEdit(store)}
                                        className="icon-btn"
                                        style={{ color: 'var(--text-secondary)' }}
                                        title="Editar"
                                    >
                                        <Pencil size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(store.id)}
                                        className="icon-btn"
                                        style={{ color: 'var(--error)' }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <StoreModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchStores}
                    storeToEdit={storeToEdit}
                />
            </div>
            <style>{`
                .desktop-only {
                    display: flex;
                }
                @media (max-width: 768px) {
                    .desktop-only {
                        display: none !important;
                    }
                }
                .icon-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                }
                .icon-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white !important;
                }
            `}</style>
        </DashboardLayout >
    );
};
