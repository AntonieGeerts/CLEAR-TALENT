import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      settings: {
        ai_enabled: true,
        data_residency: 'US',
        language: 'en',
        custom_prompts: {},
      },
    },
  });

  console.log('✓ Created demo tenant:', demoTenant.name);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo-org.com' },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@demo-org.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'IT',
      position: 'System Administrator',
      aiOptOut: false,
    },
  });

  console.log('✓ Created admin user:', adminUser.email);

  // Create HR Manager
  const hrPasswordHash = await bcrypt.hash('hr123', 10);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@demo-org.com' },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'hr@demo-org.com',
      passwordHash: hrPasswordHash,
      firstName: 'HR',
      lastName: 'Manager',
      role: 'HR_MANAGER',
      department: 'Human Resources',
      position: 'HR Manager',
      aiOptOut: false,
    },
  });

  console.log('✓ Created HR manager:', hrUser.email);

  // Create sample competencies
  const competencies = [
    {
      name: 'Communication',
      type: 'BEHAVIORAL',
      description: 'Ability to effectively convey information and ideas to others',
      category: 'Soft Skills',
      tags: ['interpersonal', 'collaboration'],
    },
    {
      name: 'Technical Problem Solving',
      type: 'TECHNICAL',
      description: 'Ability to analyze complex technical problems and develop solutions',
      category: 'Engineering',
      tags: ['engineering', 'problem-solving'],
    },
    {
      name: 'Leadership',
      type: 'LEADERSHIP',
      description: 'Ability to guide, motivate, and develop team members',
      category: 'Leadership',
      tags: ['management', 'people'],
    },
  ];

  for (const comp of competencies) {
    const competency = await prisma.competency.create({
      data: {
        tenantId: demoTenant.id,
        createdBy: adminUser.id,
        ...comp,
      },
    });

    console.log(`✓ Created competency: ${competency.name}`);

    // Create proficiency levels for each competency
    const levels = [
      { name: 'Basic', numericLevel: 1, description: 'Foundational understanding', sortOrder: 1 },
      { name: 'Intermediate', numericLevel: 2, description: 'Working knowledge with guidance', sortOrder: 2 },
      { name: 'Advanced', numericLevel: 3, description: 'Independent practitioner', sortOrder: 3 },
      { name: 'Expert', numericLevel: 4, description: 'Deep expertise, can mentor others', sortOrder: 4 },
      { name: 'Master', numericLevel: 5, description: 'Industry leader, drives innovation', sortOrder: 5 },
    ];

    for (const level of levels) {
      await prisma.proficiencyLevel.create({
        data: {
          competencyId: competency.id,
          ...level,
        },
      });
    }

    console.log(`  ✓ Created ${levels.length} proficiency levels for ${competency.name}`);
  }

  // Create AI prompt templates
  const promptTemplates = [
    {
      name: 'Suggest Competencies from JD',
      module: 'COMPETENCY',
      promptType: 'suggest-from-jd',
      template: `Analyze the following job description and suggest relevant competencies.

Job Title: {{roleTitle}}
Department: {{department}}
Job Description:
{{jobDescription}}

Please identify 5-8 key competencies required for this role. For each competency, provide:
1. Name (concise, 2-4 words)
2. Type (TECHNICAL, BEHAVIORAL, LEADERSHIP, or FUNCTIONAL)
3. Category (e.g., "Engineering", "Communication", "Management")
4. Description (1-2 sentences explaining what this competency means in this context)

Return the response as a JSON array.`,
      variables: ['roleTitle', 'department', 'jobDescription'],
      version: 1,
      isActive: true,
    },
    {
      name: 'Generate Behavioral Indicators',
      module: 'COMPETENCY',
      promptType: 'generate-indicators',
      template: `Generate behavioral indicators for the following competency and proficiency level.

Competency: {{competencyName}}
Type: {{competencyType}}
Description: {{competencyDescription}}
Proficiency Level: {{levelName}} (Level {{numericLevel}}/5)
Level Description: {{levelDescription}}

Generate {{count}} specific, observable behavioral indicators that demonstrate this competency at this level.
Each indicator should:
- Be specific and measurable
- Start with an action verb
- Be clear and unambiguous
- Be appropriate for the proficiency level

Return the response as a JSON array of objects with "description" and "examples" fields.`,
      variables: ['competencyName', 'competencyType', 'competencyDescription', 'levelName', 'numericLevel', 'levelDescription', 'count'],
      version: 1,
      isActive: true,
    },
    {
      name: 'Improve Review Text',
      module: 'REVIEW',
      promptType: 'improve-text',
      template: `Improve the following performance review feedback to make it more {{style}}.

Original feedback:
{{text}}

Context: {{context}}

Rewrite the feedback to be:
- More specific and concrete
- Include observable behaviors
- Be constructive and actionable
- Maintain a professional tone

Return only the improved text without any preamble or explanation.`,
      variables: ['text', 'context', 'style'],
      version: 1,
      isActive: true,
    },
    {
      name: 'Summarize Text',
      module: 'REVIEW',
      promptType: 'summarize',
      template: `Summarize the following text in approximately {{maxLength}} characters or less.

Text to summarize:
{{text}}

Provide a concise summary that captures the key points. Return only the summary without any preamble.`,
      variables: ['text', 'maxLength'],
      version: 1,
      isActive: true,
    },
  ];

  for (const template of promptTemplates) {
    await prisma.aIPromptTemplate.create({
      data: {
        ...template,
        variables: template.variables,
      },
    });
    console.log(`✓ Created prompt template: ${template.name}`);
  }

  // Create a sample role profile
  const seniorEngRole = await prisma.roleProfile.create({
    data: {
      tenantId: demoTenant.id,
      title: 'Senior Software Engineer',
      department: 'Engineering',
      seniority: 'SENIOR',
      description: 'Experienced software engineer responsible for designing and implementing complex systems',
      createdBy: hrUser.id,
    },
  });

  console.log('✓ Created role profile:', seniorEngRole.title);

  // Link competencies to role
  const techComp = await prisma.competency.findFirst({
    where: { name: 'Technical Problem Solving' },
  });

  if (techComp) {
    const advancedLevel = await prisma.proficiencyLevel.findFirst({
      where: { competencyId: techComp.id, numericLevel: 3 },
    });

    if (advancedLevel) {
      await prisma.roleCompetency.create({
        data: {
          roleProfileId: seniorEngRole.id,
          competencyId: techComp.id,
          requiredLevel: advancedLevel.id,
          isMandatory: true,
        },
      });
      console.log('✓ Linked competency to role profile');
    }
  }

  console.log('\n✓ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
