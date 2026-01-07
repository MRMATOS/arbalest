import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Store, Ruler, ChevronRight } from 'lucide-react';

import { DashboardLayout } from '../../layouts/DashboardLayout';

interface StoreType {
    id: string;
    name: string;
    code: string;
    slug: string;
}

export const PlanogramDashboard: React.FC = () => {
    const navigate = useNavigate();
    // const { user } = useAuth(); // Unused
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setStores(data || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="arbalest-layout-container fade-in">
                {/* Header */}
                <header className="arbalest-header">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h1>Planogramas</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Gerencie o layout das lojas</p>
                    </div>
                </header>

                {/* Quick Actions */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Configurações
                    </h3>
                    <div
                        className="arbalest-card"
                        onClick={() => navigate('/planogram/patterns')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            flexDirection: 'row', // Override default column if needed, or rely on card-body structure if I used strict structure. But arbalest-card is generic container.
                            gap: '16px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    >
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '12px',
                            borderRadius: '12px',
                        }}>
                            <Ruler size={24} color="#10b981" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Padrões de Módulos</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Defina as dimensões e prateleiras padrão</p>
                        </div>
                        <ChevronRight size={20} color="var(--text-tertiary)" />
                    </div>
                </div>

                {/* Stores Grid */}
                <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Lojas
                    </h3>

                    {loading ? (
                        <div className="arbalest-loading-state">
                            <div className="spinner" />
                            <p>Carregando lojas...</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {stores.map(store => (
                                <div
                                    key={store.id}
                                    className="arbalest-card"
                                    style={{
                                        opacity: 0.7, // Visual indication that it's read-only for now
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <Store size={20} color="var(--text-secondary)" />
                                        <span className="arbalest-badge arbalest-badge-neutral">
                                            {store.code}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{store.name}</h3>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Visualização indisponível</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};
