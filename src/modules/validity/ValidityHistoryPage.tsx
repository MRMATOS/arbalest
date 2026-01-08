import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Copy, CheckCircle2 } from 'lucide-react';
import { useValidityEntries, type ValidityEntry } from '../../hooks/useValidityEntries';
import { supabase } from '../../services/supabase';
import { FilterModal } from './FilterModal';
import '../../styles/global.css';


interface ValidityHistoryPageProps {
    isFilterModalOpen?: boolean;
    onCloseFilterModal?: () => void;
}

export const ValidityHistoryPage: React.FC<ValidityHistoryPageProps> = ({
    isFilterModalOpen: controlledIsFilterOpen,
    onCloseFilterModal: controlledOnCloseFilter
}) => {
    const navigate = useNavigate();
    const { entries, loading } = useValidityEntries({ includeDeleted: true });

    const [searchTerm, setSearchTerm] = useState('');
    const [copiedState, setCopiedState] = useState<{ id: string, type: 'full' | 'code' } | null>(null);

    // Filter Data
    const [stores, setStores] = useState<Array<{ id: string, name: string }>>([]);
    const [users, setUsers] = useState<Array<{ id: string, name?: string, email?: string }>>([]);

    // Filters
    const [filterStore, setFilterStore] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // all, excluido, vencido, ativo
    const [sortBy, setSortBy] = useState('recent');

    const [internalIsFilterOpen, setInternalIsFilterOpen] = useState(false);

    const isFilterOpen = controlledIsFilterOpen !== undefined ? controlledIsFilterOpen : internalIsFilterOpen;
    const setIsFilterOpen = (isOpen: boolean) => {
        if (controlledIsFilterOpen !== undefined) {
            if (!isOpen && controlledOnCloseFilter) controlledOnCloseFilter();
        } else {
            setInternalIsFilterOpen(isOpen);
        }
    };

    // Fetch filter data
    useEffect(() => {
        const fetchFilterData = async () => {
            // Fetch stores
            const { data: storesData } = await supabase
                .from('stores')
                .select('id, name')
                .order('name');
            if (storesData) setStores(storesData);

            // Fetch users (profiles)
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .order('name');
            if (usersData) setUsers(usersData);
        };
        fetchFilterData();
    }, []);

    // Filter logic
    const filteredEntries = entries.filter(item => {
        // Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            item.product.name.toLowerCase().includes(searchLower) ||
            (item.product.ean || '').includes(searchLower) ||
            item.product.code.includes(searchLower) ||
            (item.lot || '').toLowerCase().includes(searchLower);

        // Filters
        if (filterStore !== 'all' && item.store_id !== filterStore) return false;
        if (filterUser !== 'all' && item.created_by_user?.id !== filterUser) return false;
        if (filterType !== 'all') {
            const prodType = item.product.type || 'mercado';
            if (prodType !== filterType) return false;
        }

        // Status Filter
        if (filterStatus === 'excluido') {
            if (item.status !== 'excluido') return false;
        } else if (filterStatus === 'vencido') {
            const isExpired = new Date(item.expires_at) < new Date();
            if (!isExpired || item.status === 'excluido') return false;
        } else if (filterStatus === 'ativo') {
            if (item.status === 'excluido') return false;
            const isExpired = new Date(item.expires_at) < new Date();
            if (isExpired) return false;
        }

        return matchesSearch;
    }).sort((a, b) => {
        if (sortBy === 'expires_soon') {
            return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        }
        if (sortBy === 'expires_late') {
            return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime();
        }
        // recent (created_at) - Default
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const handleCopyProductDetails = async (entry: ValidityEntry) => {
        const lines = [
            `*${entry.product.name}*`,
            `Cód: ${entry.product.code} ${entry.product.ean ? `/ EAN: ${entry.product.ean}` : ''}`,
            `Qtd: ${entry.quantity}`,
            `Lote: ${entry.lot || 'N/A'}`,
            `Validade: ${new Date(entry.expires_at).toLocaleDateString('pt-BR')}`
        ];

        const text = lines.join('\n');

        try {
            await navigator.clipboard.writeText(text);
            setCopiedState({ id: entry.id, type: 'full' });
            setTimeout(() => setCopiedState(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Helper for Status Badge
    const getStatusBadge = (item: ValidityEntry) => {
        if (item.status === 'excluido') {
            return <span className="arbalest-badge badge-danger">Excluído</span>;
        }

        const isExpired = new Date(item.expires_at) < new Date();
        if (isExpired) {
            return <span className="arbalest-badge badge-danger">Vencido</span>;
        }

        if (item.status === 'conferido') {
            return <span className="arbalest-badge badge-success">Conferido</span>;
        }

        return <span className="arbalest-badge badge-neutral">Ativo</span>;
    };

    const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || '...';
    const getUserName = (id?: string) => {
        if (!id) return '-';
        const u = users.find(u => u.id === id);
        return u ? (u.name || u.email?.split('@')[0]) : '...';
    };

    return (
        <div className="arbalest-layout-container">
            {/* Header */}
            <div className="arbalest-header">
                <div>
                    <h1 className="arbalest-title">Histórico Global</h1>
                    <p className="arbalest-subtitle">Registro completo de validades.</p>
                </div>
                <div className="arbalest-header-actions">
                    <button className="arbalest-btn arbalest-btn-neutral desktop-only" onClick={() => navigate('/validity')}>
                        <ArrowLeft size={20} />
                        <span>Voltar</span>
                    </button>
                </div>
            </div>

            {/* Desktop Filters Section (Hidden on Mobile) */}
            {/* Desktop Filters Section (Hidden on Mobile) */}
            <div className="arbalest-filter-section arbalest-glass desktop-only">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

                    <div className="filter-group">
                        <label className="arbalest-label">Loja</label>
                        <select className="arbalest-select" value={filterStore} onChange={(e) => setFilterStore(e.target.value)}>
                            <option value="all">Todas</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="arbalest-label">Usuário</label>
                        <select className="arbalest-select" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                            <option value="all">Todos</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="arbalest-label">Tipo</label>
                        <select className="arbalest-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value="mercado">Mercado</option>
                            <option value="farmacia">Farmácia</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="arbalest-label">Status</label>
                        <select className="arbalest-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value="ativo">Ativos</option>
                            <option value="vencido">Vencidos</option>
                            <option value="excluido">Excluídos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* General Search Bar */}
            <div className="arbalest-filter-section arbalest-glass">
                <div className="arbalest-search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Carregando histórico...</p>
                </div>
            ) : (
                <>
                    <div className="arbalest-table-container desktop-only">
                        <table className="arbalest-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Loja</th>
                                    <th>Tipo</th>
                                    <th>Usuário</th>
                                    <th>Lote</th>
                                    <th>Qtd.</th>
                                    <th>Validade</th>
                                    <th>Status</th>
                                    <th>Criado Em</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map(item => (
                                    <tr key={item.id} style={{ opacity: item.status === 'excluido' ? 0.7 : 1 }}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 500 }}>{item.product.name}</span>
                                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item.product.code} {item.product.ean ? `• ${item.product.ean}` : ''}</span>
                                            </div>
                                        </td>
                                        <td>{getStoreName(item.store_id)}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{item.product.type || '-'}</td>
                                        <td>{getUserName(item.created_by_user?.id)}</td>
                                        <td>{item.lot || '-'}</td>
                                        <td>{item.quantity}</td>
                                        <td>
                                            {new Date(item.expires_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td>{getStatusBadge(item)}</td>
                                        <td style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td>
                                            <button
                                                className="arbalest-icon-btn"
                                                onClick={() => handleCopyProductDetails(item)}
                                                title="Copiar Detalhes"
                                            >
                                                {copiedState?.id === item.id && copiedState?.type === 'full' ? (
                                                    <CheckCircle2 size={18} color="var(--success)" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredEntries.map(item => (
                            <div key={item.id} className="arbalest-card arbalest-glass" style={{ opacity: item.status === 'excluido' ? 0.7 : 1 }}>
                                <div className="arbalest-card-header">
                                    <span className="product-name">{item.product.name}</span>
                                    {getStatusBadge(item)}
                                </div>
                                <div className="arbalest-card-body">
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Info</label>
                                            <span style={{ fontSize: '0.85rem' }}>{item.product.code} • {item.product.ean || '-'}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Loja / Usuário</label>
                                            <span style={{ fontSize: '0.85rem' }}>{getStoreName(item.store_id)}<br />{getUserName(item.created_by_user?.id)}</span>
                                        </div>
                                    </div>
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Lote</label>
                                            <span>{item.lot || '-'}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Qtd.</label>
                                            <span>{item.quantity}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label className="arbalest-label">Validade</label>
                                            <span style={{ color: new Date(item.expires_at) < new Date() ? 'var(--error)' : 'inherit' }}>
                                                {new Date(item.expires_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="arbalest-card-actions">
                                        <button
                                            className="arbalest-btn arbalest-btn-neutral io-btn"
                                            style={{ width: '100%', justifyContent: 'center' }}
                                            onClick={() => handleCopyProductDetails(item)}
                                        >
                                            {copiedState?.id === item.id && copiedState?.type === 'full' ? (
                                                <>
                                                    <CheckCircle2 size={18} color="var(--success)" />
                                                    <span style={{ color: 'var(--success)' }}>Copiado!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={18} />
                                                    <span>Copiar Detalhes</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                availableStores={stores}
                availableUsers={users}
                currentFilters={{
                    store: filterStore,
                    user: filterUser,
                    type: filterType,
                    sortBy: sortBy
                }}
                onApply={(newFilters) => {
                    setFilterStore(newFilters.store);
                    setFilterUser(newFilters.user);
                    setFilterType(newFilters.type);
                    setSortBy(newFilters.sortBy);
                }}
            />
        </div>
    );
};
