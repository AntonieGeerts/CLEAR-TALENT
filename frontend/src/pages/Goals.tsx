import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Target, Sparkles, Plus, Edit, Trash2, Loader, Users } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'GOAL' | 'OKR';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';
  progress: number;
  targetDate?: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
  };
  keyResults?: {
    id: string;
    description: string;
    progress: number;
  }[];
}

interface OrgGoalWithKPIs {
  id: string;
  title: string;
  level: 'ORGANIZATIONAL' | 'DEPARTMENTAL' | 'TEAM' | 'INDIVIDUAL';
  description?: string;
  metadata?: {
    kpis?: KPI[];
    [key: string]: any;
  };
}

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [error, setError] = useState('');
  const [orgGoalsWithKPIs, setOrgGoalsWithKPIs] = useState<OrgGoalWithKPIs[]>([]);
  const [orgKpiLoading, setOrgKpiLoading] = useState(true);
  const [orgKpiError, setOrgKpiError] = useState('');

  useEffect(() => {
    loadGoals();
    loadOrganizationalKPIs();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getGoals();
      setGoals(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizationalKPIs = async () => {
    try {
      setOrgKpiLoading(true);
      setOrgKpiError('');
      const response = await apiService.getOrganizationalGoalsByLevel();
      const { organizational = [], departmental = [], team = [], individual = [] } = response || {};
      const flattened: OrgGoalWithKPIs[] = [...organizational, ...departmental, ...team, ...individual]
        .filter((goal: any) => Array.isArray(goal?.metadata?.kpis) && goal.metadata.kpis.length > 0)
        .map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          level: goal.level,
          description: goal.description,
          metadata: goal.metadata,
        }));
      setOrgGoalsWithKPIs(flattened);
    } catch (err: any) {
      console.error('Failed to load organizational KPIs:', err);
      setOrgKpiError(err.response?.data?.error || 'Unable to load organizational KPIs');
    } finally {
      setOrgKpiLoading(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await apiService.deleteGoal(id);
      loadGoals();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete goal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'AT_RISK': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals & OKRs</h1>
          <p className="text-gray-600 mt-1">Manage and generate employee goals</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Sparkles size={20} />
            <span>AI Generate</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-primary-600" size={32} />
        </div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-12">
          <Target className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-600 mb-6">
            Use AI to generate personalized SMART goals and OKRs for employees based on their role.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="btn btn-secondary inline-flex items-center space-x-2"
            >
              <Sparkles size={20} />
              <span>AI Generate</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                    {goal.type === 'OKR' && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        OKR
                      </span>
                    )}
                  </div>
                  {goal.employee && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <Users size={14} className="mr-1" />
                      {goal.employee.firstName} {goal.employee.lastName}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Edit goal"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                    title="Delete goal"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {goal.description && (
                <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>

              {goal.keyResults && goal.keyResults.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Results</h4>
                  <div className="space-y-3">
                    {goal.keyResults.map((kr) => (
                      <div key={kr.id} className="flex items-start space-x-3">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{kr.description}</p>
                          <div className="mt-1 flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${kr.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{kr.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {goal.targetDate && (
                <div className="text-xs text-gray-500 mt-4">
                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organizational KPIs</h2>
            <p className="text-gray-600 text-sm">
              View the measurable KPIs generated for top-level goals across the organization.
            </p>
          </div>
        </div>

        {orgKpiLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader className="animate-spin text-primary-600" size={28} />
          </div>
        ) : orgKpiError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {orgKpiError}
          </div>
        ) : orgGoalsWithKPIs.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">
              No KPIs available yet. Generate KPIs from the Organizational Goals workspace to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orgGoalsWithKPIs.map((goal) => (
              <div key={goal.id} className="card border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {goal.level}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    KPIs
                  </span>
                </div>
                <KPIList kpis={(goal.metadata?.kpis || []) as KPI[]} maxCollapsed={2} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <GoalModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGoals();
          }}
        />
      )}

      {showEditModal && selectedGoal && (
        <GoalModal
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

      {showAIModal && (
        <AIGenerateGoalsModal
          onClose={() => setShowAIModal(false)}
          onSuccess={() => {
            setShowAIModal(false);
            loadGoals();
          }}
        />
      )}
    </div>
  );
};

interface GoalModalProps {
  goal?: Goal;
  onClose: () => void;
  onSuccess: () => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose, onSuccess }) => {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [type, setType] = useState(goal?.type || 'GOAL');
  const [status, setStatus] = useState(goal?.status || 'NOT_STARTED');
  const [progress, setProgress] = useState(goal?.progress || 0);
  const [targetDate, setTargetDate] = useState(goal?.targetDate?.split('T')[0] || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = {
        title,
        description: description || undefined,
        type,
        status,
        progress,
        targetDate: targetDate || undefined,
      };

      if (goal) {
        await apiService.updateGoal(goal.id, data);
      } else {
        await apiService.createGoal(data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${goal ? 'update' : 'create'} goal`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {goal ? 'Edit' : 'Create'} Goal
        </h2>

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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="e.g., Improve customer satisfaction scores by 20%"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Describe the goal and success criteria..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
                <option value="GOAL">Goal</option>
                <option value="OKR">OKR (Objective & Key Results)</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="input">
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="AT_RISK">At Risk</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Progress (%)</label>
              <input
                type="number"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                className="input"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="label">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (goal ? 'Saving...' : 'Creating...') : (goal ? 'Save Changes' : 'Create Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AIGenerateGoalsModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [roleContext, setRoleContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatedGoals, setGeneratedGoals] = useState<any[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiService.generateGoals({
        employeeId: 'current',
        roleContext,
      });
      setGeneratedGoals(response.data?.goals || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate goals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="text-primary-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">AI Goal Generation</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 mb-6">
          <div>
            <label className="label">Role Context</label>
            <textarea
              value={roleContext}
              onChange={(e) => setRoleContext(e.target.value)}
              className="input"
              rows={6}
              placeholder="Describe the role, current projects, and areas for goal setting..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide context about the employee's role, current projects, and development areas to generate relevant SMART goals.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Generating...
                </>
              ) : (
                'Generate Goals'
              )}
            </button>
          </div>
        </form>

        {generatedGoals.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generated Goals ({generatedGoals.length})
            </h3>
            <div className="space-y-3">
              {generatedGoals.map((goal, index) => (
                <div key={index} className="card bg-green-50 border-green-200">
                  <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                  {goal.keyResults && (
                    <div className="mt-2 ml-4">
                      <p className="text-xs font-medium text-gray-700 mb-1">Key Results:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {goal.keyResults.map((kr: string, i: number) => (
                          <li key={i}>• {kr}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={onSuccess} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
