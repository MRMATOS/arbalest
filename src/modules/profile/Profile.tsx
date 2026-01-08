import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, User, Store, Pencil, Check, X, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import './Profile.css';

export const Profile: React.FC = () => {
    const { user } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(user?.name || '');

    // Password Change State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

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

    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState(user?.username || '');

    const handleCancelEdit = () => {
        setDisplayName(user?.name || '');
        setIsEditingName(false);
    };

    const handleSaveUsername = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ username: usernameInput.trim() || null })
                .eq('id', user.id);

            if (error) throw error;

            setIsEditingUsername(false);
            window.location.reload();
        } catch (err) {
            console.error('Error updating username:', err);
            alert('Erro ao salvar nome de usuário. Verifique se já não existe.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelUsernameEdit = () => {
        setUsernameInput(user?.username || '');
        setIsEditingUsername(false);
    };

    const handleSavePassword = async () => {
        if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
            alert('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            alert('Senha alterada com sucesso!');
            setIsChangingPassword(false);
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Erro ao alterar senha. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelPasswordEdit = () => {
        setIsChangingPassword(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
    };

    const mobileProfileAction = (
        <div className="nav-btn active" style={{ cursor: 'default' }}>
            <User size={24} />
            <span>Perfil</span>
        </div>
    );

    return (
        <DashboardLayout customMobileAction={mobileProfileAction}>
            <div className="profile-container">
                <header className="page-header">
                    <h1>Meu Perfil</h1>
                </header>

                <div className="profile-card glass">
                    <div className="profile-header">
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
                            <label>Nome de Usuário</label>
                            {isEditingUsername ? (
                                <div className="edit-name-container">
                                    <input
                                        type="text"
                                        value={usernameInput}
                                        onChange={(e) => setUsernameInput(e.target.value)}
                                        placeholder="Digite seu nome de usuário..."
                                        className="name-input"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveUsername}
                                        disabled={saving}
                                        className="icon-btn save-btn"
                                        title="Salvar"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        onClick={handleCancelUsernameEdit}
                                        disabled={saving}
                                        className="icon-btn cancel-btn"
                                        title="Cancelar"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="name-display">
                                    <span>{user?.username || 'Não definido'}</span>
                                    <button
                                        onClick={() => setIsEditingUsername(true)}
                                        className="icon-btn edit-btn"
                                        title="Editar nome de usuário"
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

                        <div className="detail-item">
                            <label>Segurança</label>
                            {isChangingPassword ? (
                                <div className="edit-name-container" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: '100%' }}>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="Nova Senha (min. 6 caracteres)"
                                            className="name-input"
                                            style={{ width: '100%', marginBottom: '8px' }}
                                        />
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            placeholder="Confirmar Nova Senha"
                                            className="name-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleSavePassword}
                                            disabled={saving}
                                            className="icon-btn save-btn"
                                            title="Salvar Senha"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={handleCancelPasswordEdit}
                                            disabled={saving}
                                            className="icon-btn cancel-btn"
                                            title="Cancelar"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="name-display">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Lock size={16} className="text-secondary" />
                                        <span>••••••••</span>
                                    </div>
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="icon-btn edit-btn"
                                        title="Alterar Senha"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-actions">
                        {user?.role === 'admin' && (
                            <Link to="/admin" className="action-button admin-btn">
                                <Shield size={20} />
                                Acessar Painel Admin
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
