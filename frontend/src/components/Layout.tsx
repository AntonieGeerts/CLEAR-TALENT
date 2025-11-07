import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
  Shield,
  Users,
  FileText,
} from 'lucide-react';

const getNavItems = (userRole: string | undefined) => {
  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['*'] },
  ];

  // System Admin menu
  if (userRole === 'SYSTEM_ADMIN') {
    items.push(
      { to: '/admin', icon: Building2, label: 'Tenant Management', roles: ['SYSTEM_ADMIN'] },
    );
  }

  // Organizational Admin menu
  if (userRole === 'ADMIN') {
    items.push(
      { to: '/admin/roles', icon: Shield, label: 'Roles & Permissions', roles: ['ADMIN'] },
      { to: '/admin/staff', icon: Users, label: 'Staff Management', roles: ['ADMIN'] },
      { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs', roles: ['ADMIN'] },
    );
  }

  // Common items for all authenticated users
  items.push(
    { to: '/organizational-goals', icon: FlagTriangleRight, label: 'Organizational Goals', roles: ['*'] },
    { to: '/competencies', icon: BookOpen, label: 'Competency Library', roles: ['*'] },
    { to: '/roles', icon: Briefcase, label: 'Role Profiles', roles: ['*'] },
    { to: '/goals', icon: Target, label: 'Goals & OKRs', roles: ['*'] },
    { to: '/pips', icon: AlertTriangle, label: 'PIPs', roles: ['*'] },
    { to: '/skill-gaps', icon: TrendingUp, label: 'Skill Gaps', roles: ['*'] },
    { to: '/idps', icon: GraduationCap, label: 'IDPs', roles: ['*'] },
  );

  return items;
};

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, tenant, logout } = useAuth();
  const location = useLocation();
  const navItems = getNavItems(user?.role);

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
              const isActive = location.pathname === item.to;
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
            {user?.role === 'ADMIN' && (
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
