import { PrismaClient } from '@prisma/client'

// Use a global variable to ensure a single PrismaClient instance in development
const globalForPrisma = globalThis as any;

export const prisma: PrismaClient =
  globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});