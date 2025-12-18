import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, ShieldCheck } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setError('');

        try {
            await login(email);
        } catch (err) {
            setError('E-mail não encontrado nos registros.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass">
                <div className="login-header">
                    <div className="logo-badge">
                        <ShieldCheck size={32} color="var(--brand-primary)" />
                    </div>
                    <h1>Arbalest Digital</h1>
                    <p>Validade de Produtos</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email">Acesso via E-mail</label>
                        <div className="input-field-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                placeholder="exemplo@arbalest.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        {error && <span className="error-message">{error}</span>}
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? <div className="spinner" /> : (
                            <>
                                Entrar no Sistema
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2025 Arbalest Digital - Operações de Supermercado</p>
                </div>
            </div>
        </div>
    );
};
