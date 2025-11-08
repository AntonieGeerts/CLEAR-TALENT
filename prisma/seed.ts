import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create SYSTEM_ADMIN (platform super admin)
  const systemAdminPasswordHash = await bcrypt.hash('ClearTalent@2025', 10);
  const systemAdmin = await prisma.user.upsert({
    where: { email: 'sysadmin@cleartalent.io' },
    update: {},
    create: {
      email: 'sysadmin@cleartalent.io',
      passwordHash: systemAdminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SYSTEM_ADMIN',
      tenantId: null, // System admin is not tied to any tenant
      aiOptOut: false,
    },
  });

  console.log('✓ Created system admin:', systemAdmin.email);

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
      onboardingStatus: 'completed',
      isActive: true,
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

  // Create TenantUserMembership records for admin and HR users
  // First, find the system roles (created by seed-access-control script)
  const hrAdminRole = await prisma.role.findFirst({
    where: {
      key: 'HR_ADMIN',
      tenantId: null, // System roles have no tenant
    },
  });

  const tenantOwnerRole = await prisma.role.findFirst({
    where: {
      key: 'TENANT_OWNER',
      tenantId: null,
    },
  });

  // Create membership for admin user (as TENANT_OWNER)
  if (tenantOwnerRole) {
    await prisma.tenantUserMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: demoTenant.id,
          userId: adminUser.id,
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        userId: adminUser.id,
        primaryRoleId: tenantOwnerRole.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });
    console.log('✓ Created membership for admin user');
  }

  // Create membership for HR user (as HR_ADMIN)
  if (hrAdminRole) {
    await prisma.tenantUserMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: demoTenant.id,
          userId: hrUser.id,
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        userId: hrUser.id,
        primaryRoleId: hrAdminRole.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });
    console.log('✓ Created membership for HR user');
  }

  // Create sample competencies (prevent duplicates)
  const competencies = [
    {
      name: 'Communication',
      type: 'CORE' as const,
      description: 'Ability to effectively convey information and ideas to others',
      category: 'Soft Skills',
      tags: ['interpersonal', 'collaboration'],
    },
    {
      name: 'Technical Problem Solving',
      type: 'TECHNICAL' as const,
      description: 'Ability to analyze complex technical problems and develop solutions',
      category: 'Engineering',
      tags: ['engineering', 'problem-solving'],
    },
    {
      name: 'Leadership',
      type: 'LEADERSHIP' as const,
      description: 'Ability to guide, motivate, and develop team members',
      category: 'Leadership',
      tags: ['management', 'people'],
    },
  ];

  for (const comp of competencies) {
    // Check if competency already exists to prevent duplicates
    let competency = await prisma.competency.findFirst({
      where: {
        name: comp.name,
        tenantId: demoTenant.id,
      },
      include: {
        proficiencyLevels: true,
      },
    });

    if (competency) {
      console.log(`✓ Competency already exists: ${competency.name}`);
    } else {
      competency = await prisma.competency.create({
        data: {
          tenantId: demoTenant.id,
          createdBy: adminUser.id,
          ...comp,
        },
        include: {
          proficiencyLevels: true,
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
  }

  // Create default scoring systems for demo tenant
  const scoringSystems = [
    {
      systemId: 'weighted_likert',
      name: 'Weighted Likert Scale',
      description: 'Classic 1-5 rating scale with question and competency weights',
      config: {
        supports_weights: {
          question_weights: true,
          competency_weights: true,
          category_weights: false,
        },
        score_scale: {
          type: 'likert',
          min: 1,
          max: 5,
          labels: {
            '1': 'Strongly Disagree',
            '2': 'Disagree',
            '3': 'Neutral',
            '4': 'Agree',
            '5': 'Strongly Agree',
          },
        },
        input_schema: {
          question_score: 'integer (1-5)',
          question_weight: 'float (0-1)',
          competency_weight: 'float (0-1)',
        },
        calculation: {
          formula: 'weighted_sum / sum_of_weights',
          pseudocode: `
weighted_sum = 0
total_weight = 0

for each question:
  weighted_sum += question_score × question_weight × competency_weight
  total_weight += question_weight × competency_weight

final_score = weighted_sum / total_weight
          `,
        },
        example: {
          inputs: [
            { question_score: 4, question_weight: 0.6, competency_weight: 0.8 },
            { question_score: 5, question_weight: 0.4, competency_weight: 0.8 },
          ],
          output: {
            calculation: '(4×0.6×0.8 + 5×0.4×0.8) / (0.6×0.8 + 0.4×0.8)',
            final_score: 4.4,
          },
        },
        pros: [
          'Simple and widely understood',
          'Flexible weighting at multiple levels',
          'Easy to implement and maintain',
        ],
        cons: [
          'Subject to central tendency bias',
          'Lacks behavioral anchors',
          'May not capture nuanced performance differences',
        ],
        best_for: 'Organizations prioritizing simplicity and familiarity',
      },
    },
    {
      systemId: 'bars',
      name: 'BARS (Behaviorally Anchored Rating Scales)',
      description: 'Rating scale with specific behavioral descriptions for each score level',
      config: {
        supports_weights: {
          question_weights: true,
          competency_weights: true,
          category_weights: false,
        },
        score_scale: {
          type: 'behavioral',
          min: 1,
          max: 5,
          anchors_required: true,
        },
        input_schema: {
          selected_behavior: 'string (behavioral anchor ID)',
          mapped_score: 'integer (1-5)',
          question_weight: 'float (0-1)',
          competency_weight: 'float (0-1)',
        },
        calculation: {
          formula: 'Same as weighted_likert, but score selection is guided by behavioral examples',
          pseudocode: `
# Rater selects the behavioral description that best matches observed behavior
# Each description maps to a specific score

weighted_sum = 0
total_weight = 0

for each question:
  score = map_behavior_to_score(selected_behavior)
  weighted_sum += score × question_weight × competency_weight
  total_weight += question_weight × competency_weight

final_score = weighted_sum / total_weight
          `,
        },
        example: {
          behavioral_anchors: {
            '1': 'Rarely initiates communication; messages are often unclear or incomplete',
            '2': 'Communicates when prompted; messages are generally understandable but lack detail',
            '3': 'Regularly shares information; messages are clear and appropriate for the audience',
            '4': 'Proactively communicates; tailors messages effectively to different stakeholders',
            '5': 'Exemplary communicator; facilitates difficult conversations and drives consensus',
          },
          inputs: [
            {
              selected_behavior: 'anchor_4',
              mapped_score: 4,
              question_weight: 0.7,
              competency_weight: 0.9,
            },
            {
              selected_behavior: 'anchor_5',
              mapped_score: 5,
              question_weight: 0.3,
              competency_weight: 0.9,
            },
          ],
          output: {
            calculation: '(4×0.7×0.9 + 5×0.3×0.9) / (0.7×0.9 + 0.3×0.9)',
            final_score: 4.3,
          },
        },
        pros: [
          'Reduces rater bias through concrete examples',
          'Improves inter-rater reliability',
          'Provides clear performance expectations',
          'More defensible for legal/HR purposes',
        ],
        cons: [
          'Time-consuming to develop quality anchors',
          'Requires periodic review and updates',
          'May not cover all observed behaviors',
        ],
        best_for: 'Organizations valuing objectivity and legal defensibility',
      },
    },
    {
      systemId: 'weighted_rubric',
      name: 'Weighted Rubric Model',
      description: 'Multiple evaluation criteria with individual weights within each competency',
      config: {
        supports_weights: {
          question_weights: true,
          competency_weights: true,
          category_weights: false,
        },
        score_scale: {
          type: 'rubric',
          min: 1,
          max: 5,
          criteria_based: true,
        },
        input_schema: {
          criterion_score: 'integer (1-5)',
          criterion_weight: 'float (normalized within competency)',
          competency_weight: 'float (0-1)',
        },
        calculation: {
          formula: 'Sum of (criterion_score × criterion_weight) across all criteria, then apply competency weight',
          pseudocode: `
# Within each competency
competency_score = 0

for each criterion:
  # Criterion weights are normalized to sum to 1.0 within the competency
  competency_score += criterion_score × criterion_weight

# Across competencies
weighted_sum = 0
total_weight = 0

for each competency:
  weighted_sum += competency_score × competency_weight
  total_weight += competency_weight

final_score = weighted_sum / total_weight
          `,
        },
        example: {
          competency: 'Communication',
          criteria: [
            {
              name: 'Clarity',
              score: 4,
              weight: 0.4,
            },
            {
              name: 'Timeliness',
              score: 5,
              weight: 0.3,
            },
            {
              name: 'Listening Skills',
              score: 3,
              weight: 0.3,
            },
          ],
          competency_weight: 0.8,
          output: {
            competency_score: '4×0.4 + 5×0.3 + 3×0.3 = 4.0',
            weighted_contribution: '4.0 × 0.8 = 3.2',
          },
        },
        pros: [
          'Breaks down complex competencies into measurable parts',
          'Allows different emphasis on different aspects',
          'Transparent scoring logic',
        ],
        cons: [
          'More complex to set up and explain',
          'Requires careful weight calibration',
          'Can become administratively heavy',
        ],
        best_for: 'Organizations with mature performance management systems',
      },
    },
    {
      systemId: 'weighted_category_aggregation',
      name: 'Weighted Category Aggregation',
      description: 'Weights applied at the category level (Core, Leadership, Functional)',
      config: {
        supports_weights: {
          question_weights: true,
          competency_weights: true,
          category_weights: true,
        },
        score_scale: {
          type: 'hierarchical',
          levels: ['question', 'competency', 'category'],
          min: 1,
          max: 5,
        },
        input_schema: {
          question_score: 'integer (1-5)',
          question_weight: 'float (0-1)',
          competency_weight: 'float (0-1)',
          category_weight: 'float (0-1)',
        },
        calculation: {
          formula: 'Hierarchical weighted average: Question → Competency → Category → Overall',
          pseudocode: `
# Level 1: Question to Competency
for each competency:
  weighted_sum = 0
  total_weight = 0
  for each question in competency:
    weighted_sum += question_score × question_weight
    total_weight += question_weight
  competency_score = weighted_sum / total_weight

# Level 2: Competency to Category
for each category:
  weighted_sum = 0
  total_weight = 0
  for each competency in category:
    weighted_sum += competency_score × competency_weight
    total_weight += competency_weight
  category_score = weighted_sum / total_weight

# Level 3: Category to Overall
weighted_sum = 0
total_weight = 0
for each category:
  weighted_sum += category_score × category_weight
  total_weight += category_weight
overall_score = weighted_sum / total_weight
          `,
        },
        example: {
          categories: [
            {
              name: 'Core Competencies',
              weight: 0.4,
              competencies: [
                {
                  name: 'Communication',
                  score: 4.0,
                  weight: 0.6,
                },
                {
                  name: 'Teamwork',
                  score: 4.5,
                  weight: 0.4,
                },
              ],
              category_score: '4.0×0.6 + 4.5×0.4 = 4.2',
            },
            {
              name: 'Leadership',
              weight: 0.35,
              competencies: [
                {
                  name: 'Decision Making',
                  score: 3.5,
                  weight: 0.5,
                },
                {
                  name: 'People Development',
                  score: 4.0,
                  weight: 0.5,
                },
              ],
              category_score: '3.5×0.5 + 4.0×0.5 = 3.75',
            },
            {
              name: 'Functional/Technical',
              weight: 0.25,
              competencies: [
                {
                  name: 'Technical Expertise',
                  score: 4.5,
                  weight: 1.0,
                },
              ],
              category_score: 4.5,
            },
          ],
          output: {
            overall_score: '4.2×0.4 + 3.75×0.35 + 4.5×0.25 = 4.12',
          },
        },
        pros: [
          'Aligns with organizational competency frameworks',
          'Flexible weighting at multiple hierarchical levels',
          'Can adapt to different roles easily',
        ],
        cons: [
          'Most complex scoring model',
          'Requires careful governance of weights',
          'May be harder to explain to employees',
        ],
        best_for: 'Large organizations with structured competency frameworks',
      },
    },
    {
      systemId: 'normalized_0_100',
      name: 'Normalized 0-100 Scoring',
      description: 'Converts any base model to a 0-100 scale for easier interpretation',
      config: {
        supports_weights: {
          question_weights: true,
          competency_weights: true,
          category_weights: true,
        },
        score_scale: {
          type: 'normalized',
          min: 0,
          max: 100,
          base_scale: {
            min: 1,
            max: 5,
          },
        },
        input_schema: {
          base_model_score: 'float (from any other model)',
          min_score: 'integer (typically 1)',
          max_score: 'integer (typically 5)',
        },
        calculation: {
          formula: '((base_score - min) / (max - min)) × 100',
          pseudocode: `
# This is a wrapper around any other scoring model
# Step 1: Calculate score using base model (e.g., weighted_likert)
base_score = calculate_using_base_model()

# Step 2: Normalize to 0-100
min_possible = 1  # or whatever the scale minimum is
max_possible = 5  # or whatever the scale maximum is

normalized_score = ((base_score - min_possible) / (max_possible - min_possible)) × 100
          `,
        },
        example: {
          base_model: 'weighted_likert',
          base_score: 4.2,
          min: 1,
          max: 5,
          output: {
            calculation: '((4.2 - 1) / (5 - 1)) × 100',
            normalized_score: 80,
          },
          interpretation: {
            '0-59': 'Needs Improvement',
            '60-69': 'Developing',
            '70-84': 'Proficient',
            '85-94': 'Advanced',
            '95-100': 'Exceptional',
          },
        },
        pros: [
          'Intuitive percentage-based interpretation',
          'Works with any underlying scoring model',
          'Easier to communicate to employees',
          'Facilitates comparison across different assessment types',
        ],
        cons: [
          'May create false precision',
          'Can amplify small differences',
          'Requires clear performance bands',
        ],
        best_for: 'Organizations wanting simplified, percentage-based scoring',
      },
    },
    {
      systemId: 'bayesian_ai_adjusted',
      name: 'Bayesian/AI-Adjusted Weighting',
      description: 'Machine learning model that dynamically adjusts weights based on performance outcomes',
      config: {
        supports_weights: {
          question_weights: true,
          competency_weights: true,
          category_weights: true,
          dynamic_adjustment: true,
        },
        score_scale: {
          type: 'adaptive',
          min: 1,
          max: 5,
          learns_from: 'performance_outcomes',
        },
        input_schema: {
          base_scores: 'array of competency scores',
          performance_outcome: 'actual job performance metric',
          historical_data: 'past assessments and outcomes',
        },
        calculation: {
          formula: 'Bayesian updating of weights based on correlation with actual performance',
          pseudocode: `
# Initial weights (prior)
weights = default_weights

# For each assessment cycle:
for each employee:
  # Calculate predicted performance using current weights
  predicted_performance = weighted_average(competency_scores, weights)

  # Observe actual performance
  actual_performance = get_performance_outcome(employee)

  # Calculate prediction error
  error = actual_performance - predicted_performance

  # Update weights using Bayesian inference or gradient descent
  for each competency:
    # Increase weight if competency correlates with actual performance
    # Decrease weight if competency doesn't predict performance
    weights[competency] = update_weight(
      current_weight=weights[competency],
      prediction_error=error,
      competency_score=competency_scores[competency],
      learning_rate=0.01
    )

  # Normalize weights to sum to 1.0
  weights = normalize(weights)

# Over time, weights converge to values that best predict actual performance
          `,
        },
        example: {
          initial_weights: {
            'Communication': 0.33,
            'Technical Skills': 0.33,
            'Leadership': 0.33,
          },
          historical_correlations: {
            'Communication': 0.25,
            'Technical Skills': 0.65,
            'Leadership': 0.40,
          },
          adjusted_weights: {
            'Communication': 0.19,
            'Technical Skills': 0.50,
            'Leadership': 0.31,
          },
          rationale: 'Technical Skills show stronger correlation with actual performance, so weight increases',
        },
        pros: [
          'Self-optimizing over time',
          'Data-driven rather than assumption-based',
          'Can surface unexpected predictors of performance',
          'Reduces reliance on manual weight tuning',
        ],
        cons: [
          'Requires significant historical data',
          'Complex to implement and maintain',
          'Black box nature may reduce trust',
          'Risk of overfitting to historical patterns',
          'Requires ongoing performance outcome data',
        ],
        best_for: 'Data-driven organizations with robust HRIS and analytics capabilities',
        requirements: {
          minimum_data: '50+ completed assessments with performance outcomes',
          infrastructure: 'Machine learning pipeline, data warehouse',
          expertise: 'Data science team',
        },
      },
    },
  ];

  // Create scoring systems for demo tenant
  for (const system of scoringSystems) {
    await prisma.scoringSystem.create({
      data: {
        tenantId: demoTenant.id,
        ...system,
      },
    });
    console.log(`✓ Created scoring system: ${system.name}`);
  }

  // Set weighted_likert as the default scoring system
  await prisma.scoringSystem.updateMany({
    where: {
      tenantId: demoTenant.id,
      systemId: 'weighted_likert',
    },
    data: {
      isDefault: true,
    },
  });

  console.log('✓ Set weighted_likert as default scoring system');

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
2. Type (CORE, LEADERSHIP, FUNCTIONAL, or TECHNICAL)
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
    {
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
