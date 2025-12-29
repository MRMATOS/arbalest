import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, LogOut, User, Store, Pencil, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import './Profile.css';

export const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);

    const handleSaveName = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ name: displayName.trim() || null })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state - the AuthContext will get the new value on next refresh
            setIsEditingName(false);
            // Force a page reload to update the AuthContext
            window.location.reload();
        } catch (err) {
            console.error('Error updating name:', err);
            alert('Erro ao salvar nome');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setDisplayName(user?.name || '');
        setIsEditingName(false);
    };

    return (
        <div className="profile-container">
            <header className="page-header">
                <h1>Meu Perfil</h1>
            </header>

            <div className="profile-card glass">
                <div className="profile-header">
                    <div className="avatar">
                        <User size={40} />
                    </div>
                    <div className="profile-info">
                        <h2>{user?.email}</h2>
                        <span className="role-badge">{user?.role}</span>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="detail-item">
                        <label>Nome de Exibição</label>
                        {isEditingName ? (
                            <div className="edit-name-container">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Digite seu nome..."
                                    className="name-input"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveName}
                                    disabled={saving}
                                    className="icon-btn save-btn"
                                    title="Salvar"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="icon-btn cancel-btn"
                                    title="Cancelar"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="name-display">
                                <span>{user?.name || 'Não definido'}</span>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="icon-btn edit-btn"
                                    title="Editar nome"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="detail-item">
                        <label>Loja Vinculada</label>
                        <div className="store-display">
                            <Store size={16} />
                            <span>{user?.store?.name || 'Nenhuma loja vinculada'}</span>
                        </div>
                    </div>
                </div>

                <div className="profile-actions">
                    {user?.role === 'admin' && (
                        <Link to="/admin" className="action-button admin-btn">
                            <Shield size={20} />
                            Acessar Painel Admin
                        </Link>
                    )}

                    <button onClick={logout} className="action-button logout-btn">
                        <LogOut size={20} />
                        Sair da Conta
                    </button>
                </div>
            </div>
        </div>
    );
};
