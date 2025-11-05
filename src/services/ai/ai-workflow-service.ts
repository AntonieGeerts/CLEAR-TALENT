import { LLMOrchestrator } from './orchestrator';
import { RoleTemplateService } from '../role/role-template-service';
import { CompetencyService } from '../competency/competency-service';
import { AIServiceError } from '../../types';
import { aiLogger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GoalSuggestion {
  title: string;
  description: string;
  type: 'SMART' | 'OKR';
  keyResults?: string[];
  targetMetric?: string;
  targetValue?: string;
  timeframe?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SkillGap {
  competencyId: string;
  competencyName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}

export class AIWorkflowService {
  private static orchestrator = LLMOrchestrator.getInstance();

  /**
   * Suggest goals/OKRs for a user based on role and competencies (S2.2)
   */
  static async suggestGoals(
    tenantId: string,
    userId: string,
    roleProfileId: string,
    context?: {
      performanceData?: string;
      careerAspirations?: string;
      recentFeedback?: string;
    }
  ): Promise<GoalSuggestion[]> {
    try {
      // Get role profile
      const roleProfile = await RoleTemplateService.getRoleProfileById(roleProfileId, tenantId);

      // Build context
      const competenciesList = roleProfile.roleCompetencies
        .map((rc) => `- ${rc.competency.name} (${rc.level.name} level)`)
        .join('\n');

      const prompt = `Generate 3-5 SMART goals or OKRs for an employee in the following role:

Role: ${roleProfile.title}
Department: ${roleProfile.department}
Seniority: ${roleProfile.seniority}

Required Competencies:
${competenciesList}

${context?.performanceData ? `Recent Performance Data:\n${context.performanceData}\n` : ''}
${context?.careerAspirations ? `Career Aspirations:\n${context.careerAspirations}\n` : ''}
${context?.recentFeedback ? `Recent Feedback:\n${context.recentFeedback}\n` : ''}

For each goal, provide:
1. title (concise, 5-8 words)
2. description (detailed SMART or OKR description)
3. type ("SMART" or "OKR")
4. keyResults (array of 2-4 key results for OKRs)
5. targetMetric (what will be measured)
6. targetValue (target to achieve)
7. timeframe (e.g., "Q1 2025", "6 months")
8. priority ("HIGH", "MEDIUM", or "LOW")

Return as a JSON array.`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'goal',
          action: 'suggest-goals',
        }
      );

      const goals = this.orchestrator.parseJSONResponse<GoalSuggestion[]>(response);

      aiLogger.info('Goals suggested successfully', {
        roleProfileId,
        count: goals.length,
      });

      return goals;
    } catch (error) {
      aiLogger.error('Failed to suggest goals', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to suggest goals');
    }
  }

  /**
   * Detect skill gaps from review and self-assessment data (S2.3)
   */
  static async detectSkillGaps(
    tenantId: string,
    userId: string,
    employeeId: string,
    roleProfileId?: string
  ): Promise<SkillGap[]> {
    try {
      // Get user's current skill profile
      const skillProfiles = await prisma.skillProfile.findMany({
        where: { userId: employeeId },
        include: {
          competency: true,
          current: true,
        },
      });

      // Get target role profile if provided
      let targetCompetencies = [];
      if (roleProfileId) {
        const roleProfile = await RoleTemplateService.getRoleProfileById(roleProfileId, tenantId);
        targetCompetencies = roleProfile.roleCompetencies;
      }

      const gaps: SkillGap[] = [];

      for (const required of targetCompetencies) {
        const current = skillProfiles.find(
          (sp) => sp.competencyId === required.competencyId
        );

        const currentLevel = current?.current.numericLevel || 0;
        const requiredLevel = required.level.numericLevel;
        const gap = requiredLevel - currentLevel;

        if (gap > 0) {
          // Generate recommendations using AI
          const prompt = `Generate 3-4 specific recommendations to close this skill gap:

Competency: ${required.competency.name}
Type: ${required.competency.type}
Current Level: ${currentLevel}/5
Required Level: ${requiredLevel}/5
Gap: ${gap} levels

Provide actionable, specific recommendations (training, projects, mentoring, etc.).
Return as a JSON array of strings.`;

          const response = await this.orchestrator.generateCompletion(
            prompt,
            {
              tenantId,
              userId,
              module: 'learning',
              action: 'skill-gap-recommendations',
            }
          );

          const recommendations = this.orchestrator.parseJSONResponse<string[]>(response);

          gaps.push({
            competencyId: required.competencyId,
            competencyName: required.competency.name,
            currentLevel,
            requiredLevel,
            gap,
            priority: gap >= 2 ? 'CRITICAL' : gap === 1 ? 'HIGH' : 'MEDIUM',
            recommendations,
          });
        }
      }

      aiLogger.info('Skill gaps detected', {
        employeeId,
        gapsFound: gaps.length,
      });

      return gaps.sort((a, b) => b.gap - a.gap);
    } catch (error) {
      aiLogger.error('Failed to detect skill gaps', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to detect skill gaps');
    }
  }

  /**
   * Generate Individual Development Plan (IDP) (S2.4)
   */
  static async generateIDP(
    tenantId: string,
    userId: string,
    employeeId: string,
    options: {
      skillGaps?: SkillGap[];
      careerGoals?: string;
      timeframe?: string;
      focusAreas?: string[];
    } = {}
  ) {
    try {
      const { skillGaps = [], careerGoals, timeframe = '6 months', focusAreas = [] } = options;

      const gapsText = skillGaps
        .map(
          (gap) =>
            `- ${gap.competencyName}: ${gap.currentLevel} → ${gap.requiredLevel} (Gap: ${gap.gap})`
        )
        .join('\n');

      const prompt = `Create a comprehensive Individual Development Plan (IDP):

Employee Skill Gaps:
${gapsText || 'No specific gaps identified'}

${careerGoals ? `Career Goals:\n${careerGoals}\n` : ''}
${focusAreas.length > 0 ? `Focus Areas:\n${focusAreas.join(', ')}\n` : ''}

Timeframe: ${timeframe}

Generate an IDP with:
1. title (concise title for the plan)
2. description (overview and objectives)
3. actions (array of 5-10 development actions, each with):
   - action (what to do)
   - type (e.g., "Training", "On-the-job", "Mentoring", "Self-study", "Project")
   - competency (which competency this develops)
   - timeline (when to complete)
   - resources (what resources are needed)
   - successMetrics (how to measure success)
4. milestones (array of 3-5 key milestones with dates)
5. supportNeeded (what support is needed from manager/org)

Return as a JSON object.`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'learning',
          action: 'generate-idp',
        }
      );

      const idp = this.orchestrator.parseJSONResponse<any>(response);

      aiLogger.info('IDP generated successfully', { employeeId });

      return idp;
    } catch (error) {
      aiLogger.error('Failed to generate IDP', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate IDP');
    }
  }

  /**
   * Extract sentiment and themes from feedback (S2.5)
   */
  static async analyzeFeedback(
    tenantId: string,
    userId: string,
    feedbackTexts: string[]
  ) {
    try {
      const combinedFeedback = feedbackTexts.join('\n\n---\n\n');

      const prompt = `Analyze the following feedback and extract:
1. Overall sentiment (POSITIVE, NEUTRAL, NEGATIVE, MIXED)
2. Key themes (array of themes mentioned across feedback)
3. Strengths mentioned (array)
4. Areas for improvement mentioned (array)
5. Sentiment breakdown (percentage positive, neutral, negative)
6. Common keywords (array of most common words/phrases)

Feedback:
${combinedFeedback}

Return as a JSON object.`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'feedback',
          action: 'analyze-sentiment',
        }
      );

      const analysis = this.orchestrator.parseJSONResponse<{
        overallSentiment: string;
        themes: string[];
        strengths: string[];
        areasForImprovement: string[];
        sentimentBreakdown: {
          positive: number;
          neutral: number;
          negative: number;
        };
        commonKeywords: string[];
      }>(response);

      aiLogger.info('Feedback analyzed', {
        feedbackCount: feedbackTexts.length,
        sentiment: analysis.overallSentiment,
      });

      return analysis;
    } catch (error) {
      aiLogger.error('Failed to analyze feedback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to analyze feedback');
    }
  }

  /**
   * Suggest learning paths linked to competencies (S2.6)
   */
  static async suggestLearningPath(
    tenantId: string,
    userId: string,
    competencyId: string,
    currentLevel: number,
    targetLevel: number
  ) {
    try {
      const competency = await CompetencyService.getCompetencyById(competencyId, tenantId);

      const prompt = `Create a learning path to develop this competency:

Competency: ${competency.name}
Type: ${competency.type}
Category: ${competency.category}
Description: ${competency.description}

Current Level: ${currentLevel}/5
Target Level: ${targetLevel}/5

Generate a learning path with:
1. title (learning path title)
2. description (overview)
3. estimatedDuration (total time needed)
4. phases (array of 3-5 learning phases, each with):
   - phase (phase name)
   - level (what level this phase develops to)
   - duration (estimated time for this phase)
   - activities (array of learning activities)
   - resources (recommended resources)
   - assessments (how to assess progress)
5. quickWins (array of 2-3 quick actions for immediate improvement)
6. longTermActivities (array of ongoing development activities)

Return as a JSON object.`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'learning',
          action: 'suggest-learning-path',
        }
      );

      const learningPath = this.orchestrator.parseJSONResponse<any>(response);

      aiLogger.info('Learning path suggested', {
        competencyId,
        currentLevel,
        targetLevel,
      });

      return learningPath;
    } catch (error) {
      aiLogger.error('Failed to suggest learning path', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to suggest learning path');
    }
  }
}

export default AIWorkflowService;
