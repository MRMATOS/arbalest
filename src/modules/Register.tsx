import React, { useState } from 'react';
import { UserPlus, Mail, Lock, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Reusing Login styles for consistency

export const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { signUp } = useAuth();

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
            setSuccess(true);
        } catch (error: any) {
            console.error('Registration error:', error);

            const msg = error.message || error.msg || '';

            // Translation Map
            if (msg.includes('User already registered') || msg.includes('already registered')) {
                setError('Este e-mail já está cadastrado. Tente fazer login.');
            } else if (msg.includes('For security purposes')) {
                setError('Por motivos de segurança, aguarde alguns instantes antes de tentar novamente.');
            } else if (msg.includes('Rate limit exceeded')) {
                setError('Muitas tentativas. Aguarde um momento.');
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Erro ao criar conta. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-container">
                <div className="login-card glass">
                    <div className="login-header">
                        <div className="logo-badge">
                            <ShieldCheck size={32} color="var(--brand-primary)" />
                        </div>
                        <h1>Conta Criada!</h1>
                        <p>Verifique seu e-mail para confirmar seu cadastro.</p>
                    </div>

                    <div className="login-form" style={{ textAlign: 'center' }}>
                        <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Mail size={32} color="var(--success)" />
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                            Um link de confirmação foi enviado para <strong>{email}</strong>.
                            <br />
                            Clique no link para ativar sua conta e acessar o sistema.
                        </p>

                        <Link to="/login" className="login-button" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <ArrowLeft size={18} />
                            Voltar para o Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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

                    <div className="input-group">
                        <label htmlFor="confirm-password">Confirmar Senha</label>
                        <div className="input-field-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
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
