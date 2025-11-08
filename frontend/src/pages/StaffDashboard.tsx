import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  ClipboardList,
  Bell,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Activity,
  Brain,
  BookOpen,
  MessageCircle,
  BarChart3,
  ArrowRight,
  PlayCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface StaffDashboardProps {
  isPreview?: boolean;
}

type GoalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

type AssessmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

interface GoalSummary {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  progress?: number | null;
  targetDate?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface GoalStats {
  total: number;
  byStatus: Record<string, number>;
}

interface AssessmentSummary {
  id: string;
  status: AssessmentStatus;
  totalQuestions: number;
  answeredCount: number;
  averageScore?: number | null;
  startedAt: string;
  completedAt?: string | null;
}

interface DevelopmentPlan {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string | null;
  targetDate?: string | null;
  progress?: number | null;
  actions?: any;
  updatedAt?: string;
}

interface FeedbackInsights {
  overallSentiment?: string;
  themes?: string[];
  strengths?: string[];
  areasForImprovement?: string[];
  sentimentBreakdown?: {
    positive?: number;
    neutral?: number;
    negative?: number;
  };
  commonKeywords?: string[];
  feedbackCount?: number;
  message?: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  type: 'Goal' | 'Self-Assessment';
  dueLabel: string;
  progress: number;
  actionLabel: string;
  url: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'goal' | 'ldp' | 'feedback' | 'assessment';
}

const sentimentBadgeStyles: Record<string, string> = {
  positive: 'bg-green-50 text-green-700 border border-green-100',
  neutral: 'bg-blue-50 text-blue-700 border border-blue-100',
  mixed: 'bg-amber-50 text-amber-700 border border-amber-100',
  negative: 'bg-red-50 text-red-700 border border-red-100',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatDate = (value?: string | null, fallback = '—') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : dateFormatter.format(date);
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return 'No due date';
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 'No due date';
  const now = Date.now();
  const diffDays = Math.round((target.getTime() - now) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays === -1) return 'Due yesterday';
  if (diffDays > 1) return `Due in ${diffDays} days`;
  return `Overdue by ${Math.abs(diffDays)} days`;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateFormatter.format(date);
};

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ isPreview = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [developmentPlan, setDevelopmentPlan] = useState<DevelopmentPlan | null>(null);
  const [feedbackInsights, setFeedbackInsights] = useState<FeedbackInsights | null>(null);

  const loadDashboard = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const goalsResponse = await apiService.getGoals();
      const goalList = Array.isArray(goalsResponse.data) ? goalsResponse.data : [];
      setGoals(goalList);

      const [goalStatsRes, plansRes, assessmentsRes, feedbackRes] = await Promise.all([
        apiService.getGoalStats().catch((err) => {
          console.warn('Failed to load goal stats', err);
          return null;
        }),
        apiService.getIDPs().catch((err) => {
          console.warn('Failed to load IDPs', err);
          return null;
        }),
        apiService.getMyAssessments().catch((err) => {
          console.warn('Failed to load assessments', err);
          return null;
        }),
        apiService.getFeedbackInsights(user.id).catch((err) => {
          console.warn('Failed to load feedback insights', err);
          return null;
        }),
      ]);

      setGoalStats(goalStatsRes?.data || null);

      const plans = Array.isArray(plansRes?.data) ? plansRes?.data : [];
      setDevelopmentPlan(plans.length > 0 ? plans[0] : null);

      const assessmentList = Array.isArray(assessmentsRes?.data) ? assessmentsRes?.data : [];
      setAssessments(assessmentList);

      setFeedbackInsights(feedbackRes?.data || null);
    } catch (err: any) {
      console.error('Failed to load staff dashboard', err);
      setError(err.response?.data?.error || 'Unable to load your dashboard right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const firstName = useMemo(() => {
    if (user?.firstName) return user.firstName;
    if (user?.name) return user.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user?.firstName, user?.name, user?.email]);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED'), [goals]);

  const planActions = useMemo(() => {
    if (!developmentPlan?.actions) return [];
    if (Array.isArray(developmentPlan.actions)) return developmentPlan.actions;
    return [];
  }, [developmentPlan]);

  const planMilestones = useMemo(() => {
    const completed = planActions.filter((action: any) => action?.status === 'COMPLETED' || action?.completed)?.length || 0;
    return {
      total: planActions.length,
      completed,
    };
  }, [planActions]);

  const nextMilestone = useMemo(() => {
    if (!planActions.length) return null;
    const withDates = planActions
      .map((action: any) => {
        const dueDate = action?.dueDate || action?.targetDate || action?.date;
        return {
          title: action?.title || action?.name || 'Upcoming milestone',
          dueDate,
        };
      })
      .filter((action) => !!action.dueDate);

    if (!withDates.length) return null;

    return withDates.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];
  }, [planActions]);

  const focusAreas = useMemo(() => {
    if (!planActions.length) return [];
    const raw = planActions
      .map((action: any) => action?.focusArea || action?.category || action?.theme)
      .filter(Boolean);
    return Array.from(new Set(raw)).slice(0, 4);
  }, [planActions]);

  const learningRecommendations = useMemo(() => {
    if (!planActions.length) return [];
    return planActions
      .filter((action: any) => action?.title || action?.resource)
      .slice(0, 3)
      .map((action: any, index: number) => ({
        id: `${developmentPlan?.id}-${index}`,
        title: action?.title || action?.resource || 'Learning activity',
        source: action?.provider || action?.source || 'Development plan',
        duration: action?.duration || action?.timebox || null,
        tags: Array.isArray(action?.tags || action?.focusAreas || action?.skills)
          ? (action?.tags || action?.focusAreas || action?.skills).slice(0, 3)
          : [],
      }));
  }, [planActions, developmentPlan?.id]);

  const assignments = useMemo<AssignmentItem[]>(() => {
    const items: AssignmentItem[] = [];

    activeGoals.slice(0, 3).forEach((goal) => {
      items.push({
        id: `goal-${goal.id}`,
        title: goal.title,
        type: 'Goal',
        dueLabel: formatRelativeTime(goal.targetDate),
        progress: Math.max(0, Math.min(100, goal.progress ?? 0)),
        actionLabel: goal.status === 'DRAFT' ? 'Finalize goal' : 'Update progress',
        url: '/goals',
      });
    });

    assessments
      .filter((assessment) => assessment.status === 'IN_PROGRESS')
      .slice(0, 2)
      .forEach((assessment) => {
        const progress = assessment.totalQuestions
          ? Math.round((assessment.answeredCount / assessment.totalQuestions) * 100)
          : 0;
        items.push({
          id: `assessment-${assessment.id}`,
          title: 'Competency self-assessment',
          type: 'Self-Assessment',
          dueLabel: `Started ${formatTimestamp(assessment.startedAt)}`,
          progress,
          actionLabel: 'Continue',
          url: '/competencies',
        });
      });

    return items.slice(0, 4);
  }, [activeGoals, assessments]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    goals.forEach((goal) => {
      if (!goal.targetDate) return;
      const dueSoon = new Date(goal.targetDate).getTime() - Date.now();
      const daysUntilDue = Math.round(dueSoon / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7) {
        items.push({
          id: `goal-${goal.id}`,
          title: goal.status === 'DRAFT' ? 'Goal needs approval' : 'Goal due soon',
          description: goal.title,
          timestamp: goal.updatedAt,
          type: 'goal',
        });
      }
    });

    assessments
      .filter((assessment) => assessment.status === 'COMPLETED')
      .slice(0, 2)
      .forEach((assessment) => {
        items.push({
          id: `assessment-${assessment.id}`,
          title: 'Assessment completed',
          description: 'Results available for download.',
          timestamp: assessment.completedAt || assessment.startedAt,
          type: 'assessment',
        });
      });

    if (developmentPlan) {
      items.push({
        id: `ldp-${developmentPlan.id}`,
        title: 'Development plan updated',
        description: developmentPlan.title,
        timestamp: developmentPlan.updatedAt || developmentPlan.startDate || new Date().toISOString(),
        type: 'ldp',
      });
    }

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);
  }, [goals, assessments, developmentPlan]);

  const completedAssessments = useMemo(
    () => assessments.filter((assessment) => assessment.status === 'COMPLETED' && typeof assessment.averageScore === 'number'),
    [assessments]
  );

  const assessmentTrendValues = useMemo(() => {
    if (!completedAssessments.length) return [];
    return completedAssessments
      .slice()
      .sort((a, b) => new Date(a.completedAt || a.startedAt).getTime() - new Date(b.completedAt || b.startedAt).getTime())
      .slice(-6)
      .map((assessment) => ({
        value: assessment.averageScore ?? 0,
        date: assessment.completedAt || assessment.startedAt,
      }));
  }, [completedAssessments]);

  const competencyTrendPoints = useMemo(() => {
    if (assessmentTrendValues.length === 0) return [];
    if (assessmentTrendValues.length === 1) {
      const value = assessmentTrendValues[0].value ?? 0;
      return [
        { x: 0, y: 25, value },
        { x: 100, y: 25, value },
      ];
    }

    const values = assessmentTrendValues.map((entry) => entry.value ?? 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const normalized = (value - min) / range;
      const y = 35 - normalized * 25;
      return { x, y, value };
    });
  }, [assessmentTrendValues]);

  const competencyTrendChange = useMemo(() => {
    if (assessmentTrendValues.length < 2) return 0;
    const first = assessmentTrendValues[0].value ?? 0;
    const last = assessmentTrendValues[assessmentTrendValues.length - 1].value ?? 0;
    return Number((last - first).toFixed(1));
  }, [assessmentTrendValues]);

  const averageAssessmentScore = useMemo(() => {
    if (!completedAssessments.length) return null;
    const total = completedAssessments.reduce((sum, assessment) => sum + (assessment.averageScore ?? 0), 0);
    return Number((total / completedAssessments.length).toFixed(1));
  }, [completedAssessments]);

  const goalCompletionRate = useMemo(() => {
    if (!goalStats || !goalStats.total) return null;
    const completed = goalStats.byStatus?.COMPLETED || goalStats.byStatus?.completed || 0;
    return Math.round((completed / goalStats.total) * 100);
  }, [goalStats]);

  const goalMomentum = useMemo(() => {
    if (!activeGoals.length) return 0;
    const total = activeGoals.reduce((sum, goal) => sum + (goal.progress ?? 0), 0);
    return Math.round(total / activeGoals.length);
  }, [activeGoals]);

  const learningVelocity = useMemo(() => Math.round(developmentPlan?.progress ?? 0), [developmentPlan?.progress]);

  const sentimentKey = (feedbackInsights?.overallSentiment || '').toLowerCase();
  const sentimentClass = sentimentBadgeStyles[sentimentKey] || sentimentBadgeStyles.neutral;

  const kpis = useMemo(
    () => [
      {
        label: 'Avg. assessment score',
        value: averageAssessmentScore ? `${averageAssessmentScore} / 5` : '--',
        change: completedAssessments.length ? `${completedAssessments.length} completed` : 'No completed assessments yet',
      },
      {
        label: 'Goal completion',
        value: goalCompletionRate !== null ? `${goalCompletionRate}%` : '--',
        change: goalStats ? `${goalStats.byStatus?.COMPLETED || goalStats.byStatus?.completed || 0} of ${goalStats.total} goals` : 'Track goals to see progress',
      },
      {
        label: 'Plan progress',
        value: developmentPlan ? `${Math.round(developmentPlan.progress ?? 0)}%` : '--',
        change: developmentPlan ? developmentPlan.title : 'Assign a development plan to begin',
      },
    ],
    [averageAssessmentScore, completedAssessments.length, goalCompletionRate, goalStats, developmentPlan]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isPreview && (
        <div className="card border border-dashed border-primary-200 bg-primary-50 text-primary-900 flex items-center space-x-3">
          <Sparkles size={18} />
          <p className="text-sm">
            You're previewing your personal staff experience. Actions taken here affect only your own plan and assignments.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between card bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={loadDashboard} className="text-sm font-medium underline">
            Retry
          </button>
        </div>
      )}

      <div className="card bg-gradient-to-r from-primary-600 to-primary-500 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary-100">Staff overview</p>
            <h1 className="text-3xl font-bold mt-1">Hi {firstName}, welcome back 👋</h1>
            <p className="text-primary-100 mt-2">
              Everything you need to stay on track with goals, assessments, and your development plan—powered by live data.
            </p>
          </div>
          {developmentPlan && (
            <div className="bg-white/15 rounded-xl p-4">
              <p className="text-sm text-primary-100">Next milestone</p>
              <p className="text-lg font-semibold">
                {nextMilestone ? `${nextMilestone.title} (${formatDate(nextMilestone.dueDate)})` : 'Keep growing'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Current assignments</p>
              <h2 className="text-xl font-semibold text-gray-900">Action Center</h2>
            </div>
            <ClipboardList className="text-primary-500" size={20} />
          </div>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No pending actions. You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">{assignment.type}</p>
                      <p className="text-base font-semibold text-gray-900">{assignment.title}</p>
                    </div>
                    <Link to={assignment.url} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      {assignment.actionLabel}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{assignment.dueLabel}</span>
                    </div>
                    <span>{assignment.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full bg-primary-500" style={{ width: `${assignment.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Latest updates</p>
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>
            <Bell className="text-primary-500" size={20} />
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No new notifications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                    {notification.type === 'goal' && <Target size={18} />}
                    {notification.type === 'ldp' && <BookOpen size={18} />}
                    {notification.type === 'feedback' && <MessageCircle size={18} />}
                    {notification.type === 'assessment' && <ClipboardList size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <span className="text-xs text-gray-400">{formatTimestamp(notification.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{notification.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Performance history</p>
              <h2 className="text-xl font-semibold text-gray-900">Assessments</h2>
            </div>
            <Activity className="text-primary-500" size={20} />
          </div>
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No assessments yet. Start a self-assessment from the competency library.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.slice(0, 3).map((assessment) => (
                <div key={assessment.id} className="p-4 border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-gray-900">Competency assessment</p>
                      <p className="text-sm text-gray-500">{formatDate(assessment.completedAt || assessment.startedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {assessment.averageScore !== undefined && assessment.averageScore !== null ? assessment.averageScore.toFixed(1) : '--'}
                      </p>
                      <p className="text-xs text-gray-400">/ 5.0</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <span>Status: {assessment.status.replace('_', ' ').toLowerCase()}</span>
                    <span>
                      {assessment.answeredCount}/{assessment.totalQuestions} questions
                    </span>
                  </div>
                  <Link to="/competencies" className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                    View details
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Goal tracking</p>
              <h2 className="text-xl font-semibold text-gray-900">Personal goals</h2>
            </div>
            <Target className="text-primary-500" size={20} />
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No goals yet. Head to the goals workspace to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 4).map((goal) => {
                const weight = goal.metadata?.weight || goal.metadata?.weighting || null;
                const progressColor =
                  goal.status === 'COMPLETED'
                    ? 'bg-green-500'
                    : goal.status === 'ACTIVE'
                    ? 'bg-primary-500'
                    : 'bg-gray-400';
                return (
                  <div key={goal.id} className="p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">{goal.title}</p>
                      {weight && <span className="text-sm text-gray-500">{weight}% weight</span>}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>{goal.targetDate ? formatDate(goal.targetDate) : 'No target date'}</span>
                      <span className="capitalize">{goal.status.toLowerCase()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${Math.min(goal.progress ?? 0, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Learning & Growth</p>
              <h2 className="text-xl font-semibold text-gray-900">Development plan</h2>
            </div>
            <Brain className="text-primary-500" size={20} />
          </div>
          {developmentPlan ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{developmentPlan.title}</p>
                  <p className="text-sm text-gray-500">
                    {planMilestones.completed} / {planMilestones.total || '—'} milestones complete
                  </p>
                </div>
                <span className="text-3xl font-bold text-primary-600">{Math.round(developmentPlan.progress ?? 0)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mb-4">
                <div className="h-2 rounded-full bg-primary-500" style={{ width: `${Math.min(developmentPlan.progress ?? 0, 100)}%` }} />
              </div>
              {nextMilestone ? (
                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm text-gray-600">Next milestone</p>
                  <p className="font-medium text-gray-900">
                    {nextMilestone.title} • {formatDate(nextMilestone.dueDate)}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-primary-50 rounded-xl text-sm text-gray-600">
                  Keep progressing through your plan milestones.
                </div>
              )}
              {focusAreas.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Focus areas</p>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((area) => (
                      <span key={area} className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-gray-900">No plan assigned</p>
              <p className="text-sm text-gray-600 mt-1">
                Request a personalized development plan or explore the learning library to get started.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link to="/idps" className="btn btn-primary">
                  Request a plan
                </Link>
                <Link to="/competencies" className="btn btn-secondary">
                  Explore library
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Suggested for you</p>
              <h2 className="text-xl font-semibold text-gray-900">Recommended learning</h2>
            </div>
            <BookOpen className="text-primary-500" size={20} />
          </div>
          {learningRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Complete an assessment or plan to unlock personalized recommendations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {learningRecommendations.map((rec) => (
                <div key={rec.id} className="p-4 border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{rec.title}</p>
                      <p className="text-sm text-gray-500">{rec.source}</p>
                    </div>
                    {rec.duration && <span className="text-sm text-gray-500">{rec.duration}</span>}
                  </div>
                  {rec.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {rec.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <Link to="/idps" className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                    View details
                    <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Self-reflection</p>
              <h2 className="text-xl font-semibold text-gray-900">Self-assessments</h2>
            </div>
            <CheckCircle2 className="text-primary-500" size={20} />
          </div>
          <div className="p-4 border border-dashed border-primary-200 rounded-xl bg-primary-50">
            {assessments.some((assessment) => assessment.status === 'IN_PROGRESS') ? (
              <>
                <p className="text-sm text-primary-600">In progress</p>
                <p className="text-lg font-semibold text-primary-900">Tap to resume where you left off</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link to="/competencies" className="btn btn-primary flex items-center space-x-2">
                    <PlayCircle size={18} />
                    <span>Continue self-assessment</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-primary-600">Ready when you are</p>
                <p className="text-lg font-semibold text-primary-900">Start a self-assessment to unlock fresh insights</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link to="/competencies" className="btn btn-primary flex items-center space-x-2">
                    <Sparkles size={18} />
                    <span>Start new assessment</span>
                  </Link>
                  <Link to="/competencies" className="btn btn-secondary">
                    View competency library
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Feedback pulse</p>
              <h2 className="text-xl font-semibold text-gray-900">Peer & manager insights</h2>
            </div>
            <MessageCircle className="text-primary-500" size={20} />
          </div>
          {feedbackInsights ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500">Feedback analyzed</p>
                  <p className="text-2xl font-bold text-gray-900">{feedbackInsights.feedbackCount ?? 0}</p>
                </div>
                <div className={`p-4 rounded-xl ${sentimentClass}`}>
                  <p className="text-xs uppercase tracking-wide">Overall sentiment</p>
                  <p className="text-lg font-semibold capitalize">{feedbackInsights.overallSentiment || 'Neutral'}</p>
                </div>
              </div>
              {feedbackInsights.sentimentBreakdown && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xs text-gray-500">Positive</p>
                    <p className="text-lg font-semibold text-green-700">
                      {feedbackInsights.sentimentBreakdown.positive ?? 0}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-xs text-gray-500">Neutral</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {feedbackInsights.sentimentBreakdown.neutral ?? 0}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50">
                    <p className="text-xs text-gray-500">Growth</p>
                    <p className="text-lg font-semibold text-amber-700">
                      {feedbackInsights.sentimentBreakdown.negative ?? 0}%
                    </p>
                  </div>
                </div>
              )}
              {feedbackInsights.themes && feedbackInsights.themes.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {feedbackInsights.themes.slice(0, 6).map((theme) => (
                      <span key={theme} className="px-2 py-0.5 rounded-full bg-gray-100 text-sm text-gray-700">
                        #{theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No feedback summaries yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Analytics & insights</p>
            <h2 className="text-2xl font-semibold text-gray-900">Performance snapshot</h2>
          </div>
          <Link to="/goals" className="btn btn-secondary flex items-center space-x-2">
            <BarChart3 size={18} />
            <span>Download summary</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="p-4 border border-gray-100 rounded-xl">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              <p className="text-sm text-green-600 mt-1">{kpi.change}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-4 border border-gray-100 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Competency trend</p>
                <p className="text-lg font-semibold text-gray-900">Assessment momentum</p>
              </div>
              <span className={`text-sm font-medium ${competencyTrendChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {competencyTrendChange >= 0 ? '+' : ''}
                {competencyTrendChange}
              </span>
            </div>
            {competencyTrendPoints.length > 0 ? (
              <svg viewBox="0 0 100 40" className="w-full h-24 text-green-500">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  points={competencyTrendPoints.map((point) => `${point.x},${point.y}`).join(' ')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {competencyTrendPoints.map((point, index) => (
                  <circle key={index} cx={point.x} cy={point.y} r={1.5} fill="currentColor" />
                ))}
              </svg>
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                Complete an assessment to unlock this trend
              </div>
            )}
            <p className="text-xs text-gray-500 text-right mt-1">
              {assessmentTrendValues.length ? `${assessmentTrendValues.length} recent assessments` : 'Awaiting data'}
            </p>
          </div>
          <div className="p-4 border border-gray-100 rounded-xl space-y-4">
            <div>
              <p className="text-sm text-gray-600">Goal momentum</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-gray-900">{goalMomentum}%</span>
                <span className="text-xs text-gray-500">Avg. progress</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mt-2">
                <div className="h-2 rounded-full bg-primary-500" style={{ width: `${goalMomentum}%` }} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Learning velocity</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-gray-900">{learningVelocity}%</span>
                <span className="text-xs text-gray-500">Plan completion</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mt-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${learningVelocity}%` }} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Competency growth</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-gray-900">
                  {competencyTrendChange >= 0 ? '+' : ''}
                  {competencyTrendChange}
                </span>
                <span className="text-xs text-gray-500">Avg. score delta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
