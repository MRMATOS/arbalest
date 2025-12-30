import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Map, LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../modules/validity/ValidityList.css'; // Reuse existing glass styles

export const ModuleHub = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const hasValidityAccess = user?.role === 'admin' || user?.role === 'encarregado' || user?.role === 'conferente';
    const hasPlanogramAccess = user?.role === 'admin' || user?.role === 'planogram_edit' || user?.role === 'planogram_view';

    return (
        <div className="layout-container">
            {/* Header tailored for Hub */}
            <header className="header glass" style={{ marginBottom: '40px' }}>
                <div className="header-left">
                    <img
                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Alien%20Monster.png"
                        alt="T.T"
                        width="32"
                        height="32"
                    />
                    <span className="logo-text">Arbalest Digital</span>
                </div>

                <div className="header-actions">
                    <button className="icon-btn" onClick={toggleTheme} title="Alternar Tema">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button className="icon-btn" onClick={handleLogout} title="Sair">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="content-area" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 100px)',
                padding: '20px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Bem-vindo, {user?.name?.split(' ')[0]}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Selecione o módulo que deseja acessar</p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    maxWidth: '800px',
                    width: '100%'
                }}>
                    {/* Validade Module Card */}
                    <div
                        className={`glass item-card ${!hasValidityAccess ? 'disabled' : ''}`}
                        onClick={() => hasValidityAccess && navigate('/validity')}
                        style={{
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: hasValidityAccess ? 'pointer' : 'not-allowed',
                            opacity: hasValidityAccess ? 1 : 0.5,
                            transition: 'all 0.3s ease',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            background: 'var(--glass-bg)'
                        }}
                        onMouseEnter={(e) => {
                            if (hasValidityAccess) {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (hasValidityAccess) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'var(--glass-bg)';
                            }
                        }}
                    >
                        <div style={{
                            background: 'var(--brand-primary)',
                            padding: '16px',
                            borderRadius: '50%',
                            marginBottom: '20px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}>
                            <Calendar size={32} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Gestão de Validade</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Controle de vencimentos, auditorias e solicitações de produtos.
                        </p>
                    </div>

                    {/* Planogram Module Card */}
                    <div
                        className={`glass item-card ${!hasPlanogramAccess ? 'disabled' : ''}`}
                        onClick={() => hasPlanogramAccess && navigate('/planogram')}
                        style={{
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: hasPlanogramAccess ? 'pointer' : 'not-allowed',
                            opacity: hasPlanogramAccess ? 1 : 0.5,
                            transition: 'all 0.3s ease',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            background: 'var(--glass-bg)'
                        }}
                        onMouseEnter={(e) => {
                            if (hasPlanogramAccess) {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (hasPlanogramAccess) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'var(--glass-bg)';
                            }
                        }}
                    >
                        <div style={{
                            background: '#10b981', // Emerald 500
                            padding: '16px',
                            borderRadius: '50%',
                            marginBottom: '20px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}>
                            <Map size={32} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Planogramas</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Mapeamento de produtos, geração de etiquetas e gestão de layout.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
