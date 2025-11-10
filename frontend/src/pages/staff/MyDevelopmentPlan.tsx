import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, CheckCircle2, Loader2, AlertCircle, Target, Sparkles, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { DevelopmentPlan, PlanAction } from '../../types/staff';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatDate = (value?: string | null, fallback = 'Not set') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : dateFormatter.format(date);
};

const deriveProgress = (plan: DevelopmentPlan | null, actions: PlanAction[]) => {
  if (!actions.length) {
    return Math.round(plan?.progress ?? 0);
  }
  const completed = actions.filter((action) => action.completed || action.status === 'COMPLETED').length;
  return Math.round((completed / actions.length) * 100);
};

export const MyDevelopmentPlan: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const staffQuery = new URLSearchParams(location.search).get('view') === 'staff' ? '?view=staff' : '';
  const staffPath = (path: string) => `${path}${staffQuery}`;

  const [plans, setPlans] = useState<DevelopmentPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DevelopmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getIDPs();
      const planList = Array.isArray(response.data) ? response.data : [];
      setPlans(planList);
      const current = planList.find((plan) => plan.status === 'ACTIVE') || planList[0] || null;
      setActivePlan(current);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load your development plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const planActions = useMemo<PlanAction[]>(() => {
    if (!activePlan?.actions) return [];
    return Array.isArray(activePlan.actions) ? (activePlan.actions as PlanAction[]) : [];
  }, [activePlan]);

  const progress = useMemo(() => deriveProgress(activePlan, planActions), [activePlan, planActions]);

  const toggleActionCompletion = async (index: number) => {
    if (!activePlan) return;
    const cloned = planActions.map((action) => ({ ...action }));
    const target = cloned[index];
    cloned[index] = { ...target, completed: !target?.completed };

    try {
      setUpdating(true);
      await apiService.updateIDP(activePlan.id, {
        actions: cloned,
        progress: deriveProgress(activePlan, cloned),
      });
      setActivePlan({ ...activePlan, actions: cloned, progress: deriveProgress(activePlan, cloned) });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to update milestone');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-600" size={36} />
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-16">
          <GraduationCap className="mx-auto text-primary-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900">No development plan yet</h1>
          <p className="text-gray-600 mt-2">
            Your HR team or manager can assign a personalized plan. Let them know what skills or experiences you want to grow.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={staffPath('/me/goals')} className="btn btn-primary flex items-center space-x-2">
              <Target size={18} />
              <span>Review my goals</span>
            </Link>
            <Link to={staffPath('/me/competencies')} className="btn btn-secondary flex items-center space-x-2">
              <Sparkles size={18} />
              <span>Take an assessment</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="text-sm underline" onClick={fetchPlans}>
            Retry
          </button>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Development plan</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{activePlan.title}</h1>
            {activePlan.description && <p className="text-gray-600 mt-2">{activePlan.description}</p>}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-4">
              <span className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>{formatDate(activePlan.startDate)} – {formatDate(activePlan.targetDate)}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                {activePlan.status.toLowerCase()}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Progress</p>
            <p className="text-4xl font-bold text-primary-600">{progress}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Milestones</p>
              <h2 className="text-xl font-semibold text-gray-900">Action items</h2>
            </div>
            {planActions.length > 0 && (
              <p className="text-sm text-gray-500">{planActions.filter((a) => a.completed || a.status === 'COMPLETED').length} of {planActions.length} complete</p>
            )}
          </div>
          {planActions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No actions captured yet. Ask your manager to add a few concrete steps.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {planActions.map((action, index) => (
                <label key={`${action.title || 'action'}-${index}`} className="flex items-start space-x-3 border border-gray-100 rounded-xl p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!(action.completed || action.status === 'COMPLETED')}
                    onChange={() => toggleActionCompletion(index)}
                    disabled={updating}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{action.title || 'Action item'}</p>
                    {action.description && <p className="text-sm text-gray-600 mt-1">{action.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                      {action.focusArea && <span className="px-2 py-0.5 rounded-full bg-gray-100">{action.focusArea}</span>}
                      {action.dueDate && <span>Due {formatDate(action.dueDate)}</span>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="card space-y-6">
          <div>
            <p className="text-sm text-gray-500">Focus areas</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {planActions.length === 0 && <span className="text-sm text-gray-500">Not specified</span>}
              {planActions
                .map((action) => action.focusArea)
                .filter(Boolean)
                .slice(0, 6)
                .map((area) => (
                  <span key={area as string} className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                    {area}
                  </span>
                ))}
            </div>
          </div>
          <div className="p-4 border border-dashed border-primary-200 rounded-xl bg-primary-50">
            <p className="text-sm text-primary-700">Need to recalibrate?</p>
            <p className="text-sm text-primary-600 mt-1">
              Run a self-assessment or refresh your goals before asking for updates to the plan.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={staffPath('/me/competencies')} className="btn btn-primary btn-sm">
                Self-assess
              </Link>
              <Link to={staffPath('/me/goals')} className="btn btn-secondary btn-sm">
                View goals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
