import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixUsers() {
  try {
    // Generate proper bcrypt hash for test123
    console.log('🔐 Generating bcrypt hash for "test123"...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    console.log(`✅ Generated hash: ${hashedPassword}\n`);

    // Update both users
    console.log('📝 Updating users...\n');

    const user1 = await prisma.user.update({
      where: { id: 1 },
      data: { password: hashedPassword }
    });
    console.log(`✅ Updated User 1: ${user1.email}`);

    const user2 = await prisma.user.update({
      where: { id: 2 },
      data: { password: hashedPassword }
    });
    console.log(`✅ Updated User 2: ${user2.email}\n`);

    // Verify the update
    console.log('🔍 Verifying passwords...\n');
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true
      }
    });

    for (const user of allUsers) {
      const isValid = await bcrypt.compare('test123', user.password);
      console.log(`${isValid ? '✅' : '❌'} ${user.email}: Password ${isValid ? 'VALID' : 'INVALID'}`);
    }

    console.log('\n🎉 All users updated successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Option 1: testuser / test123');
    console.log('   Option 2: admin@studio.com / test123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsers();
