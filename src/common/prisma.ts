import { PrismaClient } from '@prisma/client';

// Single Prisma instance for the entire application
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export default prisma;
