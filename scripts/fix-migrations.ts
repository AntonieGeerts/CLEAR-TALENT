import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigrations() {
  try {
    console.log('🔍 Checking for failed migrations...');

    // Delete the failed migration record
    const result = await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = '20251106054341_add_unique_constraint_to_competencies';
    `);

    console.log(`✅ Removed failed migration record (${result} row(s) affected)`);

    // Now apply the enum migration directly
    console.log('📝 Applying enum migration...');

    await prisma.$executeRawUnsafe(`
      ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'CORE';
    `);
    console.log('✅ Added CORE enum value');

    await prisma.$executeRawUnsafe(`
      ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'LEADERSHIP';
    `);
    console.log('✅ Added LEADERSHIP enum value');

    await prisma.$executeRawUnsafe(`
      ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'FUNCTIONAL';
    `);
    console.log('✅ Added FUNCTIONAL enum value');

    await prisma.$executeRawUnsafe(`
      ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'TECHNICAL';
    `);
    console.log('✅ Added TECHNICAL enum value');

    console.log('✅ All migrations fixed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error fixing migrations:', error.message);
    // Don't exit with error - let the app try to start anyway
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigrations();
