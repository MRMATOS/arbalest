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
    Send,
    Copy
} from 'lucide-react';
import { useValidityEntries, type ValidityEntry } from '../../hooks/useValidityEntries';
import { useAuth } from '../../contexts/AuthContext';

import { ConfirmModal } from '../../components/ConfirmModal';

import { SolicitationModal } from './SolicitationModal';
import { EditValidityModal } from './EditValidityModal';
import { RequestsModal } from './RequestsModal';
import { FilterModal, type FilterState } from './FilterModal';
import { supabase } from '../../services/supabase';
import './ValidityList.css';

interface ValidityListProps {
    onAddClick?: () => void;
    isSolicitationModalOpen?: boolean;
    onCloseSolicitationModal?: () => void;
    onOpenSolicitationModal?: () => void;
    isFilterModalOpen?: boolean;
    onCloseFilterModal?: () => void;
}

export const ValidityList: React.FC<ValidityListProps> = ({
    onAddClick,
    isSolicitationModalOpen: controlledIsOpen,
    onCloseSolicitationModal,
    onOpenSolicitationModal,
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
    } = useValidityEntries();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');



    // Filter states
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');

    // Filter data
    const [stores, setStores] = useState<Array<{ id: string, name: string }>>([]);
    const [users, setUsers] = useState<Array<{ id: string, name?: string, email?: string }>>([]);

    // Internal state for when not controlled, though we aim to control it from App.tsx
    const [internalSolicitationOpen, setInternalSolicitationOpen] = useState(false);
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [pendingSolicitationsCount, setPendingSolicitationsCount] = useState(0);

    // Fetch filter data and pending solicitations
    useEffect(() => {
        const fetchFilterData = async () => {
            // Fetch stores
            const { data: storesData } = await supabase
                .from('stores')
                .select('id, name')
                .order('name');
            if (storesData) setStores(storesData);

            // Fetch encarregados
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .eq('role', 'encarregado')
                .order('name');
            if (usersData) setUsers(usersData);
        };

        const fetchPendingSolicitations = async () => {
            if (!user?.store_id) return;

            const { count, error } = await supabase
                .schema('validity')
                .from('solicitations_view')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', user.store_id)
                .eq('status', 'pendente');

            if (!error && count !== null) {
                setPendingSolicitationsCount(count);
            }
        };

        // Realtime subscription for solicitations
        const subscription = supabase
            .channel('solicitations_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'validity',
                    table: 'solicitations'
                },
                () => {
                    fetchPendingSolicitations();
                }
            )
            .subscribe();

        fetchFilterData();
        if (user?.role === 'encarregado' || user?.role === 'admin') {
            fetchPendingSolicitations();
        }

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);



    // Effective state (controlled takes precedence)
    const isSolicitationModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalSolicitationOpen;
    const setIsSolicitationModalOpen = (isOpen: boolean) => {
        if (controlledIsOpen !== undefined) {
            if (isOpen && onOpenSolicitationModal) {
                onOpenSolicitationModal();
            } else if (!isOpen && onCloseSolicitationModal) {
                onCloseSolicitationModal();
            }
        } else {
            setInternalSolicitationOpen(isOpen);
        }
    };

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

    const handleCopy = (text: string, id: string, type: 'code' | 'ean' | 'full') => {
        navigator.clipboard.writeText(text);
        setCopiedState({ id, type });
        setTimeout(() => setCopiedState(null), 2000);
    };

    const handleCopyProductDetails = (item: ValidityEntry) => {
        const days = getExpiryDays(item.expires_at);
        const statusText = days <= 0 ? 'VENCIDO' : `${days} dias`;
        const text = `*${item.product.name}*\nEAN: ${item.product.ean || '-'}\nCód: ${item.product.code}\nQtd: ${item.quantity}\nLote: ${item.lot || '-'}\nValidade: ${new Date(item.expires_at).toLocaleDateString('pt-BR')} (${statusText})`;
        handleCopy(text, item.id, 'full');
    };

    const handleStatusToggle = (id: string, currentStatus: string) => {
        if (!hasRole('conferente') && !hasRole('admin')) return; // Guard
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

    const hasRole = (role: string) => user?.role === role;

    // Permissions Logic
    const canVerify = hasRole('conferente') || hasRole('admin');
    const canEdit = hasRole('encarregado') || hasRole('admin');

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
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'conferido': return <span className="arbalest-badge arbalest-badge-success"><CheckCircle2 size={14} /> Conferido</span>;
            default: return <span className="arbalest-badge arbalest-badge-info">Ativo</span>;
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
        if (effectiveDays <= 15) return 'expiry-critical'; // Critical
        if (effectiveDays <= 30) return 'expiry-warning'; // Warning
        return 'expiry-normal'; // Normal (Green)
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
                    {(hasRole('encarregado') || hasRole('admin')) && (
                        <button className="arbalest-btn arbalest-btn-primary" onClick={onAddClick}>
                            <Plus size={20} />
                            <span>Novo Registro</span>
                        </button>
                    )}

                    {(hasRole('encarregado') || hasRole('admin')) && (
                        <button
                            className="arbalest-btn arbalest-btn-outline-warning"
                            onClick={() => setIsRequestsModalOpen(true)}
                            title="Ver Solicitações"
                            style={{ position: 'relative' }}
                        >
                            <Send size={20} />
                            <span className="hide-mobile">Solicitações</span>
                            {pendingSolicitationsCount > 0 && (
                                <span className="arbalest-badge arbalest-badge-danger" style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    borderRadius: '10px',
                                    padding: '2px 6px',
                                    fontSize: '10px'
                                }}>
                                    {pendingSolicitationsCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Desktop Actions */}
                    <button className="arbalest-btn arbalest-btn-neutral hide-mobile" onClick={() => navigate('/validity/history')}>
                        <History size={20} />
                        <span>Histórico Global</span>
                    </button>

                    {canVerify && (
                        <button
                            className="arbalest-btn arbalest-btn-outline-warning hide-mobile"
                            onClick={() => onOpenSolicitationModal?.()}
                            title="Solicitar Conferência"
                        >
                            <Send size={20} />
                            <span>Solicitar</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="arbalest-filter-section arbalest-glass hide-mobile">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
            </div>



            <div className="arbalest-filter-section arbalest-glass">
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
                                <th>Código / EAN</th>
                                <th>Status</th>
                                <th>Qtd.</th>
                                <th>Validade</th>
                                <th>Lote</th>
                                <th className="actions-col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map(item => (
                                <tr key={item.id}>
                                    <td className="product-col">
                                        <span className="product-name">{item.product.name}</span>
                                    </td>
                                    <td className="code-col">
                                        <div className="code-info">
                                            <span
                                                className={`code clickable-copy ${copiedState?.id === item.id && copiedState?.type === 'code' ? 'copied' : ''}`}
                                                onClick={() => handleCopy(item.product.code, item.id, 'code')}
                                                title="Clique para copiar código"
                                            >
                                                {copiedState?.id === item.id && copiedState?.type === 'code' ? 'Copiado!' : item.product.code}
                                            </span>
                                            <span
                                                className={`ean clickable-copy ${copiedState?.id === item.id && copiedState?.type === 'ean' ? 'copied' : ''}`}
                                                onClick={() => handleCopy(item.product.ean || '', item.id, 'ean')}
                                                title="Clique para copiar EAN"
                                            >
                                                {copiedState?.id === item.id && copiedState?.type === 'ean' ? 'Copiado!' : (item.product.ean || '-')}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(item.status)}</td>
                                    <td><span className="quantity">{item.quantity}</span></td>
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
                                    <td><span className="lot-tag">{item.lot || 'Não informado'}</span></td>
                                    <td className="actions-col">
                                        <>
                                            {/* 2. Verification Actions (Conferente only) */}
                                            {canVerify && (
                                                <>

                                                    <button
                                                        className={`arbalest-icon-btn ${item.status === 'conferido' ? 'arbalest-btn-primary' : ''}`}
                                                        onClick={() => handleStatusToggle(item.id, item.status)}
                                                        title={item.status === 'conferido' ? "Desmarcar" : "Confirmar"}
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

                                            {/* 4. Edit/Delete (Encarregado Only) */}
                                            {canEdit && (
                                                <>
                                                    <button
                                                        className="arbalest-icon-btn"
                                                        onClick={() => setEditEntry(item)}
                                                        title="Editar"
                                                    >
                                                        <Pen size={18} />
                                                    </button>

                                                    <button
                                                        className="arbalest-icon-btn"
                                                        onClick={() => setDeleteConfirmation({ isOpen: true, entryId: item.id, productName: item.product.name })}
                                                        title="Excluir"
                                                        style={{ color: 'var(--error)' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
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
                        {filteredEntries.map(item => (
                            <div key={item.id} className="arbalest-card">
                                <div className="arbalest-card-header">
                                    <span className="product-name">{item.product.name}</span>
                                    {getStatusBadge(item.status)}
                                </div>

                                <div className="arbalest-card-body">
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

                                    <div className="arbalest-card-row">
                                        <div className="arbalest-card-info">
                                            <label>Quantidade</label>
                                            <span className="quantity-val">{item.quantity} un</span>
                                        </div>
                                        <div className="arbalest-card-info">
                                            <label>Lote</label>
                                            <span className="lot-tag">{item.lot || 'Não informado'}</span>
                                        </div>
                                    </div>

                                    <div className="arbalest-card-info" style={{ marginTop: '8px' }}>
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
                                </div>

                                <div className="arbalest-card-footer">
                                    <button
                                        className="arbalest-btn arbalest-btn-neutral"
                                        onClick={() => handleCopyProductDetails(item)}
                                    >
                                        {copiedState?.id === item.id && copiedState?.type === 'full' ? (
                                            <><CheckCircle2 size={16} color="var(--success)" /> Copiado!</>
                                        ) : (
                                            <><Copy size={16} /> Copiar</>
                                        )}
                                    </button>

                                    {/* Mobile Actions based on Role */}
                                    {canVerify && (
                                        <button
                                            className={`arbalest-btn ${item.status === 'conferido' ? 'arbalest-btn-primary' : 'arbalest-btn-outline'}`}
                                            onClick={() => handleStatusToggle(item.id, item.status)}
                                        >
                                            {item.status === 'conferido' ? (
                                                <>Conferido <CheckCircle2 size={16} /></>
                                            ) : (
                                                <>Conferir <CheckCircle2 size={16} /></>
                                            )}
                                        </button>
                                    )}

                                    {canEdit && (
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



            <SolicitationModal
                isOpen={isSolicitationModalOpen}
                onClose={() => setIsSolicitationModalOpen(false)}
            />

            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    if (confirmAction) {
                        updateStatus(confirmAction.entryId, 'ativo');
                    }
                }}
                title="Desmarcar Conferência?"
                message="Você está prestes a remover o status de 'conferido'. Deseja continuar?"
                confirmText="Sim, desmarcar"
                cancelText="Cancelar"
                type="warning"
            />

            <EditValidityModal
                isOpen={!!editEntry}
                onClose={() => setEditEntry(null)}
                entry={editEntry}
                onSuccess={refresh}
            />

            {/* Requests Modal */}
            <RequestsModal
                isOpen={isRequestsModalOpen}
                onClose={() => setIsRequestsModalOpen(false)}
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
                        <div className="modal-content glass" style={{ maxWidth: '320px', padding: '24px' }}>
                            <h3 style={{ marginBottom: '20px' }}>Opções do Registro</h3>
                            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                {mobileOptionsEntry.product.name}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button className="btn-primary" onClick={() => {
                                    setEditEntry(mobileOptionsEntry);
                                    setMobileOptionsEntry(null);
                                }}>
                                    Editar Registro
                                </button>

                                <button
                                    className="btn-danger-outline"
                                    style={{
                                        padding: '12px',
                                        border: '1px solid var(--error)',
                                        color: 'var(--error)',
                                        background: 'transparent',
                                        borderRadius: '8px',
                                        fontWeight: 600
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

                                <button className="btn-secondary" onClick={() => setMobileOptionsEntry(null)}>
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
