import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to add the organizational goals AI prompt template
 * Run this on production to add the new template without reseeding everything
 */
async function addGoalPromptTemplate() {
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
      return;
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
    console.log('   ID:', template.id);
    console.log('   Module:', template.module);
    console.log('   Type:', template.promptType);
  } catch (error) {
    console.error('❌ Error creating template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addGoalPromptTemplate()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
