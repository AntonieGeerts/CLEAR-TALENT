import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Target, Sparkles, Plus, Edit, Trash2, Loader, Users } from 'lucide-react';
import { KPI } from '../types';
import { KPIList } from '../components/KPIList';

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
  metadata?: {
    kpis?: KPI[];
    [key: string]: any;
  };
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
          {goals.map((goal) => {
            const kpis = Array.isArray(goal.metadata?.kpis)
              ? (goal.metadata!.kpis as KPI[])
              : [];

            return (
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
                              <span className="text-xs text-gray-600">{kr.progress}%
