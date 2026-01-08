import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    Package,
    PlusCircle,
    User,
    X,

    Home,
    Map,
    Settings,
    Beef
} from 'lucide-react';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children?: React.ReactNode;
    onAddClick?: () => void;
    customMobileAction?: React.ReactNode;
    secondaryMobileAction?: React.ReactNode;
    filterMobileAction?: React.ReactNode;
    tertiaryMobileAction?: React.ReactNode;
    hideDefaultModuleNav?: boolean;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    path?: string;
    collapsed?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onAddClick, customMobileAction, secondaryMobileAction, filterMobileAction, tertiaryMobileAction, hideDefaultModuleNav }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const isActive = (path?: string) => {
        if (!path) return false;
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
            {/* Backdrop for Desktop Overlay */}
            <div className="sidebar-overlay" onClick={toggleSidebar}></div>

            {/* Sidebar Desktop/Overlay */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <Package size={24} color="var(--brand-primary)" />
                        {sidebarOpen && <span>Arbalest</span>}
                    </div>
                    <button onClick={toggleSidebar} className="toggle-btn">
                        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">

                    <NavItem
                        icon={<Home size={20} />}
                        label="Início"
                        path="/"
                        active={isActive('/')}
                        collapsed={!sidebarOpen}
                    />

                    {user?.store?.show_validity !== false && user?.role !== 'acougue' && (
                        <NavItem
                            icon={<Calendar size={20} />}
                            label="Validade"
                            path="/validity"
                            active={isActive('/validity')}
                            collapsed={!sidebarOpen}
                        />
                    )}


                    {user?.store?.show_planogram !== false && user?.role !== 'acougue' && (
                        <NavItem
                            icon={<Map size={20} />}
                            label="Planogramas"
                            path="/planogram"
                            active={isActive('/planogram')}
                            collapsed={!sidebarOpen}
                        />
                    )}

                    {(user?.role === 'admin' ||
                        user?.role === 'acougue' ||
                        ['requester', 'producer', 'manager'].includes(user?.butcher_role || '') ||
                        ((user?.role === 'encarregado' || user?.role === 'conferente') && user?.store?.is_butcher_active !== false)
                    ) && (
                            <NavItem
                                icon={<Beef size={20} />}
                                label="Açougue"
                                path="/butcher"
                                active={isActive('/butcher')}
                                collapsed={!sidebarOpen}
                            />
                        )}

                    {user?.role === 'admin' && (
                        <NavItem
                            icon={<Settings size={20} />}
                            label="Configurações"
                            path="/settings"
                            active={isActive('/settings')}
                            collapsed={!sidebarOpen}
                        />
                    )}
                </nav>

                <div className="sidebar-footer">
                    <Link to="/profile" className={`user-info ${!sidebarOpen ? 'collapsed' : ''}`}>
                        <div className="avatar">
                            <User size={18} />
                        </div>
                        {sidebarOpen && (
                            <div className="details">
                                <span className="name">{user?.name || user?.email || user?.role}</span>
                                <span className="role">{user?.role}</span>
                            </div>
                        )}
                    </Link>
                    <button onClick={logout} className={`nav-item logout ${!sidebarOpen ? 'collapsed' : ''}`}>
                        <div className="icon"><LogOut size={20} /></div>
                        {sidebarOpen && <span className="label">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Header Mobile */}
            <header className="mobile-header glass">
                <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Package size={24} color="var(--brand-primary)" />
                    <span>Arbalest</span>
                </Link>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay glass" onClick={toggleMobileMenu}>
                    <div className="mobile-menu" onClick={e => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <h3>Menu</h3>
                            <button onClick={toggleMobileMenu}><X size={24} /></button>
                        </div>
                        <nav className="mobile-nav">
                            <NavItem icon={<Home size={20} />} label="Início" path="/" active={isActive('/')} />
                            {user?.store?.show_validity !== false && user?.role !== 'acougue' && (
                                <NavItem icon={<Calendar size={20} />} label="Validade" path="/validity" active={isActive('/validity')} />
                            )}
                            {user?.store?.show_planogram !== false && user?.role !== 'acougue' && (
                                <NavItem icon={<Map size={20} />} label="Planogramas" path="/planogram" active={isActive('/planogram')} />
                            )}
                            {user?.role === 'admin' && (
                                <NavItem icon={<Settings size={20} />} label="Configurações" path="/settings" active={isActive('/settings')} />
                            )}
                            <NavItem icon={<User size={20} />} label="Perfil" path="/profile" active={isActive('/profile')} />
                        </nav>
                        <button onClick={logout} className="mobile-logout">
                            <LogOut size={20} /> Sair
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="main-content">
                <div className="main-header desktop-only">
                    <button onClick={toggleSidebar} className="menu-toggle-btn">
                        <Menu size={24} />
                    </button>
                    <div className="header-actions" style={{ marginLeft: 'auto' }}>
                        <div className="user-profile">
                            <span className="role-badge">{user?.role}</span>
                            <span className="store-badge">{user?.store?.name || 'Sem Loja'}</span>
                        </div>
                    </div>
                </div>
                <div className="content-area">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation (Instagram Style) */}
            <footer className="mobile-bottom-nav glass">
                <button className={`nav-btn ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
                    <Menu size={24} /><span>Menu</span>
                </button>


                {/* Dynamic Module Icon - Hide in Butcher Module, Hub, Profile, or if explicitly hidden */}
                {!location.pathname.startsWith('/butcher') && location.pathname !== '/' && location.pathname !== '/profile' && !hideDefaultModuleNav && (
                    location.pathname.startsWith('/planogram') ? (
                        <Link to="/planogram" className="nav-btn active">
                            <Map size={24} /><span>Mapa</span>
                        </Link>
                    ) : (
                        <Link to="/validity" className={`nav-btn ${isActive('/validity') ? 'active' : ''}`}>
                            <Calendar size={24} /><span>Validade</span>
                        </Link>
                    )
                )}

                {filterMobileAction}

                {secondaryMobileAction}

                {tertiaryMobileAction}

                {customMobileAction ? (
                    customMobileAction
                ) : (
                    <button
                        className={`nav-btn add-btn-mobile ${!onAddClick ? 'disabled' : ''}`}
                        onClick={() => onAddClick?.()}
                        disabled={!onAddClick}
                        style={{ opacity: onAddClick ? 1 : 0.5, pointerEvents: onAddClick ? 'auto' : 'none' }}
                    >
                        <PlusCircle size={28} color={onAddClick ? "var(--brand-primary)" : "var(--text-tertiary)"} />
                    </button>
                )}
            </footer>
        </div >
    );
};

const NavItem: React.FC<NavItemProps & { active?: boolean }> = ({ icon, label, path, active, collapsed }) => {
    if (path) {
        return (
            <Link to={path} className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}>
                <div className="icon">{icon}</div>
                {!collapsed && <span className="label">{label}</span>}
            </Link>
        );
    }

    return (
        <div className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`} style={{ cursor: 'default' }}>
            <div className="icon">{icon}</div>
            {!collapsed && <span className="label">{label}</span>}
        </div>
    );
};
