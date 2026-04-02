import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineBookOpen,
  HiOutlineQrcode,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/admin',       icon: HiOutlineViewGrid,       label: 'Dashboard',       end: true },
  { to: '/admin/menu',  icon: HiOutlineBookOpen,       label: 'Menu Management', end: false },
  { to: '/admin/tables',icon: HiOutlineQrcode,         label: 'Table Management',end: false },
  { to: '/admin/orders',icon: HiOutlineClipboardList,  label: 'Active Orders',   end: false },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-icon">🍽</span>
            <span className="sidebar-brand-text">UNO</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <HiOutlineX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="sidebar-link-icon" />
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Admin</span>
              <span className="sidebar-user-email">{user?.email || 'admin'}</span>
            </div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            id="logout-btn"
            title="Sign out"
          >
            <HiOutlineLogout />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <HiOutlineMenu />
          </button>
          <div className="topbar-spacer" />
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
