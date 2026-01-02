import { PrismaClient } from '@prisma/client'

// Log connection details
console.log('🔍 Prisma initialization:')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 60)}...` : 'NOT SET')
console.log('DIRECT_URL:', process.env.DIRECT_URL ? `${process.env.DIRECT_URL.substring(0, 60)}...` : 'NOT SET')
console.log('NODE_ENV:', process.env.NODE_ENV)

// Use a global variable to ensure a single PrismaClient instance in development
const globalForPrisma = globalThis as any;

export const prisma: PrismaClient =
  globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty'
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