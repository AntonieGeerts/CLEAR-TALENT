import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSystemAdmin() {
  try {
    console.log('Creating system administrator...');

    const passwordHash = await bcrypt.hash('ClearTalent@2025', 10);

    const sysAdmin = await prisma.user.upsert({
      where: { email: 'sysadmin@cleartalent.io' },
      update: {
        role: 'SYSTEM_ADMIN',
        tenantId: null,
      },
      create: {
        email: 'sysadmin@cleartalent.io',
        passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'SYSTEM_ADMIN',
        tenantId: null,
        aiOptOut: false,
      },
    });

    console.log('✓ System admin created/updated:', sysAdmin.email);
    console.log('  Login: sysadmin@cleartalent.io / ClearTalent@2025');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating system admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createSystemAdmin();
