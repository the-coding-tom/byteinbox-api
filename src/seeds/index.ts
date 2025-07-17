import { PrismaClient } from '@prisma/client';

import { seedEmailTemplates } from './email-templates.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database seeding...');

  try {
    // Seed email templates directly with Prisma client
    await seedEmailTemplates(prisma);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
