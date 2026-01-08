import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Calendar, Map, Settings, Beef, User } from 'lucide-react';

export const ModuleHub = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const hasValidityAccess = (user?.role === 'admin' || user?.role === 'encarregado' || user?.role === 'conferente') && user?.store?.show_validity !== false;
    const hasPlanogramAccess = (user?.role === 'admin' || user?.role === 'planogram_edit' || user?.role === 'planogram_view') && user?.store?.show_planogram !== false;
    const hasSettingsAccess = user?.role === 'admin';



    const isRestrictedAcougue = user?.role === 'acougue';

    // Hide other modules if user is restricted to 'acougue'
    const isValidityVisible = !isRestrictedAcougue && user?.store?.show_validity !== false;
    const isPlanogramVisible = !isRestrictedAcougue && user?.store?.show_planogram !== false;

    // Mobile Action for Hub: Profile Link
    const profileMobileAction = (
        <div
            className="nav-btn"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
        >
            <User size={24} />
            <span>Perfil</span>
        </div>
    );

    return (
        <DashboardLayout customMobileAction={profileMobileAction}>
            <div className="content-area" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh', // Reduced to account for layout headers
                padding: '20px'
            }}>
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
                    {/* Validade Module Card */}
                    {isValidityVisible && (
                        <div

                            className={`glass item-card ${!hasValidityAccess ? 'disabled' : ''}`}
                            onClick={() => hasValidityAccess && navigate('/validity')}
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start', // Left align
                                cursor: hasValidityAccess ? 'pointer' : 'not-allowed',
                                opacity: hasValidityAccess ? 1 : 0.5,
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                background: 'var(--glass-bg)',
                                minHeight: '160px' // Reduced height
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', width: '100%' }}>
                                <div style={{
                                    background: 'var(--brand-primary)',
                                    width: '48px', // Smaller icon container
                                    height: '48px',
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
                                Controle de vencimentos, auditorias e solicitações de produtos.
                            </p>
                        </div>
                    )}

                    {/* Planogram Module Card */}
                    {isPlanogramVisible && (
                        <div
                            className={`glass item-card ${!hasPlanogramAccess ? 'disabled' : ''}`}
                            onClick={() => hasPlanogramAccess && navigate('/planogram')}
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                cursor: hasPlanogramAccess ? 'pointer' : 'not-allowed',
                                opacity: hasPlanogramAccess ? 1 : 0.5,
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                background: 'var(--glass-bg)',
                                minHeight: '160px'
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', width: '100%' }}>
                                <div style={{
                                    background: '#10b981', // Emerald 500
                                    width: '48px',
                                    height: '48px',
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
                    {(user?.role === 'admin' ||
                        user?.role === 'acougue' ||
                        ['requester', 'producer', 'manager'].includes(user?.butcher_role || '') ||
                        ((user?.role === 'encarregado' || user?.role === 'conferente') && user?.store?.is_butcher_active !== false)
                    ) && (
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
                    {hasSettingsAccess && (
                        <div
                            className="glass item-card"
                            onClick={() => navigate('/settings')}
                            style={{
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                background: 'var(--glass-bg)',
                                minHeight: '300px'
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
                            <div style={{
                                background: '#6366f1', // Indigo 500
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                marginBottom: '20px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}>
                                <Settings size={32} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Configurações Gerais</h2>
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Central administrativa: Lojas, Padrões e Usuários.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout >
    );
};
