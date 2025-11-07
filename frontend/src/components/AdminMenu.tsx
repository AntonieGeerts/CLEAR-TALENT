import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Shield, Users, FileText, Settings } from 'lucide-react';

interface AdminMenuProps {
  onNavigate?: () => void;
}

export const AdminMenu: React.FC<AdminMenuProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin/');

  const adminSubItems = [
    { to: '/admin/roles', icon: Shield, label: 'Roles & Permissions' },
    { to: '/admin/staff', icon: Users, label: 'Staff Management' },
    { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div>
      {/* Main Admin Menu Item */}
      <button
        onClick={handleToggle}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
          isAdminRoute
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Settings size={20} />
          <span>Administration</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Submenu Items */}
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {adminSubItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleNavigate}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
