import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Plus, Edit2, Trash2,
  Key, Shield, Building2, Clock,
  Search, Filter, Activity
} from 'lucide-react';
import { apiService } from '../services/api';

interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  position?: string;
  createdAt: string;
  lastLogin?: string;
}

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  onboardingStatus: string;
  logo?: string;
  primaryColor?: string;
  createdAt: string;
  settings: any;
  _count: {
    users: number;
    competencies: number;
    roleProfiles: number;
    reviewCycles: number;
    organizationalGoals: number;
  };
  users: TenantUser[];
}

export const TenantDetail: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('users');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    loadTenantDetails();
  }, [tenantId]);

  const loadTenantDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTenant(tenantId!);
      setTenant(data);
    } catch (error) {
      console.error('Failed to load tenant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: TenantUser) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleResetPassword = (user: TenantUser) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleDeleteUser = async (user: TenantUser) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUser(user.id);
      loadTenantDetails();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const filteredUsers = tenant?.users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tenant not found</p>
        <button onClick={() => navigate('/admin')} className="btn btn-primary mt-4">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
              {tenant.isActive ? (
                <span className="badge badge-success">Active</span>
              ) : (
                <span className="badge badge-danger">Inactive</span>
              )}
            </div>
            <p className="text-gray-600 mt-1">@{tenant.slug} • Tenant Management</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateUserModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Users</p>
              <p className="text-xl font-bold text-gray-900">{tenant._count.users}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Competencies</p>
              <p className="text-xl font-bold text-gray-900">{tenant._count.competencies}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Role Profiles</p>
              <p className="text-xl font-bold text-gray-900">{tenant._count.roleProfiles}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Review Cycles</p>
              <p className="text-xl font-bold text-gray-900">{tenant._count.reviewCycles}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Clock className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Goals</p>
              <p className="text-xl font-bold text-gray-900">{tenant._count.organizationalGoals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Users ({tenant._count.users})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Tenant Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Organization Name</label>
                <p className="text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Slug</label>
                <p className="text-gray-900">@{tenant.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-gray-900">{tenant.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Onboarding Status</label>
                <p className="text-gray-900">{tenant.onboardingStatus}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900">{new Date(tenant.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="card">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by name, email, department, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input w-48"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${
                          user.role === 'ADMIN' ? 'badge-primary' :
                          user.role === 'HR_MANAGER' ? 'badge-secondary' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                          'badge'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{user.department || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{user.position || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 hover:bg-blue-50 rounded text-blue-600"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 hover:bg-green-50 rounded text-green-600"
                            title="Reset password"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 hover:bg-red-50 rounded text-red-600"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || roleFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Add your first user to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Tenant Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">AI Features</label>
              <p className="text-gray-900">
                {tenant.settings?.ai_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Data Residency</label>
              <p className="text-gray-900">{tenant.settings?.data_residency || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Language</label>
              <p className="text-gray-900">{tenant.settings?.language || 'en'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <CreateUserModal
          tenantId={tenant.id}
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={() => {
            setShowCreateUserModal(false);
            loadTenantDetails();
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
            loadTenantDetails();
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Create User Modal Component
interface CreateUserModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ tenantId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    position: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.createUserForTenant(tenantId, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add New User</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              required
              minLength={8}
            />
            <p className="text-sm text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
                required
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
                placeholder="e.g., Engineering"
              />
            </div>
          </div>

          <div>
            <label className="label">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="input"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: TenantUser;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    department: user.department || '',
    position: user.position || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.updateUser(user.id, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit User</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
                required
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
                placeholder="e.g., Engineering"
              />
            </div>
          </div>

          <div>
            <label className="label">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="input"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reset Password Modal Component
interface ResetPasswordModalProps {
  user: TenantUser;
  onClose: () => void;
  onSuccess: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ user, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await apiService.resetUserPassword(user.id, newPassword);
      setSuccess('Password reset successfully');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>User:</strong> {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-blue-600">{user.email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              required
              minLength={8}
              disabled={loading || !!success}
            />
          </div>

          <div>
            <label className="label">Confirm Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              required
              minLength={8}
              disabled={loading || !!success}
            />
            <p className="text-sm text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              {success ? 'Close' : 'Cancel'}
            </button>
            {!success && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
