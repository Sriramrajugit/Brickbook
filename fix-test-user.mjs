import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTestUser() {
  try {
    // Get the company that owner@example.com belongs to
    const ownerUser = await prisma.user.findUnique({
      where: { email: 'owner@example.com' },
      select: { companyId: true }
    });

    if (!ownerUser) {
      console.log('⚠ owner@example.com not found');
      return;
    }

    // Update testuser to be in the same company as owner
    const updatedUser = await prisma.user.update({
      where: { email: 'testuser' },
      data: {
        companyId: ownerUser.companyId,
        role: 'OWNER'
      }
    });

    console.log('✓ testuser updated successfully!');
    console.log(`  Company ID: ${updatedUser.companyId}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log('  Now testuser has access to all company data');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestUser();
