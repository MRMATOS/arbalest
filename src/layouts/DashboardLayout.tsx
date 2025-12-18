import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    BarChart3,
    Calendar,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    Package,
    PlusCircle,
    Search,
    User,
    X
} from 'lucide-react';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children?: React.ReactNode;
    onAddClick?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onAddClick }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
                    <NavItem icon={<BarChart3 size={20} />} label="Dashboard" active collapsed={!sidebarOpen} />
                    <NavItem icon={<Calendar size={20} />} label="Validade" collapsed={!sidebarOpen} />
                    <NavItem icon={<Package size={20} />} label="Produtos" collapsed={!sidebarOpen} />
                </nav>

                <div className="sidebar-footer">
                    <button
                        className={`nav-item ${!sidebarOpen ? 'collapsed' : ''}`}
                        onClick={() => onAddClick?.()}
                    >
                        <div className="icon"><PlusCircle size={20} /></div>
                        {sidebarOpen && <span className="label">Adicionar</span>}
                    </button>
                    <div className="user-info">
                        <div className="avatar">
                            <User size={18} />
                        </div>
                        {sidebarOpen && (
                            <div className="details">
                                <span className="name">{user?.full_name || user?.role}</span>
                                <span className="role">{user?.role}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={logout} className={`logout-btn ${!sidebarOpen ? 'collapsed' : ''}`}>
                        <LogOut size={20} />
                        {sidebarOpen && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Header Mobile */}
            <header className="mobile-header glass">
                <button onClick={toggleMobileMenu} className="menu-btn">
                    <Menu size={24} />
                </button>
                <div className="logo">
                    <Package size={24} color="var(--brand-primary)" />
                    <span>Arbalest</span>
                </div>
                <button className="user-btn">
                    <User size={24} />
                </button>
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
                            <NavItem icon={<BarChart3 size={20} />} label="Dashboard" active />
                            <NavItem icon={<Calendar size={20} />} label="Validade" />
                            <NavItem icon={<Package size={20} />} label="Produtos" />
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
                    <div className="search-bar glass">
                        <Search size={18} />
                        <input type="text" placeholder="Buscar no sistema..." />
                    </div>
                    <div className="header-actions">
                        <div className="user-profile">
                            <span className="role-badge">{user?.role}</span>
                            <span className="store-badge">Loja Principal</span>
                        </div>
                    </div>
                </div>
                <div className="content-area">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation (Instagram Style) */}
            <footer className="mobile-bottom-nav glass">
                <button className="nav-btn"><User size={24} /><span>Perfil</span></button>
                <button className="nav-btn"><Package size={24} /><span>Produtos</span></button>
                <button className="nav-btn active"><BarChart3 size={24} /><span>Home</span></button>
                <button className="nav-btn"><Calendar size={24} /><span>Validade</span></button>
                <button className="nav-btn add-btn-mobile" onClick={() => onAddClick?.()}><PlusCircle size={28} color="var(--brand-primary)" /></button>
            </footer>
        </div>
    );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, collapsed?: boolean }> =
    ({ icon, label, active, collapsed }) => (
        <div className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}>
            <div className="icon">{icon}</div>
            {!collapsed && <span className="label">{label}</span>}
        </div>
    );
