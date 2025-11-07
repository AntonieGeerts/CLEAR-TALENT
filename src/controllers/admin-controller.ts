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

  /**
   * Install the AI prompt template for competency generation by category
   * This is a temporary endpoint for production setup
   */
  static async installCompetencyTemplate(req: Request, res: Response) {
    try {
      console.log('🔍 Checking for existing competency generation template...');

      // Check if template already exists
      const existing = await prisma.aIPromptTemplate.findFirst({
        where: {
          module: 'COMPETENCY',
          promptType: 'generate-by-category',
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

      console.log('📝 Creating competency generation template...');

      const template = await prisma.aIPromptTemplate.create({
        data: {
          name: 'generate-by-category',
          module: 'COMPETENCY',
          promptType: 'generate-by-category',
          template: `Generate {{count}} {{category}} competencies for a performance management system tailored to the following organization:

**Organization Context:**
- Company: {{companyName}}
- Industry: {{industry}}
{{#companySize}}- Size: {{companySize}}{{/companySize}}
{{#companyValues}}- Values: {{companyValues}}{{/companyValues}}
{{#companyDescription}}- Description: {{companyDescription}}{{/companyDescription}}

**{{category}} Competencies:**
{{categoryDescription}}

**Examples of {{category}} Competencies:**
{{#if_CORE}}
- Customer Orientation: Understanding and meeting customer needs
- Effective Communication: Conveying information clearly and professionally
- Personal Accountability: Taking ownership of responsibilities
- Teamwork and Collaboration: Working effectively with others
- Work Standard Compliance: Following policies and quality standards
{{/if_CORE}}
{{#if_LEADERSHIP}}
- Business Acumen and Entrepreneurial Orientation: Understanding business drivers
- Empowering Others: Developing and enabling team members
- Managing Performance: Setting expectations and providing feedback
- Strategic and Analytical Thinking: Long-term planning and problem-solving
- Total Work System: Optimizing processes and workflows
{{/if_LEADERSHIP}}
{{#if_FUNCTIONAL}}
- Technical Expertise: Role-specific technical skills
- Process Management: Managing workflows efficiently
- Quality Assurance: Maintaining standards
- Innovation: Developing new solutions
- Industry Knowledge: Understanding sector-specific requirements
{{/if_FUNCTIONAL}}

**Requirements:**
For each competency, provide:
1. **name**: Clear, concise competency name (2-5 words)
2. **description**: Detailed description relevant to {{industry}} industry (2-3 sentences)
3. **category**: A specific sub-category or focus area

Make competencies:
- Specific to {{companyName}}'s industry and context
- Distinct and measurable with observable behaviors
- Appropriate for the organization's size and values
- Assessable on a proficiency scale (Basic → Expert → Master)
- Relevant to actual workplace performance

Return ONLY a valid JSON array with no additional text or explanation. Use this exact structure:

[
  {
    "name": "Customer Orientation",
    "description": "Demonstrates a commitment to understanding and meeting customer needs in the {{industry}} sector. Actively seeks customer feedback and uses it to improve service delivery and build long-term relationships.",
    "category": "Customer Service"
  },
  {
    "name": "Personal Accountability",
    "description": "Takes ownership of work responsibilities and outcomes. Follows through on commitments, meets deadlines, and acknowledges mistakes while taking corrective action.",
    "category": "Work Ethics"
  }
]`,
          variables: {
            count: 'Number of competencies to generate',
            category: 'CORE | LEADERSHIP | FUNCTIONAL',
            categoryDescription: 'Description of the category',
            companyName: 'Company name',
            industry: 'Industry or sector',
            companySize: 'Optional: Company size (Small/Medium/Large/Enterprise)',
            companyValues: 'Optional: Core company values',
            companyDescription: 'Optional: Brief company description',
          },
          version: 2,
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
      console.error('❌ Error installing competency template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to install competency template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
