import React, { useState, useMemo } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { Footer } from './Footer';
import { AdminMenu } from './AdminMenu';
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Target,
  TrendingUp,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Building2,
  AlertTriangle,
  FlagTriangleRight,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  match?: (pathname: string, search: string) => boolean;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/organizational-goals', icon: FlagTriangleRight, label: 'Organizational Goals' },
  { to: '/competencies', icon: BookOpen, label: 'Competency Library' },
  { to: '/roles', icon: Briefcase, label: 'Role Profiles' },
  { to: '/goals', icon: Target, label: 'Goals & OKRs' },
  { to: '/pips', icon: AlertTriangle, label: 'PIPs' },
  { to: '/skill-gaps', icon: TrendingUp, label: 'Skill Gaps' },
  { to: '/idps', icon: GraduationCap, label: 'IDPs' },
];

const STAFF_NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard?view=staff',
    icon: LayoutDashboard,
    label: 'My Dashboard',
    match: (pathname: string, search: string) =>
      pathname === '/dashboard' && new URLSearchParams(search).get('view') === 'staff',
  },
  { to: '/goals', icon: Target, label: 'My Goals' },
  { to: '/idps', icon: GraduationCap, label: 'Development Plan' },
  { to: '/competencies', icon: BookOpen, label: 'Competency Library' },
];

const ADMIN_ROLES = new Set([
  'ADMIN',
  'SYSTEM_ADMIN',
  'TENANT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPARTMENT_HEAD',
  'MANAGER',
]);

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, tenant, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRole = ADMIN_ROLES.has((user?.role || '').toUpperCase());
  const isStaffView = useMemo(() => {
    if (!isAdminRole) return true;
    const params = new URLSearchParams(location.search);
    return params.get('view') === 'staff';
  }, [isAdminRole, location.search]);

  const adminNavItems = useMemo(() => {
    const base = [...ADMIN_NAV_ITEMS];
    if (user?.role === 'SYSTEM_ADMIN') {
      base.splice(1, 0, { to: '/admin', icon: Building2, label: 'Tenant Management' });
    }
    return base;
  }, [user?.role]);

  const navItems = isStaffView ? STAFF_NAV_ITEMS : adminNavItems;

  const handleViewToggle = () => {
    if (!isAdminRole) return;
    if (isStaffView) {
      navigate({ pathname: '/dashboard', search: '' });
    } else {
      navigate({ pathname: '/dashboard', search: '?view=staff' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Logo size="md" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match
                ? item.match(location.pathname, location.search)
                : location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Organizational Admin Menu */}
            {isAdminRole && !isStaffView && (
              <AdminMenu onNavigate={() => setSidebarOpen(false)} />
            )}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500">{tenant?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            {isAdminRole && (
              <button
                onClick={handleViewToggle}
                className={`hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border transition ${
                  isStaffView
                    ? 'border-primary-600 text-primary-700 bg-primary-50 hover:bg-primary-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isStaffView ? 'Exit Staff View' : 'Switch to Staff View'}
              </button>
            )}
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
