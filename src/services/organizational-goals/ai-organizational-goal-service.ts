import { LLMOrchestrator } from '../ai/orchestrator';
import { aiLogger } from '../../utils/logger';
import { AIServiceError } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface KPI {
  name: string;
  description: string;
  target: string;
  unit: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
}

export interface GeneratedGoal {
  title: string;
  description: string;
  bscPerspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL_PROCESS' | 'LEARNING_GROWTH';
  department?: string;
  targetDate: string;
  weight: number;
  kpis: KPI[];
}

export interface GenerateGoalsInput {
  organizationName: string;
  industry: string;
  organizationDescription: string;
}

export class AIOrganizationalGoalService {
  private static orchestrator = LLMOrchestrator.getInstance();

  /**
   * Generate strategic goals with Balanced Scorecard and KPIs using AI
   */
  static async generateStrategicGoals(
    tenantId: string,
    userId: string,
    input: GenerateGoalsInput
  ): Promise<GeneratedGoal[]> {
    try {
      aiLogger.info('Generating strategic goals with BSC', {
        organizationName: input.organizationName,
        industry: input.industry,
      });

      // Generate goals using AI
      const response = await this.orchestrator.generateFromTemplate(
        'GOAL',
        'generate-strategic-goals',
        {
          organizationName: input.organizationName,
          industry: input.industry,
          organizationDescription: input.organizationDescription,
        },
        {
          tenantId,
          userId,
          module: 'goal',
          action: 'generate-strategic-goals',
        }
      );

      // Parse JSON response
      const goals = this.orchestrator.parseJSONResponse<GeneratedGoal[]>(response);

      // Validate structure
      if (!Array.isArray(goals) || goals.length === 0) {
        throw new Error('Invalid response format: expected array of goals');
      }

      // Validate each goal has required fields
      goals.forEach((goal, index) => {
        if (!goal.title || !goal.description || !goal.bscPerspective) {
          throw new Error(`Goal at index ${index} missing required fields`);
        }
        if (!goal.kpis || !Array.isArray(goal.kpis)) {
          throw new Error(`Goal "${goal.title}" missing KPIs array`);
        }
      });

      aiLogger.info('Strategic goals generated successfully', {
        count: goals.length,
        perspectives: goals.map(g => g.bscPerspective),
      });

      return goals;
    } catch (error) {
      aiLogger.error('Failed to generate strategic goals', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate strategic goals with Balanced Scorecard');
    }
  }

  /**
   * Create organizational goals from AI-generated suggestions
   */
  static async createGoalsFromAI(
    tenantId: string,
    userId: string,
    generatedGoals: GeneratedGoal[]
  ) {
    try {
      const createdGoals: any[] = [];

      for (const goalData of generatedGoals) {
        // Store KPIs and BSC perspective in metadata
        const metadata = {
          bscPerspective: goalData.bscPerspective,
          kpis: goalData.kpis,
          aiGenerated: true,
        } as any;

        const goal = await prisma.organizationalGoal.create({
          data: {
            tenantId,
            title: goalData.title,
            description: goalData.description,
            level: 'ORGANIZATIONAL', // These are top-level strategic goals
            department: goalData.department || null,
            weight: goalData.weight,
            targetDate: new Date(goalData.targetDate),
            createdBy: userId,
            metadata,
            status: 'DRAFT', // Start as draft so they can be reviewed
          },
        });

        createdGoals.push(goal);
      }

      aiLogger.info('Created organizational goals from AI suggestions', {
        count: createdGoals.length,
        tenantId,
      });

      return createdGoals;
    } catch (error) {
      aiLogger.error('Failed to create goals from AI suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate KPIs for a specific goal using AI
   */
  static async generateKPIsForGoal(
    tenantId: string,
    userId: string,
    input: {
      goalId: string;
      goalTitle: string;
      goalDescription: string;
      additionalContext?: string;
    }
  ): Promise<KPI[]> {
    try {
      aiLogger.info('Generating KPIs for specific goal', {
        goalId: input.goalId,
        goalTitle: input.goalTitle,
      });

      // Create prompt for KPI generation
      const prompt = `Generate 3-6 Key Performance Indicators (KPIs) for the following goal:

Goal Title: ${input.goalTitle}
Goal Description: ${input.goalDescription}
${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ''}

Generate specific, measurable KPIs that will help track progress toward this goal. For each KPI, provide:
- name: Clear, concise KPI name
- description: What this KPI measures and why it matters
- target: Target value (numeric)
- unit: Unit of measurement (%, $, #, points, etc.)
- frequency: How often to measure (MONTHLY, QUARTERLY, ANNUALLY)

Return ONLY a valid JSON array of KPIs with no additional text or explanation. Use this exact structure:

[
  {
    "name": "Revenue Growth Rate",
    "description": "Measures the year-over-year increase in revenue",
    "target": "20",
    "unit": "%",
    "frequency": "QUARTERLY"
  }
]`;

      // Generate KPIs using AI
      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'goal',
          action: 'generate-kpis',
        },
        {
          temperature: 0.7,
          maxTokens: 1500,
        }
      );

      // Parse JSON response
      const kpis = this.orchestrator.parseJSONResponse<KPI[]>(response);

      // Validate structure
      if (!Array.isArray(kpis) || kpis.length === 0) {
        throw new Error('Invalid response format: expected array of KPIs');
      }

      // Validate each KPI has required fields
      kpis.forEach((kpi, index) => {
        if (!kpi.name || !kpi.description || !kpi.target || !kpi.unit || !kpi.frequency) {
          throw new Error(`KPI at index ${index} missing required fields`);
        }
      });

      aiLogger.info('KPIs generated successfully', {
        count: kpis.length,
        goalId: input.goalId,
      });

      return kpis;
    } catch (error) {
      aiLogger.error('Failed to generate KPIs', {
        goalId: input.goalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to generate KPIs for goal');
    }
  }
}

export default AIOrganizationalGoalService;
