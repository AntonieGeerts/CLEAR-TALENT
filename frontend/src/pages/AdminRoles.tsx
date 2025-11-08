import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Lock,
  Users,
  Settings,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  key: string;
  description: string | null;
  isSystemDefault: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    permissions: number;
    users: number;
  };
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description: string | null;
}

export const AdminRoles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesRes, permissionsRes] = await Promise.all([
        apiService.getRoles(),
        apiService.getPermissions(),
      ]);
      // Ensure we always have arrays, even if data is undefined/null
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setPermissions(Array.isArray(permissionsRes.data) ? permissionsRes.data : []);
    } catch (err: any) {
      console.error('Error loading roles:', err);
      // Handle 404 (not found) as empty data, not an error
      if (err.response?.status === 404 || err.message?.toLowerCase().includes('not found')) {
        setRoles([]);
        setPermissions([]);
      } else {
        // Only show error for actual failures (network errors, server errors, etc.)
        setError(err.response?.data?.message || 'Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await apiService.createRole({
        name: formData.name,
        key: formData.key,
        description: formData.description,
        permissionIds: selectedPermissions,
      });
      setSuccess('Role created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', key: '', description: '' });
      setSelectedPermissions([]);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      setError(null);
      await apiService.updateRole(selectedRole.id, {
        name: formData.name,
        description: formData.description,
      });
      setSuccess('Role updated successfully');
      setShowEditModal(false);
      setSelectedRole(null);
      setFormData({ name: '', key: '', description: '' });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedRole) return;
    try {
      setError(null);
      await apiService.assignRolePermissions(selectedRole.id, selectedPermissions);
      setSuccess('Permissions updated successfully');
      setShowPermissionsModal(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permissions');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }
    try {
      setError(null);
      await apiService.deleteRole(role.id);
      setSuccess('Role deleted successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      key: role.key,
      description: role.description || '',
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = async (role: Role) => {
    try {
      setSelectedRole(role);
      const roleDetails = await apiService.getRole(role.id);
      const rolePermissionIds = roleDetails.data?.permissions?.map((p: any) => p.id) || [];
      setSelectedPermissions(rolePermissionIds);
      setShowPermissionsModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load role permissions');
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupPermissionsByResource = () => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">
            Manage roles and permissions for your organization
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', key: '', description: '' });
            setSelectedPermissions([]);
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Role</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <X size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Roles Grid */}
      {roles.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first custom role
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role.isSystemDefault
                      ? 'bg-purple-100'
                      : 'bg-blue-100'
                  }`}
                >
                  <Shield
                    className={role.isSystemDefault ? 'text-purple-600' : 'text-blue-600'}
                    size={20}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  {role.isSystemDefault && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      System
                    </span>
                  )}
                </div>
              </div>
              {!role.isSystemDefault && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(role)}
                    className="text-gray-400 hover:text-primary-600"
                    title="Edit role"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete role"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {role.description || 'No description'}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Lock size={14} />
                  <span>{role._count?.permissions || 0} permissions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={14} />
                  <span>{role._count?.users || 0} users</span>
                </div>
              </div>
              <button
                onClick={() => openPermissionsModal(role)}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
              >
                <Settings size={14} />
                <span>Permissions</span>
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Role</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Department Manager"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Key *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      key: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                    })
                  }
                  className="input"
                  placeholder="e.g., DEPT_MANAGER"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier (uppercase, underscores only)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input"
                  rows={3}
                  placeholder="Describe the role's purpose and responsibilities"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
                    <div key={resource}>
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">
                        {resource}
                      </h4>
                      <div className="space-y-2 pl-4">
                        {perms.map((perm) => (
                          <label key={perm.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">
                              {perm.action} ({perm.scope})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Role</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Key
                </label>
                <input
                  type="text"
                  value={formData.key}
                  className="input bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Role key cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Manage Permissions
                  </h2>
                  <p className="text-gray-600 mt-1">{selectedRole.name}</p>
                </div>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
                <div key={resource} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 capitalize text-lg">
                    {resource}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded border-gray-300"
                          disabled={selectedRole.isSystemDefault}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {perm.action}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({perm.scope})
                          </span>
                          {perm.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {selectedRole.isSystemDefault && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  <p className="text-sm">
                    System roles cannot be modified. Create a custom role instead.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              {!selectedRole.isSystemDefault && (
                <button onClick={handleUpdatePermissions} className="btn-primary">
                  Save Permissions
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
