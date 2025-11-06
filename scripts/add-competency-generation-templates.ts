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
        promptType: 'generate-competencies',
        version: 2,
      },
      create: {
        name: 'generate-by-category',
        module: 'COMPETENCY',
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
        promptType: 'generate-competencies',
        version: 2,
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
