import { PrismaClient } from '@prisma/client'

// Log connection details only if DATABASE_URL is set
if (process.env.DATABASE_URL) {
  console.log('🔍 Prisma initialization:')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 60)}...` : 'NOT SET')
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? `${process.env.DIRECT_URL.substring(0, 60)}...` : 'NOT SET')
  console.log('NODE_ENV:', process.env.NODE_ENV)
}

// Use a global variable to ensure a single PrismaClient instance in development
const globalForPrisma = globalThis as any;

// Lazy initialize Prisma only when DATABASE_URL is available
let prismaInstance: PrismaClient | null = null;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!prismaInstance && process.env.DATABASE_URL) {
      prismaInstance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn']
          : ['error'],
        errorFormat: 'pretty',
        omit: ['password'] // Omit sensitive fields from logs
      });

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prismaInstance;
      }
    }
    
    if (!prismaInstance) {
      throw new Error('DATABASE_URL is not set');
    }

    return (prismaInstance as any)[prop];
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
  }
  process.exit(0);
});