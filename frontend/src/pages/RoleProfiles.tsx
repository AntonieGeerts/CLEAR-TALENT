import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Briefcase, Plus, Edit, Trash2, BookOpen } from 'lucide-react';

interface RoleProfile {
  id: string;
  title: string;
  department: string;
  seniority?: string;
  description?: string;
  _count?: {
    competencies: number;
  };
}

export const RoleProfiles: React.FC = () => {
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getRoleProfiles();
      setRoles(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load role profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (role: RoleProfile) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role profile?')) return;

    try {
      await apiService.deleteRoleProfile(id);
      loadRoles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete role profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Profiles</h1>
          <p className="text-gray-600 mt-1">Define roles and competency requirements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Role Profile</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : roles.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No role profiles yet</h3>
          <p className="text-gray-600 mb-6">
            Create role profiles to define competency requirements for each position.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create First Role Profile</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{role.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{role.department}</span>
                    {role.seniority && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{role.seniority.toLowerCase()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {role.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{role.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <BookOpen size={16} className="mr-1" />
                  {role._count?.competencies || 0} Competencies
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(role)}
                  className="flex-1 btn btn-secondary text-sm py-2"
                >
                  <Edit size={16} className="inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="btn btn-danger text-sm py-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <RoleProfileModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRoles();
          }}
        />
      )}

      {showEditModal && selectedRole && (
        <RoleProfileModal
          role={selectedRole}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRole(null);
            loadRoles();
          }}
        />
      )}
    </div>
  );
};

interface RoleProfileModalProps {
  role?: RoleProfile;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleProfileModal: React.FC<RoleProfileModalProps> = ({ role, onClose, onSuccess }) => {
  const [title, setTitle] = useState(role?.title || '');
  const [department, setDepartment] = useState(role?.department || '');
  const [seniority, setSeniority] = useState(role?.seniority || 'MID');
  const [description, setDescription] = useState(role?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (role) {
        await apiService.updateRoleProfile(role.id, {
          title,
          department,
          seniority,
          description: description || undefined,
        });
      } else {
        await apiService.createRoleProfile({
          title,
          department,
          seniority,
          description: description || undefined,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${role ? 'update' : 'create'} role profile`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {role ? 'Edit' : 'Create'} Role Profile
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department *</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input"
                placeholder="e.g., Engineering"
                required
              />
            </div>

            <div>
              <label className="label">Seniority Level</label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="input"
              >
                <option value="ENTRY">Entry Level</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid Level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={4}
              placeholder="Describe the role responsibilities and expectations..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (role ? 'Saving...' : 'Creating...') : (role ? 'Save Changes' : 'Create Role')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
