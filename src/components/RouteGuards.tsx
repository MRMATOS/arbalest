import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';

export const RequirePermissions = () => {
    const { user } = useAuth();

    // Admin always has partial access (can at least access settings)
    if (user?.role === 'admin') {
        return <Outlet />;
    }

    // Must have both Role and Store assigned
    if (!user?.role || !user?.store_id) {
        return (
            <DashboardLayout hideDefaultModuleNav={true}>
                <div className="arbalest-layout-container" style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="arbalest-glass" style={{
                        padding: '32px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={32} color="var(--error)" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem' }}>Acesso Restrito</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Suas permissões ainda não foram concedidas. Aguarde o administrador configurar seu cargo e loja.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return <Outlet />;
};

interface ModuleAccessProps {
    module: 'validity' | 'planogram' | 'butcher' | 'settings';
}

export const RequireModuleAccess: React.FC<ModuleAccessProps> = ({ module }) => {
    const { user } = useAuth();

    if (!user?.role) return <Navigate to="/" replace />;

    const hasAccess = () => {
        if (user.role === 'admin') return true;

        switch (module) {
            case 'validity':
                return (user.role === 'encarregado' || user.role === 'conferente') &&
                    user.store?.show_validity !== false;

            case 'planogram':
                return (user.role === 'planogram_edit' || user.role === 'planogram_view') &&
                    user.store?.show_planogram !== false;

            case 'butcher':
                // Check if user has explicit butcher role access
                if (user.role === 'acougue') return true;
                if (['requester', 'producer', 'manager'].includes(user.butcher_role || '')) return true;

                // Check if store allows butcher access for standard roles
                return (user.role === 'encarregado' || user.role === 'conferente') &&
                    user.store?.is_butcher_active !== false;

            case 'settings':
                return false; // Only admin (handled above)

            default:
                return false;
        }
    };

    if (!hasAccess()) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
