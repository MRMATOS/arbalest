import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Check } from 'lucide-react';
import './AdminDashboard.css';

interface Profile {
    id: string;
    email: string;
    role: string;
    store_id: string | null;
    approved_at: string | null;
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

    if (loading) return <div className="loading-state"><div className="spinner" /></div>;

    return (
        <div className="admin-dashboard">
            <header className="page-header">
                <div>
                    <h1>Administração</h1>
                    <p>Gerenciamento de Usuários e Acessos</p>
                </div>
            </header>

            <div className="admin-content glass">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Status</th>
                            <th>Cargo</th>
                            <th>Loja Vinculada</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        <span className="email">{user.email}</span>
                                        <span className="id-sub">{user.id.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td>
                                    {user.approved_at ? (
                                        <span className="status-badge success">Aprovado</span>
                                    ) : (
                                        <span className="status-badge warning">Pendente</span>
                                    )}
                                </td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                                        className="role-select"
                                    >
                                        <option value="conferente">Conferente</option>
                                        <option value="encarregado">Encarregado</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>
                                    {(user.role === 'encarregado' || user.role === 'admin') ? (
                                        <select
                                            value={user.store_id || ''}
                                            onChange={(e) => handleUpdateUser(user.id, { store_id: e.target.value || null })}
                                            className="store-select"
                                        >
                                            <option value="">Selecione...</option>
                                            {stores.map(store => (
                                                <option key={store.id} value={store.id}>
                                                    {store.name} ({store.code})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                <td>
                                    {!user.approved_at && (
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            className="action-btn approve"
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
