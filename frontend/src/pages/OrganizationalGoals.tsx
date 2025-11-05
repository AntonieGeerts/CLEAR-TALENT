import React, { useState, useEffect } from 'react';
import { Target, Plus, ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';

interface OrganizationalGoal {
  id: string;
  title: string;
  description?: string;
  level: 'ORGANIZATIONAL' | 'DEPARTMENTAL' | 'TEAM' | 'INDIVIDUAL';
  department?: string;
  parentId?: string;
  weight?: number;
  targetDate?: string;
  status: string;
  children?: OrganizationalGoal[];
  creator: {
    firstName: string;
    lastName: string;
  };
  _count?: {
    children: number;
  };
}

export const OrganizationalGoals: React.FC = () => {
  const [goals, setGoals] = useState<OrganizationalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<OrganizationalGoal | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrganizationalGoalsTree();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizational Goals</h1>
          <p className="text-gray-600 mt-1">Cascading goals aligned with strategic objectives</p>
        </div>
        <button
          onClick={() => {
            setSelectedParent(null);
            setShowCreateModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Organizational Goal
        </button>
      </div>

      {/* Goal Hierarchy */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Goal Hierarchy</h2>
          <div className="flex gap-2">
            <span className="badge badge-primary">Organizational</span>
            <span className="badge badge-secondary">Departmental</span>
            <span className="badge" style={{ backgroundColor: '#10b981', color: 'white' }}>Team</span>
            <span className="badge" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>Individual</span>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first organizational goal</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <GoalTreeNode
                key={goal.id}
                goal={goal}
                onAddChild={(parent) => {
                  setSelectedParent(parent);
                  setShowCreateModal(true);
                }}
                onRefresh={loadGoals}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <GoalModal
          parentGoal={selectedParent}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedParent(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setSelectedParent(null);
            loadGoals();
          }}
        />
      )}
    </div>
  );
};

interface GoalTreeNodeProps {
  goal: OrganizationalGoal;
  level?: number;
  onAddChild: (goal: OrganizationalGoal) => void;
  onRefresh: () => void;
}

const GoalTreeNode: React.FC<GoalTreeNodeProps> = ({ goal, level = 0, onAddChild, onRefresh }) => {
  const [expanded, setExpanded] = useState(true);

  const levelColors = {
    ORGANIZATIONAL: 'bg-blue-100 text-blue-700 border-blue-200',
    DEPARTMENTAL: 'bg-gray-100 text-gray-700 border-gray-200',
    TEAM: 'bg-green-100 text-green-700 border-green-200',
    INDIVIDUAL: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const levelColor = levelColors[goal.level];

  return (
    <div className="ml-4">
      <div className={`border rounded-lg p-4 ${levelColor} hover:shadow-md transition-shadow`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {goal.children && goal.children.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 hover:bg-white hover:bg-opacity-50 rounded p-1"
              >
                {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
            <Target size={20} className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{goal.title}</h3>
                <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                  {goal.level}
                </span>
                {goal.weight && (
                  <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                    Weight: {goal.weight}%
                  </span>
                )}
              </div>
              {goal.description && (
                <p className="text-sm opacity-90 mb-2">{goal.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs opacity-75">
                <span>Created by: {goal.creator.firstName} {goal.creator.lastName}</span>
                {goal.targetDate && (
                  <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                )}
                {goal.department && <span>Dept: {goal.department}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddChild(goal)}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded"
              title="Add child goal"
            >
              <Plus size={18} />
            </button>
            <button
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded"
              title="Edit goal"
            >
              <Edit2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && goal.children && goal.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {goal.children.map((child) => (
            <GoalTreeNode
              key={child.id}
              goal={child}
              level={level + 1}
              onAddChild={onAddChild}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface GoalModalProps {
  parentGoal?: OrganizationalGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ parentGoal, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: parentGoal
      ? (parentGoal.level === 'ORGANIZATIONAL' ? 'DEPARTMENTAL' :
         parentGoal.level === 'DEPARTMENTAL' ? 'TEAM' :
         parentGoal.level === 'TEAM' ? 'INDIVIDUAL' : 'INDIVIDUAL')
      : 'ORGANIZATIONAL',
    department: '',
    weight: 100,
    targetDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.createOrganizationalGoal({
        ...formData,
        parentId: parentGoal?.id,
        weight: formData.weight || undefined,
        targetDate: formData.targetDate || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {parentGoal ? `Add Child Goal to "${parentGoal.title}"` : 'Create Organizational Goal'}
        </h2>

        {parentGoal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Parent Goal:</strong> {parentGoal.title}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Level: {parentGoal.level} → {formData.level}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Goal Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="e.g., Increase revenue by 25%"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Describe the goal and success criteria..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="input"
                disabled={!!parentGoal}
              >
                <option value="ORGANIZATIONAL">Organizational</option>
                <option value="DEPARTMENTAL">Departmental</option>
                <option value="TEAM">Team</option>
                <option value="INDIVIDUAL">Individual</option>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Weight (%)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                className="input"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="label">Target Date</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="input"
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
