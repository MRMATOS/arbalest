import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, ShieldCheck, Eye, EyeOff, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './Login.css';

export const Login: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) return;

        setIsLoading(true);
        setError('');

        try {
            let emailToUse = identifier.trim();

            // Simple check if input looks like an email
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse);

            if (!isEmail) {
                // It's a username, fetch the email
                const { data: userEmail, error: rpcError } = await supabase.rpc('get_email_by_username', {
                    username_input: emailToUse
                });

                if (rpcError || !userEmail) {
                    throw new Error('Usuário não encontrado.');
                }
                emailToUse = userEmail;
            }

            await login(emailToUse, password);
            navigate('/');
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message === 'Usuário não encontrado.' ? error.message : 'Erro ao fazer login. Verifique suas credenciais.');
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
                        <label htmlFor="identifier">Email ou Usuário</label>
                        <div className="input-field-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                id="identifier"
                                type="text"
                                placeholder="seu@email.com ou usuário"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <div className="input-field-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <span className="error-message">{error}</span>}

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? <div className="spinner" /> : (
                            <>
                                Entrar
                                <LogIn size={18} />
                            </>
                        )}
                    </button>

                    <div className="register-link-wrapper">
                        <span>Não tem conta?</span>
                        <Link to="/register">Solicitar acesso</Link>
                    </div>
                </form>

                <div className="login-footer">
                    <p>© 2025 Arbalest Digital - Operações de Supermercado</p>
                </div>
            </div>
        </div>
    );
};
