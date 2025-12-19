import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, LogOut, User, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Profile.css';

export const Profile: React.FC = () => {
    const { user, logout } = useAuth();

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
