import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Users,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';

interface StaffMember {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  primaryRole: {
    id: string;
    name: string;
  };
  additionalRoles: Array<{
    id: string;
    name: string;
  }>;
  status: string;
  joinedAt: string;
  metadata?: {
    position?: string;
    department?: string;
  };
}

interface Role {
  id: string;
  name: string;
  key: string;
}

export const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    additionalRoleIds: [] as string[],
    position: '',
    department: '',
  });
  const [editFormData, setEditFormData] = useState({
    primaryRoleId: '',
    additionalRoleIds: [] as string[],
    status: '',
    position: '',
    department: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter, roleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [staffRes, rolesRes] = await Promise.all([
        apiService.getStaff({
          status: statusFilter || undefined,
          role: roleFilter || undefined,
        }),
        apiService.getRoles(),
      ]);
      // Ensure we always have arrays, even if data is undefined/null
      setStaff(Array.isArray(staffRes.data) ? staffRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
    } catch (err: any) {
      console.error('Error loading staff:', err);
      // Handle 404 (not found) as empty data, not an error
      if (err.response?.status === 404 || err.message?.toLowerCase().includes('not found')) {
        setStaff([]);
        setRoles([]);
      } else {
        // Only show error for actual failures (network errors, server errors, etc.)
        setError(err.response?.data?.message || 'Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await apiService.inviteStaff({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        additionalRoleIds: formData.additionalRoleIds,
        metadata: {
          position: formData.position,
          department: formData.department,
        },
      });
      setSuccess('Staff invitation sent successfully');
      setShowInviteModal(false);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        roleId: '',
        additionalRoleIds: [],
        position: '',
        department: '',
      });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      setError(null);
      await apiService.updateStaffMembership(selectedMember.id, {
        primaryRoleId: editFormData.primaryRoleId,
        additionalRoleIds: editFormData.additionalRoleIds,
        status: editFormData.status,
        metadata: {
          position: editFormData.position,
          department: editFormData.department,
        },
      });
      setSuccess('Staff member updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member');
    }
  };

  const handleRemoveMember = async (member: StaffMember) => {
    if (
      !confirm(
        `Are you sure you want to remove ${member.user.firstName} ${member.user.lastName}?`
      )
    ) {
      return;
    }
    try {
      setError(null);
      await apiService.removeStaffMember(member.id);
      setSuccess('Staff member removed successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const openEditModal = (member: StaffMember) => {
    setSelectedMember(member);
    setEditFormData({
      primaryRoleId: member.primaryRole.id,
      additionalRoleIds: member.additionalRoles.map((r) => r.id),
      status: member.status,
      position: member.metadata?.position || '',
      department: member.metadata?.department || '',
    });
    setShowEditModal(true);
  };

  const toggleAdditionalRole = (roleId: string, isInvite = false) => {
    if (isInvite) {
      setFormData((prev) => ({
        ...prev,
        additionalRoleIds: prev.additionalRoleIds.includes(roleId)
          ? prev.additionalRoleIds.filter((id) => id !== roleId)
          : [...prev.additionalRoleIds, roleId],
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        additionalRoleIds: prev.additionalRoleIds.includes(roleId)
          ? prev.additionalRoleIds.filter((id) => id !== roleId)
          : [...prev.additionalRoleIds, roleId],
      }));
    }
  };

  const filteredStaff = staff.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.user.firstName.toLowerCase().includes(searchLower) ||
      member.user.lastName.toLowerCase().includes(searchLower) ||
      member.user.email.toLowerCase().includes(searchLower) ||
      member.metadata?.position?.toLowerCase().includes(searchLower) ||
      member.metadata?.department?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle size={16} />;
      case 'SUSPENDED':
        return <XCircle size={16} />;
      case 'PENDING':
        return <Clock size={16} />;
      default:
        return null;
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage team members and access control
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              email: '',
              firstName: '',
              lastName: '',
              roleId: '',
              additionalRoleIds: [],
              position: '',
              department: '',
            });
            setShowInviteModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlus size={20} />
          <span>Invite Staff</span>
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

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Primary Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.user.firstName} {member.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{member.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.metadata?.position || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.metadata?.department || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.primaryRole.name}
                    </div>
                    {member.additionalRoles.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{member.additionalRoles.length} additional
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        member.status
                      )}`}
                    >
                      {getStatusIcon(member.status)}
                      <span>{member.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(member)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter || roleFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by inviting your first staff member'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Invite Staff Member</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleInviteStaff} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Role *
                </label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Additional Roles (Optional)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                  {roles
                    .filter((role) => role.id !== formData.roleId)
                    .map((role) => (
                      <label key={role.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.additionalRoleIds.includes(role.id)}
                          onChange={() => toggleAdditionalRole(role.id, true)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{role.name}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="input"
                    placeholder="e.g., Senior Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input"
                    placeholder="e.g., Engineering"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center space-x-2">
                  <Send size={18} />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Staff Member</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedMember.user.firstName} {selectedMember.user.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateMember} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Role *
                </label>
                <select
                  value={editFormData.primaryRoleId}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, primaryRoleId: e.target.value })
                  }
                  className="input"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Additional Roles
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                  {roles
                    .filter((role) => role.id !== editFormData.primaryRoleId)
                    .map((role) => (
                      <label key={role.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editFormData.additionalRoleIds.includes(role.id)}
                          onChange={() => toggleAdditionalRole(role.id, false)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{role.name}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="input"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={editFormData.position}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, position: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, department: e.target.value })
                    }
                    className="input"
                  />
                </div>
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
    </div>
  );
};
