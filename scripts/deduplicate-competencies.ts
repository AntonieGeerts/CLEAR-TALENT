import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to deduplicate competencies before applying unique constraint
 * This script keeps the oldest competency for each (name, tenantId) pair
 */
async function deduplicateCompetencies() {
  console.log('🔍 Searching for duplicate competencies...');

  try {
    // Find all duplicates
    const duplicates = await prisma.$queryRaw<Array<{
      name: string;
      tenant_id: string;
      count: bigint;
    }>>`
      SELECT name, tenant_id, COUNT(*) as count
      FROM competencies
      GROUP BY name, tenant_id
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length === 0) {
      console.log('✓ No duplicate competencies found!');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} sets of duplicate competencies`);

    let totalRemoved = 0;

    // Process each set of duplicates
    for (const dup of duplicates) {
      const { name, tenant_id } = dup;
      const count = Number(dup.count);

      console.log(`\n  Processing: "${name}" (${count} duplicates)`);

      // Get all competencies with this name and tenant
      const competencies = await prisma.competency.findMany({
        where: {
          name,
          tenantId: tenant_id,
        },
        orderBy: {
          createdAt: 'asc', // Keep the oldest one
        },
        include: {
          proficiencyLevels: true,
          behavioralIndicators: true,
          roleCompetencies: true,
          skillProfiles: true,
        },
      });

      // Keep the first (oldest) one
      const toKeep = competencies[0];
      const toDelete = competencies.slice(1);

      console.log(`    ✓ Keeping competency: ${toKeep.id} (created: ${toKeep.createdAt})`);

      // Update references for each duplicate before deleting
      for (const duplicate of toDelete) {
        console.log(`    → Processing duplicate: ${duplicate.id}`);

        // Update RoleCompetency references
        if (duplicate.roleCompetencies.length > 0) {
          await prisma.roleCompetency.updateMany({
            where: { competencyId: duplicate.id },
            data: { competencyId: toKeep.id },
          });
          console.log(`      ✓ Updated ${duplicate.roleCompetencies.length} role competency references`);
        }

        // Update SkillProfile references
        if (duplicate.skillProfiles.length > 0) {
          await prisma.skillProfile.updateMany({
            where: { competencyId: duplicate.id },
            data: { competencyId: toKeep.id },
          });
          console.log(`      ✓ Updated ${duplicate.skillProfiles.length} skill profile references`);
        }

        // Delete proficiency levels (cascade will handle behavioral indicators)
        if (duplicate.proficiencyLevels.length > 0) {
          await prisma.proficiencyLevel.deleteMany({
            where: { competencyId: duplicate.id },
          });
          console.log(`      ✓ Deleted ${duplicate.proficiencyLevels.length} proficiency levels`);
        }

        // Delete the duplicate competency
        await prisma.competency.delete({
          where: { id: duplicate.id },
        });
        console.log(`      ✓ Deleted duplicate competency: ${duplicate.id}`);

        totalRemoved++;
      }
    }

    console.log(`\n✅ Successfully removed ${totalRemoved} duplicate competencies!`);
    console.log('   You can now safely apply the unique constraint migration.');

  } catch (error) {
    console.error('❌ Error deduplicating competencies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deduplicateCompetencies()
  .then(() => {
    console.log('\n🎉 Deduplication complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deduplication failed:', error);
    process.exit(1);
  });
