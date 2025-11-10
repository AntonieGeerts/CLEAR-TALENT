export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

export interface GoalSummary {
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

export interface GoalStats {
  total: number;
  byStatus: Record<string, number>;
}

export type AssessmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface AssessmentSummary {
  id: string;
  status: AssessmentStatus;
  totalQuestions: number;
  answeredCount: number;
  averageScore?: number | null;
  startedAt: string;
  completedAt?: string | null;
}

export interface PlanAction {
  id?: string;
  title?: string;
  description?: string;
  focusArea?: string;
  category?: string;
  status?: string;
  dueDate?: string;
  targetDate?: string;
  date?: string;
  completed?: boolean;
  provider?: string;
  resource?: string;
  duration?: string | number;
  tags?: string[];
  [key: string]: any;
}

export interface DevelopmentPlan {
  id: string;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string | null;
  targetDate?: string | null;
  progress?: number | null;
  actions?: PlanAction[] | null;
  updatedAt?: string;
}

export interface FeedbackInsights {
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
