import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    CheckCircle2,

    Plus,
    Search,
    Trash2,
    Pen,
    Settings2,
    History,
    Info,
    AlertTriangle,
    Copy
} from 'lucide-react';
import { useValidityEntries, type ValidityEntry } from '../../hooks/useValidityEntries';
import { useAuth } from '../../contexts/AuthContext';

import { ValidityPermissions } from '../../utils/permissions';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Pagination } from '../../components/Pagination';

import { AddValidityModal } from './AddValidityModal';
import { FilterModal, type FilterState } from './FilterModal';
import { supabase } from '../../services/supabase';


{/* Props Removed */ }
interface ValidityListProps {
    onAddClick?: () => void;
    isFilterModalOpen?: boolean;
    onCloseFilterModal?: () => void;
}

export const ValidityList: React.FC<ValidityListProps> = ({
    onAddClick,
    isFilterModalOpen,
    onCloseFilterModal,
}) => {
    const {
        entries,
        loading,
        error,
        refresh,
        updateStatus,
        deleteEntry
    } = useValidityEntries({ statusFilter: 'pendente' });
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');



    // Filter states
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data
    const [stores, setStores] = useState<Array<{ id: string, name: string }>>([]);
    const [users, setUsers] = useState<Array<{ id: string, name?: string, email?: string }>>([]);


    // Fetch filter data
    useEffect(() => {
        const fetchFilterData = async () => {
            // Fetch stores
            const { data: storesData } = await supabase
                .from('stores')
                .select('id, name')
                .order('name');
            if (storesData) setStores(storesData);

            // Fetch encarregados (users with encarregado function in validity module)
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, name, username, email')
                .not('permissions->validity', 'is', null)  // Has validity module access
                .eq('permissions->validity->>function', 'encarregado')  // Is encarregado
                .order('name');
            if (usersData) setUsers(usersData);
        };

        fetchFilterData();
    }, []);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        entryId: string;
        productName: string;
    } | null>(null);

    // Confirmation State
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        entryId: string;
        action: 'unverify';
    } | null>(null);

    // Edit State
    const [editEntry, setEditEntry] = useState<ValidityEntry | null>(null);

    // Mobile Options State
    const [mobileOptionsEntry, setMobileOptionsEntry] = useState<ValidityEntry | null>(null);

    const [copiedState, setCopiedState] = useState<{ id: string; type: 'code' | 'ean' | 'full' } | null>(null);

    const handleCopy = async (text: string, id: string, type: 'code' | 'ean' | 'full') => {
        try {
            // Tenta usar a API moderna primeiro (requer contexto seguro/HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback para ambientes de desenvolvimento (HTTP) ou navegadores antigos
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                    return; // Retorna se falhar
                }
                document.body.removeChild(textArea);
            }
            setCopiedState({ id, type });
            setTimeout(() => setCopiedState(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const handleCopyProductDetails = (item: ValidityEntry) => {
        const days = getExpiryDays(item.expires_at);
        const statusText = days <= 0 ? 'VENCIDO' : `${days} dias`;
        const text = `*${item.product.name}*\nEAN: ${item.product.ean || '-'}\nCód: ${item.product.code}\nQtd: ${item.quantity} ${item.unit}\nLote: ${item.lot || '-'}\nValidade: ${new Date(item.expires_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} (${statusText})`;
        handleCopy(text, item.id, 'full');
    };

    const handleStatusToggle = (id: string, currentStatus: string) => {
        if (!ValidityPermissions.canVerify(user) && !user?.is_admin) return; // Guard
        if (currentStatus === 'conferido') {
            setConfirmAction({
                isOpen: true,
                entryId: id,
                action: 'unverify'
            });
        } else {
            updateStatus(id, 'conferido');
        }
    };

    // Permissions Logic
    const canVerify = ValidityPermissions.canVerify(user) || user?.is_admin;
    const canEdit = ValidityPermissions.canEdit(user) || user?.is_admin;

    // Delete permission: only admin or creator can delete
    const canDelete = (entry: ValidityEntry) => {
        if (user?.is_admin) return true;
        if (entry.created_by_user?.id === user?.id) return true;
        return false;
    };

    const handleDelete = async () => {
        if (!deleteConfirmation) return;
        try {
            await deleteEntry(deleteConfirmation.entryId);
            setDeleteConfirmation(null);
        } catch (error) {
            alert('Erro ao excluir registro');
        }
    };

    if (loading && entries.length === 0) {
        return (
            <div className="loading-state">
                <div className="spinner" />
                <p>Carregando registros...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state glass">
                <AlertCircle size={32} color="var(--error)" />
                <p>Erro ao carregar dados: {error}</p>
                <button onClick={refresh} className="retry-btn">Tentar novamente</button>
            </div>
        );
    }

    let filteredEntries = entries.filter(item =>
        (item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product.ean?.includes(searchTerm) ||
            item.product.code.includes(searchTerm)) &&
        (selectedStore === 'all' || item.store_id === selectedStore) &&
        (selectedUser === 'all' || item.created_by_user?.id === selectedUser) &&
        (selectedType === 'all' || item.product.type === selectedType)
    );

    // Apply sorting
    filteredEntries = [...filteredEntries].sort((a, b) => {
        switch (sortBy) {
            case 'recent':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'expires_soon':
                return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
            case 'expires_late':
                return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime();
            default:
                return 0;
        }
    });

    const handleFilterApply = (newFilters: FilterState) => {
        setSelectedStore(newFilters.store);
        setSelectedUser(newFilters.user);
        setSelectedType(newFilters.type);
        setSortBy(newFilters.sortBy);
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Pagination logic
    const totalItems = filteredEntries.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginatedEntries = filteredEntries.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'conferido': return <span className="arbalest-badge arbalest-badge-success"><CheckCircle2 size={14} /> Conferido</span>;
            default: return <span className="arbalest-badge arbalest-badge-info">Pendente</span>;
        }
    };

    const getExpiryClass = (item: ValidityEntry) => {
        const { date, type, amount } = {
            date: item.expires_at,
            type: item.product.type,
            amount: item.product.amount
        };

        const diff = new Date(date).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));

        let effectiveDays = days;
        if (type === 'farmacia' && (amount || 0) > 0) {
            effectiveDays = days - (amount || 0);
        }

        if (effectiveDays < 0) return 'expiry-critical'; // Expired
        if (effectiveDays <= 10) return 'expiry-critical'; // Critical (10 days or less)
        if (effectiveDays <= 30) return 'expiry-warning'; // Warning (30 days or less)
        return 'expiry-success'; // Safe (More than 30 days)
    };

    const getExpiryDays = (date: string) => {
        const diff = new Date(date).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getSalesDeadline = (item: ValidityEntry) => {
        const diff = new Date(item.expires_at).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days - (item.product.amount || 0);
    };

    const getExpiryText = (days: number) => {
        if (days === 0) return 'Vence hoje';
        if (days === -1) return 'Venceu ontem';
        if (days < -1) return `Vencido há ${Math.abs(days)} dias`;
        return `${days}d restantes`;
    };

    return (
        <div className="arbalest-layout-container">
            <div className="arbalest-header">
                {/* ... existing header code ... */}
                <div className="header-text">
                    <h1>Lista de Validades</h1>
                    <p>Gerencie os produtos próximos do vencimento</p>
                </div>
                <div className="arbalest-header-actions">
                    {canEdit && (
                        <button className="arbalest-btn arbalest-btn-primary hide-mobile" onClick={onAddClick}>
                            <Plus size={20} />
                            <span>Novo Registro</span>
                        </button>
                    )}

                    {/* Desktop Actions */}
                    <button className="arbalest-btn arbalest-btn-neutral hide-mobile" onClick={() => navigate('/validity/history')}>
                        <History size={20} />
                        <span>Histórico</span>
                    </button>
                </div>
            </div>

            <div className="arbalest-filter-section arbalest-glass">
                {/* Desktop Filters */}
                <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="filter-group">
                        <label className="arbalest-label">Loja</label>
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="arbalest-select"
                        >
                            <option value="all">Todas as Lojas</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="arbalest-label">Colaborador</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="arbalest-select"
                        >
                            <option value="all">Todos os Colaboradores</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="arbalest-label">Tipo</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="arbalest-select"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="mercado">Mercado</option>
                            <option value="farmacia">Farmácia</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="arbalest-label">Ordenar</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="arbalest-select"
                        >
                            <option value="recent">Últimos Registrados</option>
                            <option value="expires_soon">Vence Mais Cedo</option>
                            <option value="expires_late">Vence Mais Tarde</option>
                        </select>
                    </div>
                </div>

                <div className="arbalest-search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por EAN, código ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Conditional rendering for loading and error states */}
            {loading && (
                <div className="arbalest-loading-state">
                    <div className="spinner" />
                    <p>Carregando validades...</p>
                </div>
            )}

            {error && (
                <div className="arbalest-error-state">
                    <AlertTriangle size={48} color="var(--error)" />
                    <h3>Erro ao carregar dados</h3>
                    <p>{error}</p>
                    <button className="arbalest-btn arbalest-btn-neutral" onClick={() => refresh()}>
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Desktop Table View */}
            {!loading && !error && (
                <div className="desktop-view arbalest-table-container">
                    <table className="arbalest-table">
                        <thead>
                            {/* ... existing table head ... */}
                            <tr>
                                <th>Produto</th>
                                <th>Loja</th>
                                <th>Qtd.</th>
                                <th>Validade</th>
                                { /* <th>Lote</th> */}
                                <th>Status</th>
                                <th className="actions-col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEntries.map(item => (
                                <tr key={item.id}>
                                    <td className="product-col">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className="product-name">{item.product.name}</span>
                                            <div className="code-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', opacity: 0.8 }}>
                                                {item.product.code && (
                                                    <span
                                                        className={`code clickable-copy ${copiedState?.id === item.id && copiedState?.type === 'code' ? 'copied' : ''}`}
                                                        onClick={() => handleCopy(item.product.code, item.id, 'code')}
                                                        title="Clique para copiar código"
                                                    >
                                                        {copiedState?.id === item.id && copiedState?.type === 'code' ? 'Copiado!' : item.product.code}
                                                    </span>
                                                )}

                                                {item.product.code && item.product.ean && <span style={{ color: 'var(--text-tertiary)' }}>/</span>}

                                                {item.product.ean && (
                                                    <span
                                                        className={`ean clickable-copy ${copiedState?.id === item.id && copiedState?.type === 'ean' ? 'copied' : ''}`}
                                                        onClick={() => handleCopy(item.product.ean || '', item.id, 'ean')}
                                                        title="Clique para copiar EAN"
                                                    >
                                                        {copiedState?.id === item.id && copiedState?.type === 'ean' ? 'Copiado!' : item.product.ean}
                                                    </span>
                                                )}

                                                {!item.product.code && !item.product.ean && <span>-</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '0.9rem' }}>{item.store?.name || '-'}</span>
                                        </div>
                                    </td>
                                    <td><span className="quantity">{item.quantity} {item.unit}</span></td>
                                    <td>
                                        <div className={`expiry-info ${getExpiryClass(item)}`}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="date">{new Date(item.expires_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                {item.product.type === 'farmacia' && (item.product.amount || 0) > 0 && (item.product.amount || 0) < getExpiryDays(item.expires_at) && (
                                                    <div className="arbalest-tooltip-wrapper">
                                                        <Info size={16} />
                                                        <div className="arbalest-tooltip">
                                                            <strong>Prazo de Venda</strong>
                                                            {getSalesDeadline(item) <= 0 ? (
                                                                <span style={{ color: 'var(--error)' }}>Prazo Encerrado</span>
                                                            ) : (
                                                                <span>Resta {getSalesDeadline(item)} dias para venda</span>
                                                            )}
                                                            <div style={{ marginTop: '8px', fontSize: '0.7rem', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                                                                Qtd. Frasco: {item.product.amount} un<br />
                                                                Necessário {item.product.amount} dias para consumo.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="days">{getExpiryText(getExpiryDays(item.expires_at))}</span>
                                        </div>
                                    </td>
                                    { /* <td><span className="lot-tag">{item.lot || 'Não informado'}</span></td> */}
                                    <td>{getStatusBadge(item.status)}</td>
                                    <td className="actions-col">
                                        <>
                                            {/* 2. Verification Actions (Conferente only) */}
                                            {canVerify && (
                                                <>

                                                    <button
                                                        className={`arbalest-icon-btn ${item.status === 'conferido' ? '' : ''}`}
                                                        onClick={() => handleStatusToggle(item.id, item.status)}
                                                        title={item.status === 'conferido' ? "Desmarcar" : "Confirmar"}
                                                        style={item.status === 'conferido' ? {
                                                            backgroundColor: 'var(--success)',
                                                            color: '#ffffff',
                                                            border: 'none'
                                                        } : {}}
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                </>
                                            )}

                                            {/* 3. Common Actions */}
                                            <button
                                                className="arbalest-icon-btn"
                                                onClick={() => handleCopyProductDetails(item)}
                                                title={copiedState?.id === item.id && copiedState?.type === 'full' ? "Copiado!" : "Copiar Detalhes"}
                                            >
                                                {copiedState?.id === item.id && copiedState?.type === 'full' ? (
                                                    <CheckCircle2 size={18} color="var(--success)" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>

                                            {/* 4. Edit/Delete - only creator or admin */}
                                            {canDelete(item) && (
                                                <button
                                                    className="arbalest-icon-btn"
                                                    onClick={() => setEditEntry(item)}
                                                    title="Editar"
                                                >
                                                    <Pen size={18} />
                                                </button>
                                            )}

                                            {/* Delete - only creator or admin */}
                                            {canDelete(item) && (
                                                <button
                                                    className="arbalest-icon-btn"
                                                    onClick={() => setDeleteConfirmation({ isOpen: true, entryId: item.id, productName: item.product.name })}
                                                    title="Excluir"
                                                    style={{ color: 'var(--error)' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div >
            )}


            {/* Mobile Card View */}
            {/* Mobile Card View */}
            {!loading && !error && (
                <div className="mobile-view">
                    <div className="card-list">
                        {paginatedEntries.map(item => (
                            <div key={item.id} className="arbalest-card">
                                <div className="arbalest-card-header">
                                    <span className="product-name">{item.product.name}</span>
                                    {getStatusBadge(item.status)}
                                </div>

                                <div className="arbalest-card-body">
                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label>Quantidade</label>
                                            <span className="quantity-val">{item.quantity} {item.unit}</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label>Loja</label>
                                            <span style={{ fontSize: '0.9rem' }}>{item.store?.name || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="arbalest-card-info">
                                        <label>EAN / CÓD</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span
                                                className={`clickable-copy ${copiedState?.id === item.id && copiedState?.type === 'ean' ? 'copied' : ''}`}
                                                onClick={() => handleCopy(item.product.ean || '', item.id, 'ean')}
                                            >
                                                {item.product.ean || '-'}
                                            </span>
                                            <span>/</span>
                                            <span
                                                className={`clickable-copy ${copiedState?.id === item.id && copiedState?.type === 'code' ? 'copied' : ''}`}
                                                onClick={() => handleCopy(item.product.code, item.id, 'code')}
                                            >
                                                {item.product.code}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="arbalest-card-info">
                                        <label>Vence em</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span className={`expiry-date ${getExpiryClass(item)}`} style={{ fontWeight: 600 }}>
                                                {new Date(item.expires_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                            </span>
                                            <span className="days" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                ({getExpiryText(getExpiryDays(item.expires_at))})
                                            </span>

                                            {item.product.type === 'farmacia' && (item.product.amount || 0) > 0 && (item.product.amount || 0) < getExpiryDays(item.expires_at) && (
                                                <div className="arbalest-tooltip-wrapper">
                                                    <Info size={16} color="var(--text-tertiary)" />
                                                    <div className="arbalest-tooltip">
                                                        <strong>Prazo de Venda</strong>
                                                        {getSalesDeadline(item) <= 0 ? (
                                                            <span style={{ color: 'var(--error)' }}>Prazo Encerrado</span>
                                                        ) : (
                                                            <span>Resta {getSalesDeadline(item)} dias para venda</span>
                                                        )}
                                                        <div style={{ marginTop: '8px', fontSize: '0.7rem', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                                                            Qtd. Frasco: {item.product.amount} un<br />
                                                            Necessário {item.product.amount} dias para consumo.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {item.lot && (
                                        <div className="arbalest-card-info">
                                            <label>Lote</label>
                                            <span className="lot-tag">{item.lot}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="arbalest-card-footer">
                                    <button
                                        className="arbalest-btn arbalest-btn-outline"
                                        onClick={() => handleCopyProductDetails(item)}
                                    >
                                        {copiedState?.id === item.id && copiedState?.type === 'full' ? (
                                            <><CheckCircle2 size={16} color="var(--success)" /> Copiado!</>
                                        ) : (
                                            <><Copy size={16} /> Copiar Detalhes</>
                                        )}
                                    </button>

                                    {/* Mobile Actions based on Role */}
                                    {canVerify && (
                                        <button
                                            className={`arbalest-btn ${item.status === 'conferido' ? '' : 'arbalest-btn-outline'}`}
                                            style={item.status === 'conferido' ? {
                                                backgroundColor: 'var(--success)',
                                                color: '#ffffff',
                                                border: '1px solid var(--success)'
                                            } : {}}
                                            onClick={() => handleStatusToggle(item.id, item.status)}
                                        >
                                            {item.status === 'conferido' ? (
                                                <>Conferido <CheckCircle2 size={16} /></>
                                            ) : (
                                                <>Conferir <CheckCircle2 size={16} /></>
                                            )}
                                        </button>
                                    )}

                                    {canDelete(item) && (
                                        <button
                                            className="arbalest-btn arbalest-btn-primary"
                                            onClick={() => setMobileOptionsEntry(item)}
                                        >
                                            Opções <Settings2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* ... modals ... */}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            )}


            <ConfirmModal
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={handleDelete}
                title="Excluir Registro"
                message={`Tem certeza que deseja excluir o registro de "${deleteConfirmation?.productName}"?`}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
            />





            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    if (confirmAction) {
                        updateStatus(confirmAction.entryId, 'pendente');
                    }
                }}
                title="Desmarcar Conferência?"
                message="Você está prestes a remover o status de 'conferido'. Deseja continuar?"
                confirmText="Sim, desmarcar"
                cancelText="Cancelar"
                type="warning"
            />

            {/* Reusing AddValidityModal for Editing */}
            <AddValidityModal
                isOpen={!!editEntry}
                onClose={() => setEditEntry(null)}
                editEntry={editEntry}
                onSuccess={refresh}
            />

            <FilterModal
                isOpen={!!isFilterModalOpen}
                onClose={onCloseFilterModal || (() => { })}
                onApply={handleFilterApply}
                currentFilters={{
                    store: selectedStore,
                    user: selectedUser,
                    type: selectedType,
                    sortBy: sortBy
                }}
                availableStores={stores}
                availableUsers={users}
            />

            {/* Mobile Options Modal (Custom) */}
            {
                mobileOptionsEntry && (
                    <div className="modal-overlay" onClick={() => setMobileOptionsEntry(null)}>
                        <div className="arbalest-card arbalest-glass" style={{ maxWidth: '320px', padding: '24px', width: '90%' }}>
                            <h3 className="arbalest-title" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Opções do Registro</h3>
                            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
                                {mobileOptionsEntry.product.name}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button className="arbalest-btn arbalest-btn-primary" onClick={() => {
                                    setEditEntry(mobileOptionsEntry);
                                    setMobileOptionsEntry(null);
                                }}>
                                    Editar Registro
                                </button>

                                {canDelete(mobileOptionsEntry) && (
                                    <button
                                        className="arbalest-btn"
                                        style={{
                                            border: '1px solid var(--error)',
                                            color: 'var(--error)',
                                            background: 'transparent'
                                        }}
                                        onClick={() => {
                                            setDeleteConfirmation({
                                                isOpen: true,
                                                entryId: mobileOptionsEntry.id,
                                                productName: mobileOptionsEntry.product.name
                                            });
                                            setMobileOptionsEntry(null);
                                        }}
                                    >
                                        Excluir Registro
                                    </button>
                                )}

                                <button className="arbalest-btn arbalest-btn-neutral" onClick={() => setMobileOptionsEntry(null)}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
