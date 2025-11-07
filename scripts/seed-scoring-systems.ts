import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      calculation: {
        formula: 'weighted_sum / sum_of_weights',
      },
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
      },
      best_for: 'Organizations seeking detailed behavioral assessment',
    },
  },
  {
    systemId: 'four_point_scale',
    name: '4-Point Performance Scale',
    description: '4-level scale: Below Expectations, Meets Expectations, Exceeds Expectations, Outstanding',
    config: {
      supports_weights: {
        question_weights: true,
        competency_weights: true,
        category_weights: false,
      },
      score_scale: {
        type: 'performance',
        min: 1,
        max: 4,
        labels: {
          '1': 'Below Expectations',
          '2': 'Meets Expectations',
          '3': 'Exceeds Expectations',
          '4': 'Outstanding',
        },
      },
      best_for: 'Organizations wanting clear performance differentiation',
    },
  },
];

async function main() {
  console.log('🌱 Seeding default scoring systems...\n');

  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${tenants.length} tenant(s)\n`);

  for (const tenant of tenants) {
    console.log(`Processing tenant: ${tenant.name}`);

    for (const system of scoringSystems) {
      // Check if scoring system already exists for this tenant
      const existing = await prisma.scoringSystem.findFirst({
        where: {
          tenantId: tenant.id,
          systemId: system.systemId,
        },
      });

      if (existing) {
        console.log(`  ⏭️  ${system.name} already exists, skipping`);
        continue;
      }

      // Create scoring system
      await prisma.scoringSystem.create({
        data: {
          tenantId: tenant.id,
          ...system,
        },
      });

      console.log(`  ✓ Created scoring system: ${system.name}`);
    }

    // Set weighted_likert as default if no default exists
    const hasDefault = await prisma.scoringSystem.findFirst({
      where: {
        tenantId: tenant.id,
        isDefault: true,
      },
    });

    if (!hasDefault) {
      await prisma.scoringSystem.updateMany({
        where: {
          tenantId: tenant.id,
          systemId: 'weighted_likert',
        },
        data: {
          isDefault: true,
        },
      });
      console.log(`  ✓ Set weighted_likert as default\n`);
    }
  }

  console.log('\n✅ Scoring systems seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding scoring systems:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
