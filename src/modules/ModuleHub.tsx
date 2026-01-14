import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Calendar, Map, Settings, Beef, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hasModuleAccess } from '../utils/permissions';

export const ModuleHub = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Use new permission system for module access
    const canAccessValidity = hasModuleAccess(user, 'validity');

    const canAccessButcher = hasModuleAccess(user, 'butcher');
    const canAccessPlanogram = hasModuleAccess(user, 'planogram');
    const canAccessSettings = user?.is_admin;

    // Mobile Action for Hub: Profile Link
    const mobileProfileLink = (
        <Link to="/profile" className="nav-btn" style={{ minWidth: '60px' }}>
            <User size={24} />
            <span>Perfil</span>
        </Link>
    );

    return (
        <DashboardLayout mobileAction={mobileProfileLink}>
            <div className="content-area module-hub-content">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Bem-vindo, {user?.name?.split(' ')[0]}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Selecione o módulo que deseja acessar</p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    maxWidth: '1200px',
                    width: '100%'
                }}>
                    {/* Validade Module Card */}
                    {canAccessValidity && (
                        <div

                            className={`glass item-card`}
                            onClick={() => navigate('/validity')}
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start', // Left align
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                background: 'var(--glass-bg)',
                                minHeight: '160px' // Reduced height
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'var(--glass-bg)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', width: '100%' }}>
                                <div style={{
                                    background: 'var(--brand-primary)',
                                    width: '48px', // Smaller icon container
                                    height: '48px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <Calendar size={24} color="white" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Gestão de Validade</h2>
                            </div>
                            <p style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                Controle de vencimentos e conferências.
                            </p>
                        </div>
                    )}

                    {/* Planogram Module Card */}
                    {canAccessPlanogram && (
                        <div
                            className={`glass item-card`}
                            onClick={() => navigate('/planogram')}
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                background: 'var(--glass-bg)',
                                minHeight: '160px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'var(--glass-bg)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', width: '100%' }}>
                                <div style={{
                                    background: '#10b981', // Emerald 500
                                    width: '48px',
                                    height: '48px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <Map size={24} color="white" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Planogramas</h2>
                            </div>
                            <p style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                Mapeamento de produtos, geração de etiquetas e gestão de layout.
                            </p>
                        </div>
                    )}

                    {/* Butcher Module Card */}
                    {canAccessButcher && (
                        <div
                            className="glass item-card"
                            onClick={() => navigate('/butcher')}
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                background: 'var(--glass-bg)',
                                minHeight: '160px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'var(--glass-bg)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', width: '100%' }}>
                                <div style={{
                                    background: '#ef4444', // Red 500
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <Beef size={24} color="white" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Açougue</h2>
                            </div>
                            <p style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                Gestão de produção e pedidos de cortes.
                            </p>
                        </div>
                    )}

                    {/* Settings Module Card - Admin Only */}
                    {canAccessSettings && (
                        <div
                            className="glass item-card"
                            onClick={() => navigate('/settings')}
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                background: 'var(--glass-bg)',
                                minHeight: '160px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'var(--glass-bg)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', width: '100%' }}>
                                <div style={{
                                    background: '#6366f1', // Indigo 500
                                    width: '48px',
                                    height: '48px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <Settings size={24} color="white" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Configurações Gerais</h2>
                            </div>
                            <p style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                Central administrativa: Lojas, Padrões e Usuários.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout >
    );
};
