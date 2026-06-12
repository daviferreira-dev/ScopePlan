import { useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLogout } from '../utils/helpers';
import { getInitials, getRoleLabel } from '../utils/helpers';
import { NAV_ITEMS, type NavItem } from '../utils/constants';
import scopeplanLogo from '../assets/scopeplan.png';
import '../styles/app.css';

interface AppLayoutProps {
  perfil: string;
  activePage: string;
  onPageChange: (page: string) => void;
  topbarTitle: string;
  topbarSubtitle?: string;
  topbarActions?: ReactNode;
  children: ReactNode;
}

export default function AppLayout({
  perfil,
  activePage,
  onPageChange,
  topbarTitle,
  topbarSubtitle,
  topbarActions,
  children,
}: AppLayoutProps) {
  const { user } = useAuth();
  const handleLogout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = NAV_ITEMS[perfil] || [];

  return (
    <div className="layout">
      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={scopeplanLogo} alt="ScopePlan" />
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Menu</span>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activePage === item.key ? 'active' : ''}`}
              onClick={() => { onPageChange(item.key); setSidebarOpen(false); }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{getInitials(user?.nome)}</div>
          <div className="user-info">
            <div className="user-name">{user?.nome || 'Usuário'}</div>
            <div className="user-role">{getRoleLabel(user?.perfil)}</div>
          </div>
          <button
            className="btn-logout"
            onClick={() => { setSidebarOpen(false); handleLogout(); }}
            title="Encerrar sessão"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">
        <header className="topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="topbar-left">
            <div className="topbar-title-wrap">
              <div className="topbar-title">{topbarTitle}</div>
              <div className="title-accent-line" />
            </div>
            {topbarSubtitle && <div className="topbar-subtitle">{topbarSubtitle}</div>}
          </div>
          <div className="topbar-right">
            {topbarActions}
            <span className={`role-tag role-tag--${perfil}`}>{getRoleLabel(perfil)}</span>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
}
