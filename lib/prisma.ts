import { PrismaClient } from '@prisma/client'

// Use a global variable to ensure a single PrismaClient instance in development
const globalForPrisma = globalThis as any;

export const prisma: PrismaClient =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}