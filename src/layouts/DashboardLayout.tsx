import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Calendar,
    ChevronLeft,
    LogOut,
    Menu,
    User,
    X,
    Home,
    Map,
    Settings,
    Beef
} from 'lucide-react';
import './DashboardLayout.css';
import { supabase } from '../services/supabase';
import { hasModuleAccess, getUserFunctionsLabel, getUserStoreLabel } from '../utils/permissions';

interface DashboardLayoutProps {
    children?: React.ReactNode;
    // New Standardized Mobile Actions
    mobileHistory?: React.ReactNode;
    mobileFilter?: React.ReactNode;
    mobileModule?: React.ReactNode;
    mobileAction?: React.ReactNode;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    path?: string;
    collapsed?: boolean;
    active?: boolean;
    onClick?: () => void;
    className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    mobileHistory,
    mobileFilter,
    mobileModule,
    mobileAction,
}) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const sidebarRef = React.useRef<HTMLDivElement>(null);
    const toggleBtnRef = React.useRef<HTMLButtonElement>(null);

    const [storesList, setStoresList] = useState<Array<{ id: string; name: string }>>([]);

    React.useEffect(() => {
        const fetchStores = async () => {
            const { data } = await supabase.from('stores').select('id, name');
            if (data) setStoresList(data);
        };
        fetchStores();
    }, []);

    const storeLabel = getUserStoreLabel(user, storesList);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sidebarOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node) &&
                toggleBtnRef.current &&
                !toggleBtnRef.current.contains(event.target as Node)
            ) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const NavItem: React.FC<NavItemProps> = ({ icon, label, path, collapsed, active, onClick, className }) => {
        const content = (
            <>
                {icon}
                {!collapsed && <span>{label}</span>}
            </>
        );

        const baseClass = `nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''} ${className || ''}`;

        if (path) {
            return (
                <Link
                    to={path}
                    className={baseClass}
                    title={collapsed ? label : ''}
                    onClick={onClick}
                >
                    {content}
                </Link>
            );
        }

        return (
            <div
                className={baseClass}
                title={collapsed ? label : ''}
                onClick={onClick}
                style={{ cursor: 'pointer' }}
            >
                {content}
            </div>
        );
    };

    const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    const isExactActive = (path: string) => location.pathname === path;

    // Module Access
    const canAccessValidity = hasModuleAccess(user, 'validity');
    const canAccessPlanogram = hasModuleAccess(user, 'planogram');
    const canAccessButcher = hasModuleAccess(user, 'butcher');

    // Hide sidebar on specific routes
    const shouldHideSidebar = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/aguardando-aprovacao';

    if (shouldHideSidebar) {
        return <div className="no-sidebar-layout">{children}</div>;
    }

    // Desktop Navigation Items
    const desktopNavItems = (
        <>
            <NavItem icon={<Home size={20} />} label="Home" path="/" active={isExactActive('/')} />

            {canAccessValidity && (
                <NavItem icon={<Calendar size={20} />} label="Validade" path="/validity" active={isActive('/validity')} />
            )}
            {canAccessPlanogram && (
                <NavItem icon={<Map size={20} />} label="Planogramas" path="/planogram" active={isActive('/planogram')} />
            )}
            {canAccessButcher && (
                <NavItem icon={<Beef size={20} />} label="Açougue" path="/butcher" active={isActive('/butcher')} />
            )}

            <div style={{ flex: 1 }} />

            <div className="sidebar-divider" />

            {user?.is_admin && (
                <NavItem icon={<Settings size={20} />} label="Configurações" path="/settings" active={isActive('/settings')} />
            )}
            <NavItem icon={<User size={20} />} label="Perfil" path="/profile" active={isActive('/profile')} />
            <NavItem icon={<LogOut size={20} />} label="Sair" onClick={handleLogout} className="logout-btn" />
        </>
    );

    return (
        <div className={`dashboard-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>

            {/* Desktop Sidebar (Restored) */}
            <aside className="sidebar desktop-only" ref={sidebarRef}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-placeholder">A</div>
                        <span>Arbalest</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {desktopNavItems}
                </nav>
            </aside>

            {/* Mobile Header (Fixed) */}
            <header className="mobile-header desktop-hidden glass">
                <div className="header-brand">

                    <span className="brand-name">Arbalest Digital</span>
                </div>
                <div className="header-actions">
                    {/* Store name removed as requested */}
                    {/* User icon removed as requested (moved to bottom nav) */}
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="mobile-menu glass" onClick={e => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <h3>Menu</h3>
                            <button onClick={toggleMobileMenu}><X size={24} /></button>
                        </div>
                        <nav className="mobile-nav">
                            <NavItem icon={<Home size={20} />} label="Home" path="/" active={isExactActive('/')} />

                            {canAccessValidity && (
                                <NavItem icon={<Calendar size={20} />} label="Validade" path="/validity" active={isActive('/validity')} />
                            )}
                            {canAccessPlanogram && (
                                <NavItem icon={<Map size={20} />} label="Planogramas" path="/planogram" active={isActive('/planogram')} />
                            )}
                            {canAccessButcher && (
                                <NavItem icon={<Beef size={20} />} label="Açougue" path="/butcher" active={isActive('/butcher')} />
                            )}

                            <div style={{ flex: 1 }} />
                            <div className="mobile-menu-divider" />

                            {user?.is_admin && (
                                <NavItem icon={<Settings size={20} />} label="Configurações" path="/settings" active={isActive('/settings')} />
                            )}
                            <NavItem icon={<User size={20} />} label="Perfil" path="/profile" active={isActive('/profile')} />
                        </nav>
                        <button onClick={handleLogout} className="mobile-logout">
                            <LogOut size={20} /> Sair
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="main-content">
                <div className="main-header desktop-only">
                    {/* Mobile Toggle Button (Only on Mobile normally, but here 'desktop-only' header? Check usage) */}
                    <button onClick={toggleSidebar} className="menu-toggle-btn" ref={toggleBtnRef}>
                        {sidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="header-actions" style={{ marginLeft: 'auto' }}>
                        <div className="user-profile">
                            <span className="role-badge">
                                {getUserFunctionsLabel(user)}
                            </span>
                            {storeLabel && (
                                <span className="store-badge">{storeLabel}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="content-area">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <footer className="mobile-bottom-nav glass">
                <button className={`nav-btn ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
                    <Menu size={24} /><span>Menu</span>
                </button>

                {mobileHistory}
                {mobileFilter}
                {mobileModule}
                {mobileAction}
            </footer>
        </div>
    );
};
