import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StaffDashboard } from './StaffDashboard';
import { apiService } from '../services/api';
import {
  BookOpen,
  Briefcase,
  Target,
  TrendingUp,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const ADMIN_ROLES = [
  'ADMIN',
  'SYSTEM_ADMIN',
  'TENANT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'MANAGER',
  'LINE_MANAGER',
];

const quickActions = [
  {
    title: 'Competency Library',
    description: 'Manage and create competencies with AI assistance',
    icon: BookOpen,
    link: '/competencies',
    color: 'bg-blue-500',
  },
  {
    title: 'Role Profiles',
    description: 'Define roles and required competencies',
    icon: Briefcase,
    link: '/roles',
    color: 'bg-purple-500',
  },
  {
    title: 'AI Goal Suggestions',
    description: 'Generate SMART goals and OKRs',
    icon: Target,
    link: '/goals',
    color: 'bg-green-500',
  },
  {
    title: 'Skill Gap Analysis',
    description: 'Identify development opportunities',
    icon: TrendingUp,
    link: '/skill-gaps',
    color: 'bg-orange-500',
  },
  {
    title: 'Development Plans',
    description: 'Create AI-powered IDPs',
    icon: GraduationCap,
    link: '/idps',
    color: 'bg-pink-500',
  },
];

interface DashboardStats {
  competencies: number;
  roleProfiles: number;
  goals: number;
  idps: number;
}

const AdminDashboardContent: React.FC = () => {
  const { user, tenant } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    competencies: 0,
    roleProfiles: 0,
    goals: 0,
    idps: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [competenciesRes, roleProfilesRes, goalsRes, idpsRes] = await Promise.all([
        apiService.getCompetencies().catch(() => ({ data: [] })),
        apiService.getRoleProfiles().catch(() => ({ data: [] })),
        apiService.getGoals().catch(() => ({ data: [] })),
        apiService.getIDPs().catch(() => ({ data: [] })),
      ]);

      setStats({
        competencies: competenciesRes.data?.length || 0,
        roleProfiles: roleProfilesRes.data?.length || 0,
        goals: goalsRes.data?.length || 0,
        idps: idpsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-2">
              {tenant?.name} - Performance Management Dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg">
            <Sparkles size={20} />
            <span className="font-medium">AI-Powered</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Competencies</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.competencies}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Role Profiles</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.roleProfiles}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Goals</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.goals}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active IDPs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.idps}
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-pink-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.link}
                to={action.link}
                className="card hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center text-sm text-primary-600 font-medium group-hover:text-primary-700">
                      <span>Get started</span>
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">AI-Powered Features</h3>
            <p className="text-primary-100 mb-4">
              Leverage artificial intelligence to streamline performance management, skill development,
              and career planning across your organization.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>Auto-suggest competencies from job descriptions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>Generate personalized goals and OKRs</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>Identify skill gaps and recommend development paths</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>Create comprehensive Individual Development Plans</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const roleKey = (user?.role || '').toUpperCase();
  const isAdmin = ADMIN_ROLES.includes(roleKey);
  const searchParams = new URLSearchParams(location.search);
  const isStaffView = !isAdmin || searchParams.get('view') === 'staff';

  if (isStaffView) {
    return <StaffDashboard isPreview={isAdmin} />;
  }

  return <AdminDashboardContent />;
};
