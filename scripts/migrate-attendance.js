import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Migrate "Present" to 1
    await prisma.$executeRaw`UPDATE "public"."attendances" SET status = 1 WHERE status::text = 'Present'`;
    console.log('✓ Migrated Present to 1');

    // Migrate "OT4Hrs" to 1.5
    await prisma.$executeRaw`UPDATE "public"."attendances" SET status = 1.5 WHERE status::text = 'OT4Hrs'`;
    console.log('✓ Migrated OT4Hrs to 1.5');

    // Migrate "OT8Hrs" to 2
    await prisma.$executeRaw`UPDATE "public"."attendances" SET status = 2 WHERE status::text = 'OT8Hrs'`;
    console.log('✓ Migrated OT8Hrs to 2');

    // Migrate "Absent" to 0
    await prisma.$executeRaw`UPDATE "public"."attendances" SET status = 0 WHERE status::text = 'Absent'`;
    console.log('✓ Migrated Absent to 0');

    // Migrate "Half Day" to 0
    await prisma.$executeRaw`UPDATE "public"."attendances" SET status = 0 WHERE status::text = 'Half Day'`;
    console.log('✓ Migrated Half Day to 0');

    // Count total records
    const result = await prisma.$queryRaw`SELECT COUNT(*) as total FROM "public"."attendances"`;
    console.log(`\n✅ Migration complete! Total attendance records: ${result[0]?.total || 0}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
