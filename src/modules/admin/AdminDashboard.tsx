import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Check, Pencil, ChevronRight, Trash2, PlusCircle } from 'lucide-react';
import { UserEditModal } from './UserEditModal';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import type { Profile } from '../../contexts/AuthContext';

interface StoreType {
    id: string;
    name: string;
    code: string;
}

export const AdminDashboard: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);



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

            if (profilesRes.data) {
                console.log('📥 Profiles carregados:', profilesRes.data.length, 'usuários');
                console.log('👤 Primeiro usuário:', profilesRes.data[0]);
                setProfiles(profilesRes.data);
            }
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

    const handleSaveUser = async (userId: string | null, updates: Partial<Profile> & { password?: string }) => {
        try {
            console.log('🗄️ AdminDashboard - handleSaveUser chamado:', {
                userId,
                updates,
                permissions: updates.permissions
            });

            if (userId) {
                // Edit: Direct Update
                const { error } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', userId);

                if (error) throw error;
                console.log('✅ Update bem-sucedido para userId:', userId);
            } else {
                // Create: Call Edge Function
                const { error } = await supabase.functions.invoke('manage-user', {
                    body: {
                        action: 'create',
                        userData: {
                            ...updates,
                            // Ensure email/password are present for creation (UserEditModal handles validation)
                        }
                    }
                });

                if (error) throw error;
                console.log('✅ Usuário criado com sucesso');
            }

            await fetchData();
        } catch (error) {
            console.error('❌ Error saving user:', error);
            throw error;
        }
    };

    const onEditUser = (user: Profile) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const onAddUser = () => {
        setSelectedUser(null);
        setIsEditModalOpen(true);
    };

    const onDeleteUser = async (user: Profile) => {
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.name || user.email}?`)) return;

        try {
            setLoading(true); // Show loading state
            // Call Edge Function
            const { error } = await supabase.functions.invoke('manage-user', {
                body: {
                    action: 'delete',
                    userId: user.id
                }
            });

            if (error) throw error;

            await fetchData(); // Refresh list
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Falha ao excluir usuário. Verifique as permissões.');
            setLoading(false); // Manually stop loading if error (fetchData handles it on success)
        }
    };

    // Mobile Action
    const mobileAddButton = (
        <div
            onClick={onAddUser}
            className="nav-btn"
            style={{ cursor: 'pointer' }}
        >
            <PlusCircle size={28} style={{ color: 'var(--brand-primary)' }} />
        </div>
    );

    if (loading) return (
        <div className="arbalest-layout-container">
            <div className="arbalest-loading-state">
                <div className="spinner" />
                <p>Carregando dados...</p>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            mobileAction={mobileAddButton}
        >
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
                    <button
                        className="arbalest-btn arbalest-btn-primary hide-mobile"
                        onClick={onAddUser}
                    >
                        Adicionar Usuário
                    </button>
                </header>

                {/* Desktop Table */}
                <div className="arbalest-table-container hide-mobile">
                    <table className="arbalest-table">
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Email</th>
                                <th>Nome</th>
                                <th>Status</th>
                                <th>Loja Vinculada</th>
                                <th className="actions-col">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <span style={{ fontWeight: 500 }}>{user.username || '-'}</span>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
                                    </td>
                                    <td>
                                        <span>{user.name || 'Não definido'}</span>
                                    </td>
                                    <td>
                                        {user.approved_at ? (
                                            <span className="arbalest-badge arbalest-badge-success">Aprovado</span>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className="arbalest-badge arbalest-badge-warning">Pendente</span>
                                                <button
                                                    onClick={() => handleApprove(user.id)}
                                                    className="arbalest-icon-btn"
                                                    title="Aprovar Acesso"
                                                    style={{ color: 'var(--success)', minWidth: '32px', height: '32px' }}
                                                >
                                                    <Check size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span>
                                            {/* Legacy field - will be removed after migration period */}
                                            {stores.find(s => s.id === user.store_id)?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                className="arbalest-icon-btn"
                                                onClick={() => onEditUser(user)}
                                                title="Editar"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="arbalest-icon-btn"
                                                onClick={() => onDeleteUser(user)}
                                                title="Excluir"
                                                style={{ color: 'var(--error)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="mobile-view">
                    {profiles.map(user => (
                        <div key={user.id} className="arbalest-glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>{user.name || 'Não definido'}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 500 }}>@{user.username || '-'}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                                    </div>
                                </div>
                                {user.approved_at ? (
                                    <span className="arbalest-badge arbalest-badge-success">Aprovado</span>
                                ) : (
                                    <span className="arbalest-badge arbalest-badge-warning">Pendente</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
                                <span style={{ opacity: 0.7 }}>Loja:</span>
                                {/* Legacy field - will be removed after migration period */}
                                <span style={{ color: 'white' }}>{stores.find(s => s.id === user.store_id)?.name || 'Nenhuma'}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                {!user.approved_at && (
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        className="arbalest-btn arbalest-btn-primary"
                                        style={{ flex: 1, height: '36px', fontSize: '0.9rem' }}
                                    >
                                        <Check size={16} /> Aprovar
                                    </button>
                                )}
                                <button
                                    className="arbalest-btn arbalest-btn-outline"
                                    onClick={() => onEditUser(user)}
                                    style={{ flex: 1, height: '36px', fontSize: '0.9rem' }}
                                >
                                    <Pencil size={16} /> Editar
                                </button>
                                <button
                                    className="arbalest-btn arbalest-btn-outline-danger"
                                    onClick={() => onDeleteUser(user)}
                                    style={{ flex: 1, height: '36px', fontSize: '0.9rem' }}
                                >
                                    <Trash2 size={16} /> Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <UserEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    user={selectedUser}
                    stores={stores}
                    onSave={handleSaveUser}
                />
            </div>
        </DashboardLayout>
    );
};
