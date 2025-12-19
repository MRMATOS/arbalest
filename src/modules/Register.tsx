import React, { useState } from 'react';
import { UserPlus, Mail, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Reusing Login styles for consistency

export const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await signUp(email, password);
            navigate('/aguardando-aprovacao');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
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
                    <h1>Criar Conta</h1>
                    <p>Solicite acesso ao sistema</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email">E-mail</label>
                        <div className="input-field-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirm-password">Confirmar Senha</label>
                        <div className="input-field-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && <span className="error-message">{error}</span>}

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? <div className="spinner" /> : (
                            <>
                                Solicitar Acesso
                                <UserPlus size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <Link to="/login" className="back-link">
                        <ArrowLeft size={16} /> Voltar para o Login
                    </Link>
                </div>
            </div>
        </div>
    );
};
