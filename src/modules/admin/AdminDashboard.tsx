import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Check, Pencil, X, ChevronRight } from 'lucide-react';


interface Profile {
    id: string;
    email: string;
    name: string | null;
    role: string;
    store_id: string | null;
    approved_at: string | null;
    butcher_role?: 'requester' | 'producer' | null;
}

interface StoreType {
    id: string;
    name: string;
    code: string;
}

export const AdminDashboard: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingNameValue, setEditingNameValue] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profilesRes, storesRes] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('stores').select('*').order('name')
            ]);

            if (profilesRes.data) setProfiles(profilesRes.data);
            if (storesRes.data) setStores(storesRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ approved_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleUpdateUser = async (userId: string, updates: Partial<Profile>) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleStartEditName = (user: Profile) => {
        setEditingNameId(user.id);
        setEditingNameValue(user.name || '');
    };

    const handleSaveName = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ name: editingNameValue.trim() || null })
                .eq('id', userId);

            if (error) throw error;
            setEditingNameId(null);
            setEditingNameValue('');
            fetchData();
        } catch (error) {
            console.error('Error updating name:', error);
            alert('Erro ao salvar nome');
        }
    };

    const handleCancelEditName = () => {
        setEditingNameId(null);
        setEditingNameValue('');
    };

    if (loading) return (
        <div className="arbalest-layout-container">
            <div className="arbalest-loading-state">
                <div className="spinner" />
                <p>Carregando dados...</p>
            </div>
        </div>
    );

    return (
        <div className="arbalest-layout-container">
            <header className="arbalest-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => window.history.back()}>Configurações</span>
                        <ChevronRight size={14} />
                        <span style={{ color: 'white' }}>Usuários</span>
                    </div>
                    <h1>Permissões de Usuários</h1>
                </div>
            </header>

            <div className="arbalest-table-container">
                <table className="arbalest-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Cargo</th>
                            <th>Nível Açougue</th>
                            <th>Loja Vinculada</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="email" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.email}</span>
                                        <span className="id-sub" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{user.id.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td>
                                    {editingNameId === user.id ? (
                                        <div className="name-edit-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="text"
                                                value={editingNameValue}
                                                onChange={(e) => setEditingNameValue(e.target.value)}
                                                placeholder="Nome..."
                                                className="arbalest-input"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveName(user.id)}
                                                className="arbalest-icon-btn arbalest-btn-primary"
                                                title="Salvar"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={handleCancelEditName}
                                                className="arbalest-icon-btn"
                                                title="Cancelar"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="name-display-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={user.name ? '' : 'text-muted'} style={{ color: user.name ? 'inherit' : 'var(--text-tertiary)' }}>
                                                {user.name || 'Não definido'}
                                            </span>
                                            <button
                                                onClick={() => handleStartEditName(user)}
                                                className="arbalest-icon-btn"
                                                title="Editar nome"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {user.approved_at ? (
                                        <span className="arbalest-badge arbalest-badge-success">Aprovado</span>
                                    ) : (
                                        <span className="arbalest-badge arbalest-badge-warning">Pendente</span>
                                    )}
                                </td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                                        className="arbalest-select"
                                    >
                                        <option value="conferente">Conferente</option>
                                        <option value="planogram_edit">Planograma (Editor)</option>
                                        <option value="planogram_view">Planograma (Visualizador)</option>
                                        <option value="encarregado">Encarregado</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>
                                    <select
                                        value={user.butcher_role || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            handleUpdateUser(user.id, { butcher_role: val === '' ? null : val as 'requester' | 'producer' });
                                        }}
                                        className="arbalest-select"
                                        style={{ minWidth: '140px' }}
                                    >
                                        <option value="">Nenhum</option>
                                        <option value="requester">Açougue Solicitante</option>
                                        <option value="producer">Açougue Produção</option>
                                    </select>
                                </td>
                                <td>
                                    <select
                                        value={user.store_id || ''}
                                        onChange={(e) => handleUpdateUser(user.id, { store_id: e.target.value || null })}
                                        className="arbalest-select"
                                    >
                                        <option value="">Selecione...</option>
                                        {stores.map(store => (
                                            <option key={store.id} value={store.id}>
                                                {store.name} ({store.code})
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    {!user.approved_at && (
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            className="arbalest-icon-btn arbalest-btn-primary"
                                            title="Aprovar Acesso"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
