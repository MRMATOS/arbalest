import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, User, Pencil, Check, Lock } from 'lucide-react';
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



    const mobileProfileLink = (
        <Link to="/profile" className="nav-btn active" style={{ minWidth: '60px' }}>
            <User size={24} />
            <span>Perfil</span>
        </Link>
    );

    return (
        <DashboardLayout mobileAction={mobileProfileLink}>
            <div className="profile-container">
                <header className="page-header">
                    <h1>Meu Perfil</h1>
                </header>

                <div className="profile-card">
                    {/* Header */}
                    <div className="profile-header">
                        <div className="avatar-wrapper">
                            <div className="profile-avatar">
                                <User size={40} />
                            </div>
                        </div>
                        <div className="profile-info">
                            <h2>{user?.name || 'Usuário Arbalest'}</h2>

                            <div style={{ marginTop: 6, opacity: 0.6, fontSize: '0.9rem' }}>{user?.email}</div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="profile-details">
                        {/* Name Field */}
                        <div className="detail-group">
                            <label className="detail-label">Nome de Exibição</label>
                            {isEditingName ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="input-display-wrapper">
                                        <div className="input-icon-box">
                                            <User size={18} />
                                        </div>
                                        <input
                                            className="detail-input"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Seu nome"
                                            autoFocus
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                            className="action-btn cancel-btn"
                                            style={{ width: 'auto', padding: '0 16px' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveName}
                                            disabled={saving}
                                            className="action-btn save-btn"
                                            style={{ width: 'auto', padding: '0 16px', gap: '8px' }}
                                        >
                                            <Check size={18} /> Salvar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="input-display-wrapper">
                                    <div className="input-icon-box">
                                        <User size={18} />
                                    </div>
                                    <span className="detail-value">{user?.name || 'Não definido'}</span>
                                    <button onClick={() => setIsEditingName(true)} className="action-btn edit-btn">
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Username Field */}
                        <div className="detail-group">
                            <label className="detail-label">Nome de Usuário</label>
                            {isEditingUsername ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="input-display-wrapper">
                                        <div className="input-icon-box">
                                            <span style={{ fontSize: '18px', fontWeight: 700 }}>@</span>
                                        </div>
                                        <input
                                            className="detail-input"
                                            value={usernameInput}
                                            onChange={(e) => setUsernameInput(e.target.value)}
                                            placeholder="usuario"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={handleCancelUsernameEdit}
                                            disabled={saving}
                                            className="action-btn cancel-btn"
                                            style={{ width: 'auto', padding: '0 16px' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveUsername}
                                            disabled={saving}
                                            className="action-btn save-btn"
                                            style={{ width: 'auto', padding: '0 16px', gap: '8px' }}
                                        >
                                            <Check size={18} /> Salvar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="input-display-wrapper">
                                    <div className="input-icon-box">
                                        <span style={{ fontSize: '18px', fontWeight: 700 }}>@</span>
                                    </div>
                                    <span className="detail-value">{user?.username || 'Não definido'}</span>
                                    <button onClick={() => setIsEditingUsername(true)} className="action-btn edit-btn">
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>


                    </div>

                    {/* Security Section */}
                    <div className="security-section">
                        <div className="section-title">
                            <Lock size={18} color="var(--brand-primary)" />
                            Segurança
                        </div>

                        <div className="detail-group">
                            <label className="detail-label">Senha</label>
                            {isChangingPassword ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="input-display-wrapper">
                                        <div className="input-icon-box"><Lock size={18} /></div>
                                        <input
                                            type="password"
                                            className="detail-input"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="Nova Senha (min. 6 caracteres)"
                                        />
                                    </div>
                                    <div className="input-display-wrapper">
                                        <div className="input-icon-box"><Lock size={18} /></div>
                                        <input
                                            type="password"
                                            className="detail-input"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            placeholder="Confirmar Nova Senha"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={handleCancelPasswordEdit}
                                            disabled={saving}
                                            className="action-btn cancel-btn"
                                            style={{ width: 'auto', padding: '0 16px' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSavePassword}
                                            disabled={saving}
                                            className="action-btn save-btn"
                                            style={{ width: 'auto', padding: '0 16px', gap: '8px' }}
                                        >
                                            <Check size={18} /> Salvar Senha
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="input-display-wrapper">
                                    <div className="input-icon-box">
                                        <Lock size={18} />
                                    </div>
                                    <span className="detail-value">••••••••••••</span>
                                    <button onClick={() => setIsChangingPassword(true)} className="action-btn edit-btn">
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Access */}
                    {user?.is_admin && (
                        <div className="admin-link-card">
                            <Link to="/settings" className="admin-button">
                                <Shield size={20} />
                                Acessar Painel Admin
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};
