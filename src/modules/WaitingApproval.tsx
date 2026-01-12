import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export const WaitingApproval: React.FC = () => {
    const { logout } = useAuth();

    return (
        <div className="login-container">
            <div className="login-card glass waiting-card">
                <div className="status-icon-wrapper">
                    <Clock size={48} color="var(--warning)" />
                </div>

                <h1>Aguardando Aprovação</h1>

                <div className="waiting-content">
                    <p>Sua conta foi criada com sucesso!</p>
                    <p className="instruction">
                        Por favor, aguarde ou entre em contato com seu supervisor para liberar seu acesso.
                    </p>
                </div>

                <button onClick={logout} className="login-button secondary">
                    Sair e Tentar Novamente
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    );
};
