import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  ChevronRight,
  Folder,
  FolderOpen,
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive: boolean;
  parent?: Department;
  children?: Department[];
  _count?: {
    children: number;
  };
  createdAt: string;
  updatedAt: string;
}

const AdminDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDepartments({ isActive: true });
      setDepartments(response.data || []);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to load departments:', err);
        setError(err.response?.data?.message || 'Failed to load departments. Please try again.');
      } else {
        setDepartments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await apiService.createDepartment({
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        parentId: formData.parentId || undefined,
      });
      setSuccess('Department created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', code: '', description: '', parentId: '' });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    try {
      setError(null);
      await apiService.updateDepartment(selectedDepartment.id, {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        parentId: formData.parentId || undefined,
      });
      setSuccess('Department updated successfully');
      setShowEditModal(false);
      setSelectedDepartment(null);
      setFormData({ name: '', code: '', description: '', parentId: '' });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (!confirm(`Are you sure you want to delete "${department.name}"?`)) {
      return;
    }

    try {
      setError(null);
      await apiService.deleteDepartment(department.id);
      setSuccess('Department deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      code: department.code || '',
      description: department.description || '',
      parentId: department.parentId || '',
    });
    setShowEditModal(true);
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top-level departments (no parent)
  const topLevelDepartments = filteredDepartments.filter((dept) => !dept.parentId);

  // Recursive component to render department tree
  const DepartmentTree: React.FC<{ department: Department; level?: number }> = ({
    department,
    level = 0,
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const childDepartments = filteredDepartments.filter(
      (dept) => dept.parentId === department.id
    );
    const hasChildren = childDepartments.length > 0;

    return (
      <div className="border-l-2 border-gray-200">
        <div
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${level * 2 + 1}rem` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRight
                  size={16}
                  className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="text-primary-600" size={20} />
              ) : (
                <Folder className="text-gray-400" size={20} />
              )
            ) : (
              <Building2 className="text-gray-400" size={18} />
            )}

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{department.name}</h3>
                {department.code && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {department.code}
                  </span>
                )}
              </div>
              {department.description && (
                <p className="text-sm text-gray-500 mt-1">{department.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => openEditModal(department)}
              className="text-gray-400 hover:text-primary-600 p-2"
              title="Edit department"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDeleteDepartment(department)}
              className="text-gray-400 hover:text-red-600 p-2"
              title="Delete department"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {childDepartments.map((child) => (
              <DepartmentTree key={child.id} department={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">Manage organizational departments and hierarchy</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', code: '', description: '', parentId: '' });
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Department</span>
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

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Departments List */}
      {filteredDepartments.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Get started by creating your first department'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setFormData({ name: '', code: '', description: '', parentId: '' });
                    setShowCreateModal(true);
                  }}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus size={20} />
                  <span>Create Department</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="space-y-0">
            {topLevelDepartments.map((dept) => (
              <DepartmentTree key={dept.id} department={dept} />
            ))}
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create Department</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Engineering, Sales, HR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., ENG, SAL, HR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Brief description of the department..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Department
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">None (Top Level)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create Department
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Department</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Department
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">None (Top Level)</option>
                  {departments
                    .filter((dept) => dept.id !== selectedDepartment.id)
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Update Department
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
