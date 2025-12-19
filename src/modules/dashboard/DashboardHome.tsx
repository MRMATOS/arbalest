import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Loader, TrendingUp, AlertCircle } from 'lucide-react';
import './DashboardHome.css';

interface DashboardMetric {
    count: number;
    lastRegistered: { name: string; date: string } | null;
    shortestExpiry: { name: string; date: string } | null;
}

export const DashboardHome: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        mercado: DashboardMetric;
        farmacia: DashboardMetric;
    }>({
        mercado: { count: 0, lastRegistered: null, shortestExpiry: null },
        farmacia: { count: 0, lastRegistered: null, shortestExpiry: null }
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch active validity entries
            const { data: entries, error: entriesError } = await supabase
                .schema('validity')
                .from('validity_entries')
                .select('id, expires_at, created_at, product_id')
                .neq('status', 'excluido')
                .neq('status', 'discarded'); // Assuming discarded exists or similar

            if (entriesError) throw entriesError;

            if (!entries || entries.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Fetch related products (cross-schema manual join)
            const productIds = Array.from(new Set(entries.map(e => e.product_id)));
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, name, type')
                .in('id', productIds);

            if (productsError) throw productsError;

            const productMap = new Map(products?.map(p => [p.id, p]));

            // 3. Process Stats
            const marketEntries: any[] = [];
            const pharmaEntries: any[] = [];

            entries.forEach(entry => {
                const product = productMap.get(entry.product_id);
                if (product) {
                    const enhancedEntry = { ...entry, product };
                    if (product.type === 'farmacia') {
                        pharmaEntries.push(enhancedEntry);
                    } else {
                        // Default to mercado if null or 'mercado'
                        marketEntries.push(enhancedEntry);
                    }
                }
            });

            // Helper to calculate metrics
            const calcMetrics = (list: any[]): DashboardMetric => {
                if (list.length === 0) return { count: 0, lastRegistered: null, shortestExpiry: null };

                // Sort by created_at desc for Last Registered
                const sortedByCreated = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const last = sortedByCreated[0];

                // Sort by expires_at asc for Shortest Expiry
                const sortedByExpiry = [...list].sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
                const shortest = sortedByExpiry[0];

                return {
                    count: list.length,
                    lastRegistered: {
                        name: last.product.name,
                        date: last.created_at
                    },
                    shortestExpiry: {
                        name: shortest.product.name,
                        date: shortest.expires_at
                    }
                };
            };

            setStats({
                mercado: calcMetrics(marketEntries),
                farmacia: calcMetrics(pharmaEntries)
            });

        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <Loader className="spinner" size={32} />
            </div>
        );
    }

    return (
        <div className="dashboard-home">
            <header className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Visão geral dos registros de validade.</p>
                </div>
            </header>

            <div className="dashboard-grid">
                {/* Mercado Section */}
                <section className="stats-section">
                    <div className="section-header">
                        <h2>Mercado</h2>
                        <span className="badge-count">{stats.mercado.count} registros</span>
                    </div>

                    <div className="cards-row">
                        <div className="stat-card primary">
                            <div className="card-icon"><TrendingUp size={24} /></div>
                            <div className="card-content">
                                <label>Último Registrado</label>
                                {stats.mercado.lastRegistered ? (
                                    <>
                                        <h4>{stats.mercado.lastRegistered.name}</h4>
                                        <span>Em: {formatDate(stats.mercado.lastRegistered.date)}</span>
                                    </>
                                ) : <span className="empty-text">-</span>}
                            </div>
                        </div>

                        <div className="stat-card warning">
                            <div className="card-icon"><AlertCircle size={24} /></div>
                            <div className="card-content">
                                <label>Vencimento Mais Curto</label>
                                {stats.mercado.shortestExpiry ? (
                                    <>
                                        <h4>{stats.mercado.shortestExpiry.name}</h4>
                                        <span className="urgent-date">Vence: {formatDate(stats.mercado.shortestExpiry.date)}</span>
                                    </>
                                ) : <span className="empty-text">-</span>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Farmacia Section */}
                <section className="stats-section">
                    <div className="section-header">
                        <h2>Farmácia</h2>
                        <span className="badge-count pharma">{stats.farmacia.count} registros</span>
                    </div>

                    <div className="cards-row">
                        <div className="stat-card primary">
                            <div className="card-icon"><TrendingUp size={24} /></div>
                            <div className="card-content">
                                <label>Último Registrado</label>
                                {stats.farmacia.lastRegistered ? (
                                    <>
                                        <h4>{stats.farmacia.lastRegistered.name}</h4>
                                        <span>Em: {formatDate(stats.farmacia.lastRegistered.date)}</span>
                                    </>
                                ) : <span className="empty-text">-</span>}
                            </div>
                        </div>

                        <div className="stat-card warning">
                            <div className="card-icon"><AlertCircle size={24} /></div>
                            <div className="card-content">
                                <label>Vencimento Mais Curto</label>
                                {stats.farmacia.shortestExpiry ? (
                                    <>
                                        <h4>{stats.farmacia.shortestExpiry.name}</h4>
                                        <span className="urgent-date">Vence: {formatDate(stats.farmacia.shortestExpiry.date)}</span>
                                    </>
                                ) : <span className="empty-text">-</span>}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
