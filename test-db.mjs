import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const result = await prisma.$queryRaw`SELECT 1`
  console.log('✓ Database connection successful')
  process.exit(0)
} catch (error) {
  console.error('✗ Database connection failed:', error.message)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
