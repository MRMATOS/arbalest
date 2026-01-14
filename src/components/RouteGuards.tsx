import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { hasModuleAccess } from '../utils/permissions';

export const RequirePermissions = () => {
    const { user } = useAuth();

    // Admin always has access
    if (user?.is_admin) {
        return <Outlet />;
    }

    // Must have both permissions and store assigned (unless legacy role exists)
    if (!user?.permissions && !user?.role) {
        return (
            <DashboardLayout>
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

    if (!user) return <Navigate to="/login" replace />;

    const hasAccess = () => {
        if (user.is_admin) return true;

        // Settings is admin-only, not a regular module
        if (module === 'settings') return false;

        const canAccess = hasModuleAccess(user, module);
        return canAccess;
    };

    if (!hasAccess()) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
