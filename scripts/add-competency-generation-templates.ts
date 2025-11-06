import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCompetencyGenerationTemplates() {
  console.log('Adding competency generation AI prompt templates...');

  try {
    // Template for generating competencies by category
    const generateByCategoryTemplate = await prisma.aIPromptTemplate.upsert({
      where: {
        name_module: {
          name: 'generate-by-category',
          module: 'COMPETENCY',
        },
      },
      update: {
        template: `Generate {{count}} {{category}} competencies for a performance management system.

{{category}} Competencies:
{{categoryDescription}}

For each competency, provide:
1. **name**: Clear, concise competency name (2-4 words)
2. **description**: Detailed description of what this competency means and why it's important (2-3 sentences)
3. **category**: A sub-category or focus area for this competency

Requirements:
- Each competency should be distinct and measurable
- Focus on observable behaviors and outcomes
- Make them relevant to workplace performance
- Ensure they can be assessed on a proficiency scale

Return ONLY a valid JSON array with no additional text or explanation. Use this exact structure:

[
  {
    "name": "Customer Orientation",
    "description": "Demonstrates a commitment to understanding and meeting customer needs. Actively seeks customer feedback and uses it to improve service delivery and build long-term relationships.",
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
        },
        promptType: 'generate-competencies',
        version: 1,
      },
      create: {
        name: 'generate-by-category',
        module: 'COMPETENCY',
        template: `Generate {{count}} {{category}} competencies for a performance management system.

{{category}} Competencies:
{{categoryDescription}}

For each competency, provide:
1. **name**: Clear, concise competency name (2-4 words)
2. **description**: Detailed description of what this competency means and why it's important (2-3 sentences)
3. **category**: A sub-category or focus area for this competency

Requirements:
- Each competency should be distinct and measurable
- Focus on observable behaviors and outcomes
- Make them relevant to workplace performance
- Ensure they can be assessed on a proficiency scale

Return ONLY a valid JSON array with no additional text or explanation. Use this exact structure:

[
  {
    "name": "Customer Orientation",
    "description": "Demonstrates a commitment to understanding and meeting customer needs. Actively seeks customer feedback and uses it to improve service delivery and build long-term relationships.",
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
        },
        promptType: 'generate-competencies',
        version: 1,
      },
    });

    console.log('✅ Template "generate-by-category" added/updated');

    console.log('\n✨ All competency generation templates have been installed successfully!');
  } catch (error) {
    console.error('❌ Error adding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addCompetencyGenerationTemplates()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
