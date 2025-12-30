import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Store, Users, Ruler, ChevronRight } from 'lucide-react';

export const SettingsDashboard: React.FC = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: 'Gerenciamento de Lojas',
            description: 'Cadastre lojas e defina quais módulos estão ativos para cada unidade.',
            icon: <Store size={32} color="white" />,
            iconBg: 'var(--brand-primary)',
            path: '/settings/stores'
        },
        {
            title: 'Padrões de Módulos',
            description: 'Defina as dimensões e características dos equipamentos (gôndolas, freezers).',
            icon: <Ruler size={32} color="white" />,
            iconBg: '#10b981', // Emerald 500
            path: '/planogram/patterns' // Redirects to existing page
        },
        {
            title: 'Permissões de Usuários',
            description: 'Aprove cadastros e defina níveis de acesso para cada módulo.',
            icon: <Users size={32} color="white" />,
            iconBg: '#f59e0b', // Amber 500
            path: '/settings/users' // Redirects to user permissions
        }
    ];

    return (
        <DashboardLayout>
            <div className="fade-in">
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Configurações Gerais</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Central administrativa do sistema Arbalest.</p>
                </div>

                <div className="grid-container" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            className="glass item-card"
                            onClick={() => navigate(item.path)}
                            style={{
                                padding: '24px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                transition: 'transform 0.2s ease, background 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '14px',
                                background: item.iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', fontWeight: 600 }}>{item.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    {item.description}
                                </p>
                            </div>
                            <ChevronRight size={20} color="var(--text-secondary)" />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};
