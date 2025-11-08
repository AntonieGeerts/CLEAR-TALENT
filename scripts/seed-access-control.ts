import { PrismaClient } from '@prisma/client';
import { seedAccessControl } from '../src/lib/access-control-bootstrap';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting access control seed...\n');
  await seedAccessControl(prisma, message => console.log(` - ${message}`));
  console.log('\n✅ Access control seed completed');
}

main()
  .catch(error => {
    console.error('❌ Access control seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
