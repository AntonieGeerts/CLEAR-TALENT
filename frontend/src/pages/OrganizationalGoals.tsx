import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Sparkles, Loader, Zap, Trash2 } from 'lucide-react';
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
  parent?: {
    id: string;
    title: string;
  };
  creator?: {
    firstName: string;
    lastName: string;
  };
  _count?: {
    children: number;
  };
}

type GoalLevel = 'ORGANIZATIONAL' | 'DEPARTMENTAL' | 'TEAM' | 'INDIVIDUAL';

interface GoalsByLevel {
  organizational: OrganizationalGoal[];
  departmental: OrganizationalGoal[];
  team: OrganizationalGoal[];
  individual: OrganizationalGoal[];
  counts: {
    organizational: number;
    departmental: number;
    team: number;
    individual: number;
    total: number;
  };
}

export const OrganizationalGoals: React.FC = () => {
  const [goalsByLevel, setGoalsByLevel] = useState<GoalsByLevel>({
    organizational: [],
    departmental: [],
    team: [],
    individual: [],
    counts: { organizational: 0, departmental: 0, team: 0, individual: 0, total: 0 }
  });
  const [activeTab, setActiveTab] = useState<GoalLevel>('ORGANIZATIONAL');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<OrganizationalGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<OrganizationalGoal | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrganizationalGoalsByLevel();
      setGoalsByLevel(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllGoals = async () => {
    const totalGoals = goalsByLevel.counts.total;
    const confirmed = window.confirm(
      `Are you sure you want to delete ALL organizational goals?\n\n` +
      `This will permanently delete ${totalGoals} goal${totalGoals !== 1 ? 's' : ''} and all their children.\n\n` +
      `This action cannot be undone!`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await apiService.deleteAllOrganizationalGoals();
      await loadGoals();
      alert('All organizational goals have been deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete goals:', error);
      alert(error.response?.data?.error || 'Failed to delete goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get goals for the active tab
  const activeGoals = goalsByLevel[activeTab.toLowerCase() as keyof Omit<GoalsByLevel, 'counts'>] as OrganizationalGoal[];

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
        <div className="flex items-center gap-3">
          {goalsByLevel.counts.total > 0 && (
            <button
              onClick={handleDeleteAllGoals}
              className="btn btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-300"
              title="Delete all goals"
            >
              <Trash2 size={18} />
              Delete All Goals
            </button>
          )}
          <button
            onClick={() => setShowAIModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Sparkles size={20} />
            Generate with AI
          </button>
          <button
            onClick={() => {
              setSelectedParent(null);
              setShowCreateModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Goal
          </button>
        </div>
      </div>

      {/* Goal Hierarchy with Tabs */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Goal Hierarchy</h2>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('ORGANIZATIONAL')}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === 'ORGANIZATIONAL'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Organizational
              {goalsByLevel.counts.organizational > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {goalsByLevel.counts.organizational}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('DEPARTMENTAL')}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === 'DEPARTMENTAL'
                  ? 'text-gray-600 border-b-2 border-gray-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Departmental
              {goalsByLevel.counts.departmental > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {goalsByLevel.counts.departmental}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('TEAM')}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === 'TEAM'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Team
              {goalsByLevel.counts.team > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                  {goalsByLevel.counts.team}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('INDIVIDUAL')}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === 'INDIVIDUAL'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Individual
              {goalsByLevel.counts.individual > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                  {goalsByLevel.counts.individual}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {goalsByLevel.counts.total === 0 ? (
          <div className="text-center py-12">
            <Target className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first organizational goal manually or use AI to generate strategic goals with Balanced Scorecard</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowAIModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Sparkles size={20} />
                Generate with AI
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-secondary"
              >
                Create Manually
              </button>
            </div>
          </div>
        ) : activeGoals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab.toLowerCase()} goals yet</h3>
            <p className="text-gray-600 mb-4">Create {activeTab.toLowerCase()} goals to support your organizational objectives</p>
            <button
              onClick={() => {
                setSelectedParent(null);
                setShowCreateModal(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Goal
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddChild={(parent) => {
                  setSelectedParent(parent);
                  setShowCreateModal(true);
                }}
                onEdit={(goal) => {
                  setSelectedGoal(goal);
                  setShowEditModal(true);
                }}
                onGenerateKPIs={(goal) => {
                  setSelectedGoal(goal);
                  setShowKPIModal(true);
                }}
                onRefresh={loadGoals}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
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

      {/* Edit Modal */}
      {showEditModal && selectedGoal && (
        <EditGoalModal
          goal={selectedGoal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedGoal(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedGoal(null);
            loadGoals();
          }}
        />
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <AIGenerationModal
          onClose={() => setShowAIModal(false)}
          onSuccess={() => {
            setShowAIModal(false);
            loadGoals();
          }}
        />
      )}

      {/* KPI Generation Modal */}
      {showKPIModal && selectedGoal && (
        <KPIGenerationModal
          goal={selectedGoal}
          onClose={() => {
            setShowKPIModal(false);
            setSelectedGoal(null);
          }}
          onSuccess={() => {
            setShowKPIModal(false);
            setSelectedGoal(null);
            loadGoals();
          }}
        />
      )}
    </div>
  );
};

interface GoalCardProps {
  goal: OrganizationalGoal;
  onAddChild: (goal: OrganizationalGoal) => void;
  onEdit: (goal: OrganizationalGoal) => void;
  onGenerateKPIs: (goal: OrganizationalGoal) => void;
  onRefresh: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onAddChild, onEdit, onGenerateKPIs, onRefresh }) => {
  const levelColors = {
    ORGANIZATIONAL: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    DEPARTMENTAL: 'bg-gray-50 border-gray-200 hover:border-gray-300',
    TEAM: 'bg-green-50 border-green-200 hover:border-green-300',
    INDIVIDUAL: 'bg-purple-50 border-purple-200 hover:border-purple-300',
  };

  const levelBadgeColors = {
    ORGANIZATIONAL: 'bg-blue-100 text-blue-700',
    DEPARTMENTAL: 'bg-gray-100 text-gray-700',
    TEAM: 'bg-green-100 text-green-700',
    INDIVIDUAL: 'bg-purple-100 text-purple-700',
  };

  const levelColor = levelColors[goal.level];
  const levelBadgeColor = levelBadgeColors[goal.level];

  return (
    <div className={`border rounded-lg p-4 ${levelColor} hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Target size={20} className="mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg text-gray-900">{goal.title}</h3>
              <span className={`text-xs px-2 py-1 rounded ${levelBadgeColor}`}>
                {goal.level}
              </span>
              {goal.weight && (
                <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded">
                  Weight: {goal.weight}%
                </span>
              )}
              {goal.status && (
                <span className={`text-xs px-2 py-1 rounded ${
                  goal.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  goal.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {goal.status}
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              {goal.creator && (
                <span>Created by: {goal.creator.firstName} {goal.creator.lastName}</span>
              )}
              {goal.targetDate && (
                <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
              )}
              {goal.department && <span>Dept: {goal.department}</span>}
              {goal.parent && (
                <span className="text-blue-600">Parent: {goal.parent.title}</span>
              )}
              {goal._count && goal._count.children > 0 && (
                <span className="text-green-600">{goal._count.children} child goal{goal._count.children !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <button
            onClick={() => onGenerateKPIs(goal)}
            className="p-2 hover:bg-white rounded transition-colors"
            title="Generate KPIs with AI"
          >
            <Zap size={18} className="text-yellow-600" />
          </button>
          <button
            onClick={() => onAddChild(goal)}
            className="p-2 hover:bg-white rounded transition-colors"
            title="Add child goal"
          >
            <Plus size={18} className="text-green-600" />
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="p-2 hover:bg-white rounded transition-colors"
            title="Edit goal"
          >
            <Edit2 size={18} className="text-blue-600" />
          </button>
        </div>
      </div>
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

// Edit Goal Modal Component
interface EditGoalModalProps {
  goal: OrganizationalGoal;
  onClose: () => void;
  onSuccess: () => void;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: goal.title || '',
    description: goal.description || '',
    department: goal.department || '',
    weight: goal.weight || 100,
    targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
    status: goal.status || 'DRAFT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.updateOrganizationalGoal(goal.id, {
        ...formData,
        weight: formData.weight || undefined,
        targetDate: formData.targetDate || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Goal</h2>

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
              <label className="label">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
                placeholder="e.g., Engineering"
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Weight (%)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// AI Generation Modal Component
interface AIGenerationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AIGenerationModal: React.FC<AIGenerationModalProps> = ({ onClose, onSuccess }) => {
  const [organizationName, setOrganizationName] = useState('');
  const [industry, setIndustry] = useState('');
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedGoals, setGeneratedGoals] = useState<any[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<boolean[]>([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'review'>('input');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiService.generateStrategicGoalsAI({
        organizationName,
        industry,
        organizationDescription,
      });

      const goals = result.goals || [];
      setGeneratedGoals(goals);
      // Initialize all goals as selected by default
      setSelectedGoals(new Array(goals.length).fill(true));
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoals = async () => {
    setLoading(true);
    setError('');

    try {
      // Filter to only include selected goals
      const goalsToCreate = generatedGoals.filter((_, index) => selectedGoals[index]);

      if (goalsToCreate.length === 0) {
        setError('Please select at least one goal to create.');
        setLoading(false);
        return;
      }

      await apiService.createGoalsFromAI({ goals: goalsToCreate });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoalSelection = (index: number) => {
    const newSelected = [...selectedGoals];
    newSelected[index] = !newSelected[index];
    setSelectedGoals(newSelected);
  };

  const toggleAllGoals = () => {
    const allSelected = selectedGoals.every(selected => selected);
    setSelectedGoals(new Array(generatedGoals.length).fill(!allSelected));
  };

  const selectedCount = selectedGoals.filter(selected => selected).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Sparkles className="text-primary-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 'input' ? 'Generate Strategic Goals with AI' : 'Review Generated Goals'}
                </h2>
                <p className="text-sm text-gray-600">
                  {step === 'input' 
                    ? 'Create strategic goals with Balanced Scorecard and KPIs' 
                    : `${generatedGoals.length} goals generated with KPIs`}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {step === 'input' ? (
            /* Input Step */
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="label">Organization Name *</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="input"
                  placeholder="e.g., Clear Store"
                  required
                />
              </div>

              <div>
                <label className="label">Industry *</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="input"
                  placeholder="e.g., Restaurant & Hospitality"
                  required
                />
              </div>

              <div>
                <label className="label">Organization Description *</label>
                <textarea
                  value={organizationDescription}
                  onChange={(e) => setOrganizationDescription(e.target.value)}
                  className="input"
                  rows={6}
                  placeholder="Describe your organization, its mission, key challenges, and strategic priorities. For example: 'Clear Store is a retail organization focusing on quality products and customer service. We operate 5 locations across the city and aim to expand while maintaining quality and customer satisfaction...'"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide detailed context for better AI-generated goals
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">What will be generated:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 3-5 Strategic Goals across Balanced Scorecard perspectives</li>
                  <li>• Financial, Customer, Internal Process, and Learning & Growth goals</li>
                  <li>• KPIs for each goal with targets and measurement frequency</li>
                  <li>• Target dates and importance weights</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  className="btn btn-primary flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Goals
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Review Step */
            <div className="space-y-4">
              {/* Select All / Deselect All */}
              <div className="flex items-center justify-between pb-3 border-b">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCount === generatedGoals.length}
                    onChange={toggleAllGoals}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedCount === generatedGoals.length ? 'Deselect All' : 'Select All'}
                  </span>
                </label>
                <span className="text-sm text-gray-600">
                  {selectedCount} of {generatedGoals.length} goal{generatedGoals.length !== 1 ? 's' : ''} selected
                </span>
              </div>

              <div className="grid gap-4">
                {generatedGoals.map((goal, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedGoals[index]
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedGoals[index]}
                        onChange={() => toggleGoalSelection(index)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{goal.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          </div>
                          <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                            {goal.bscPerspective?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-8">
                      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                        {goal.department && (
                          <div>
                            <span className="text-gray-500">Department:</span>
                            <span className="ml-1 font-medium">{goal.department}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Weight:</span>
                          <span className="ml-1 font-medium">{goal.weight}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Target Date:</span>
                          <span className="ml-1 font-medium">
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* KPIs */}
                      {goal.kpis && goal.kpis.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Performance Indicators:</h4>
                          <div className="space-y-2">
                            {goal.kpis.map((kpi: any, kpiIndex: number) => (
                              <div key={kpiIndex} className="flex items-start text-sm">
                                <span className="text-primary-600 mr-2">•</span>
                                <div className="flex-1">
                                  <span className="font-medium">{kpi.name}:</span>
                                  <span className="ml-1 text-gray-600">{kpi.description}</span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Target: <span className="font-medium">{kpi.target}{kpi.unit}</span> |
                                    Measured: <span className="font-medium">{kpi.frequency}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setGeneratedGoals([]);
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Back to Edit
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGoals}
                    className="btn btn-primary"
                    disabled={loading || selectedCount === 0}
                  >
                    {loading ? 'Creating...' : `Create ${selectedCount} Goal${selectedCount !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// KPI Generation Modal Component
interface KPIGenerationModalProps {
  goal: OrganizationalGoal;
  onClose: () => void;
  onSuccess: () => void;
}

const KPIGenerationModal: React.FC<KPIGenerationModalProps> = ({ goal, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [generatedKPIs, setGeneratedKPIs] = useState<any[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<boolean[]>([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'generate' | 'review'>('generate');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiService.generateKPIsForGoal({
        goalId: goal.id,
        goalTitle: goal.title,
        goalDescription: goal.description || '',
        additionalContext,
      });

      const kpis = result.kpis || [];
      setGeneratedKPIs(kpis);
      setSelectedKPIs(new Array(kpis.length).fill(true));
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate KPIs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKPIs = async () => {
    setLoading(true);
    setError('');

    try {
      const kpisToSave = generatedKPIs.filter((_, index) => selectedKPIs[index]);

      if (kpisToSave.length === 0) {
        setError('Please select at least one KPI to save.');
        setLoading(false);
        return;
      }

      await apiService.updateGoalKPIs(goal.id, { kpis: kpisToSave });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save KPIs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleKPISelection = (index: number) => {
    const newSelected = [...selectedKPIs];
    newSelected[index] = !newSelected[index];
    setSelectedKPIs(newSelected);
  };

  const toggleAllKPIs = () => {
    const allSelected = selectedKPIs.every(selected => selected);
    setSelectedKPIs(new Array(generatedKPIs.length).fill(!allSelected));
  };

  const selectedCount = selectedKPIs.filter(selected => selected).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Zap className="text-yellow-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 'generate' ? 'Generate KPIs with AI' : 'Review Generated KPIs'}
                </h2>
                <p className="text-sm text-gray-600">
                  {step === 'generate' ? `For goal: ${goal.title}` : `${generatedKPIs.length} KPIs generated`}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {step === 'generate' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Goal Details:</h3>
                <p className="text-sm text-blue-800"><strong>Title:</strong> {goal.title}</p>
                {goal.description && <p className="text-sm text-blue-800 mt-1"><strong>Description:</strong> {goal.description}</p>}
                {goal.department && <p className="text-sm text-blue-800 mt-1"><strong>Department:</strong> {goal.department}</p>}
              </div>

              <div>
                <label className="label">Additional Context (Optional)</label>
                <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} className="input" rows={4} placeholder="Provide any additional context that will help generate relevant KPIs. For example: current performance metrics, industry benchmarks, specific constraints, etc." />
                <p className="text-xs text-gray-500 mt-1">More context leads to better KPI suggestions</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">What will be generated:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 3-6 Key Performance Indicators specific to this goal</li>
                  <li>• Target values and units of measurement</li>
                  <li>• Measurement frequency (monthly, quarterly, annually)</li>
                  <li>• Clear descriptions of what each KPI measures</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={loading}>
                  {loading ? <><Loader className="animate-spin" size={16} />Generating...</> : <><Zap size={16} />Generate KPIs</>}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedCount === generatedKPIs.length} onChange={toggleAllKPIs} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700">{selectedCount === generatedKPIs.length ? 'Deselect All' : 'Select All'}</span>
                </label>
                <span className="text-sm text-gray-600">{selectedCount} of {generatedKPIs.length} KPI{generatedKPIs.length !== 1 ? 's' : ''} selected</span>
              </div>

              <div className="space-y-3">
                {generatedKPIs.map((kpi, index) => (
                  <div key={index} className={`border rounded-lg p-4 transition-all ${selectedKPIs[index] ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white opacity-60'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selectedKPIs[index]} onChange={() => toggleKPISelection(index)} className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 mt-1 cursor-pointer" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{kpi.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span><strong>Target:</strong> {kpi.target}{kpi.unit}</span>
                          <span><strong>Measured:</strong> {kpi.frequency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setStep('generate'); setGeneratedKPIs([]); }} className="btn btn-secondary" disabled={loading}>Back to Edit</button>
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
                  <button type="button" onClick={handleSaveKPIs} className="btn btn-primary" disabled={loading || selectedCount === 0}>
                    {loading ? 'Saving...' : `Save ${selectedCount} KPI${selectedCount !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
