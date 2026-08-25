import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const correctHash = '$2b$10$y0Zjt2S4LH9WWj7Z3jwEcOQLdqQcnAd5Z2DpA797Q4jM0mXzpVSP2';
    
    const user = await prisma.user.update({
      where: { email: 'testuser' },
      data: { password: correctHash }
    });
    
    console.log('✓ Password updated for user:', user.email);
    console.log('✓ Now try logging in with:');
    console.log('  Username: testuser');
    console.log('  Password: test123');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
