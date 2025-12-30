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
            <div className="fade-in">
                {/* Header */}
                <div className="header-actions" style={{ marginBottom: '24px', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Planogramas</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Gerencie o layout das lojas</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Configurações
                    </h3>
                    <div
                        className="glass"
                        onClick={() => navigate('/planogram/patterns')}
                        style={{
                            padding: '20px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid var(--glass-border)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                    >
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '12px',
                            borderRadius: '12px',
                            marginRight: '16px'
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
                        <div className="spinner" />
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {stores.map(store => (
                                <div
                                    key={store.id}
                                    className="glass"
                                    style={{
                                        padding: '24px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--glass-border)',
                                        opacity: 0.7, // Visual indication that it's read-only for now
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <Store size={20} color="var(--text-secondary)" />
                                        <span style={{
                                            background: 'var(--bg-accent)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {store.code}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{store.name}</h3>
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
