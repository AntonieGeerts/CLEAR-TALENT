import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Target, CheckCircle2, Calendar, Loader2, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { GoalStats, GoalSummary } from '../../types/staff';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatDate = (value?: string | null, fallback = 'No date') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : dateFormatter.format(date);
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return 'No due date';
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 'No due date';
  const diffDays = Math.round((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays > 1) return `Due in ${diffDays} days`;
  return `Overdue by ${Math.abs(diffDays)} days`;
};

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export const MyGoals: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const staffQuery = new URLSearchParams(location.search).get('view') === 'staff' ? '?view=staff' : '';
  const staffPath = (path: string) => `${path}${staffQuery}`;

  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);

  const loadGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalRes, statsRes] = await Promise.all([apiService.getGoals(), apiService.getGoalStats()]);
      setGoals(Array.isArray(goalRes.data) ? goalRes.data : []);
      setGoalStats(statsRes.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load your goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const updateGoal = async (goalId: string, payload: Partial<GoalSummary>) => {
    try {
      setUpdatingGoalId(goalId);
      await apiService.updateGoal(goalId, payload);
      await loadGoals();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to update goal');
    } finally {
      setUpdatingGoalId(null);
    }
  };

  const incrementProgress = (goal: GoalSummary, delta: number) => {
    const nextProgress = Math.max(0, Math.min(100, (goal.progress ?? 0) + delta));
    const nextStatus = nextProgress === 100 ? 'COMPLETED' : goal.status;
    updateGoal(goal.id, { progress: nextProgress, status: nextStatus });
  };

  const markCompleted = (goalId: string) => {
    updateGoal(goalId, { status: 'COMPLETED', progress: 100 });
  };

  const completionRate = useMemo(() => {
    if (!goalStats || !goalStats.total) return 0;
    const completed = goalStats.byStatus?.COMPLETED || goalStats.byStatus?.completed || 0;
    return Math.round((completed / goalStats.total) * 100);
  }, [goalStats]);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'ACTIVE' || goal.status === 'DRAFT'),
    [goals]
  );
  const completedGoals = useMemo(() => goals.filter((goal) => goal.status === 'COMPLETED'), [goals]);

  const headline = useMemo(() => {
    if (user?.firstName) return `${user.firstName}'s goals`;
    if (user?.name) return `${user.name.split(' ')[0]}'s goals`;
    return 'My goals';
  }, [user?.firstName, user?.name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Personal goal center</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{headline}</h1>
            <p className="text-gray-600 mt-2">
              Track progress on the commitments assigned to you. Update your goals frequently so your manager stays in the loop.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Goals completed</p>
              <p className="text-2xl font-bold text-primary-600">{completionRate}%</p>
            </div>
            <div>
              <Link to={staffPath('/me/development-plan')} className="btn btn-primary flex items-center space-x-2">
                <Target size={18} />
                <span>Align with plan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="text-sm underline" onClick={loadGoals}>
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total goals</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{goalStats?.total ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">{activeGoals.length} in progress</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">On track</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">
            {goalStats?.byStatus?.ACTIVE ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Active goals</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{completedGoals.length}</p>
          <p className="text-sm text-gray-500 mt-1">Keep the momentum going</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">In flight</p>
              <h2 className="text-xl font-semibold text-gray-900">Active goals</h2>
            </div>
          </div>
          {activeGoals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No active goals yet. Reach out to your manager to align on priorities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{goal.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      <div className="flex items-center space-x-3 mt-3 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[goal.status] || 'bg-gray-100 text-gray-600'}`}>
                          {goal.status.toLowerCase()}
                        </span>
                        <span>{formatDate(goal.targetDate)}</span>
                        <span>{formatRelativeTime(goal.targetDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Progress</p>
                      <p className="text-2xl font-semibold text-primary-600">{Math.round(goal.progress ?? 0)}%</p>
                    </div>
                  </div>
                  <div className="mt-4 space-x-2">
                    <button
                      onClick={() => incrementProgress(goal, 10)}
                      disabled={updatingGoalId === goal.id}
                      className="btn btn-secondary text-sm"
                    >
                      {updatingGoalId === goal.id ? 'Updating...' : '+10% progress'}
                    </button>
                    <button
                      onClick={() => markCompleted(goal.id)}
                      disabled={updatingGoalId === goal.id || goal.status === 'COMPLETED'}
                      className="btn btn-primary text-sm"
                    >
                      {goal.status === 'COMPLETED' ? 'Completed' : 'Mark complete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-6">
          <div>
            <p className="text-sm text-gray-500">Quick actions</p>
            <h3 className="text-lg font-semibold text-gray-900">Stay aligned</h3>
            <p className="text-sm text-gray-600 mt-1">
              Use these shortcuts to review dependencies and keep your plan fresh.
            </p>
          </div>
          <div className="space-y-4">
            <Link to={staffPath('/me/development-plan')} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:border-primary-200">
              <div>
                <p className="text-sm text-gray-500">Development plan</p>
                <p className="font-semibold text-gray-900">Review supporting actions</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
            <Link to={staffPath('/me/competencies')} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:border-primary-200">
              <div>
                <p className="text-sm text-gray-500">Competency fit</p>
                <p className="font-semibold text-gray-900">Run a quick self-assessment</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          </div>
          <div className="p-4 border border-dashed border-primary-200 rounded-xl bg-primary-50">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-primary-700">Completion trend</p>
                <p className="text-xl font-semibold text-primary-900">{completionRate}%</p>
              </div>
            </div>
            <p className="text-sm text-primary-700 mt-3">
              Update progress every week so leadership has an accurate view of org-wide execution.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Finished strong</p>
            <h2 className="text-xl font-semibold text-gray-900">Completed goals</h2>
          </div>
          <CheckCircle2 className="text-green-600" size={20} />
        </div>
        {completedGoals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">No completed goals yet. Finish one to celebrate here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{goal.title}</p>
                  <span className="text-xs text-gray-500">Completed {formatDate(goal.updatedAt)}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
