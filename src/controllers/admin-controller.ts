import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  /**
   * Install the AI prompt template for organizational goals
   * This is a temporary endpoint for production setup
   */
  static async installGoalTemplate(req: Request, res: Response) {
    try {
      console.log('🔍 Checking for existing goal generation template...');

      // Check if template already exists
      const existing = await prisma.aIPromptTemplate.findFirst({
        where: {
          module: 'GOAL',
          promptType: 'generate-strategic-goals',
        },
      });

      if (existing) {
        console.log('✓ Template already exists:', existing.name);
        return res.json({
          success: true,
          message: 'Template already exists',
          template: {
            id: existing.id,
            name: existing.name,
            module: existing.module,
            promptType: existing.promptType,
          },
        });
      }

      console.log('📝 Creating goal generation template...');

      const template = await prisma.aIPromptTemplate.create({
        data: {
          name: 'Generate Strategic Goals with BSC',
          module: 'GOAL',
          promptType: 'generate-strategic-goals',
          template: `Generate strategic organizational goals with Balanced Scorecard (BSC) perspectives and KPIs for the following organization:

Organization: {{organizationName}}
Industry: {{industry}}
Description: {{organizationDescription}}

Generate 3-5 strategic goals across the 4 Balanced Scorecard perspectives:
1. Financial Perspective
2. Customer Perspective
3. Internal Business Processes Perspective
4. Learning & Growth Perspective

For each goal, provide:
- title: Clear, actionable goal statement
- description: Detailed explanation of the goal and why it matters
- bscPerspective: One of [FINANCIAL, CUSTOMER, INTERNAL_PROCESS, LEARNING_GROWTH]
- department: Relevant department (or null for organization-wide)
- targetDate: Suggested target date in ISO format (1-2 years from now)
- weight: Importance weight as percentage (sum should be 100)
- kpis: Array of 2-4 Key Performance Indicators, each with:
  * name: KPI name
  * description: What this KPI measures
  * target: Target value
  * unit: Unit of measurement (%, $, #, etc.)
  * frequency: Measurement frequency (MONTHLY, QUARTERLY, ANNUALLY)

Return ONLY a valid JSON array of goals with no additional text or explanation. Use this exact structure:

[
  {
    "title": "Goal title here",
    "description": "Goal description here",
    "bscPerspective": "FINANCIAL",
    "department": "Finance",
    "targetDate": "2026-12-31",
    "weight": 30,
    "kpis": [
      {
        "name": "Revenue Growth",
        "description": "Year-over-year revenue increase",
        "target": "20",
        "unit": "%",
        "frequency": "QUARTERLY"
      }
    ]
  }
]`,
          variables: ['organizationName', 'industry', 'organizationDescription'],
          version: 1,
          isActive: true,
        },
      });

      console.log('✅ Successfully created template:', template.name);

      res.json({
        success: true,
        message: 'Template installed successfully',
        template: {
          id: template.id,
          name: template.name,
          module: template.module,
          promptType: template.promptType,
        },
      });
    } catch (error) {
      console.error('❌ Error installing template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to install template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
