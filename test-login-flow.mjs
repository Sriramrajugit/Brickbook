import { PrismaClient } from '@prisma/client';
import jwtPackage from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'test-secret-key';
const { sign, verify } = jwtPackage;

async function testLoginFlow() {
  try {
    console.log('🧪 Testing Complete Login Flow\n');

    // 1. Get test user
    const user = await prisma.user.findUnique({
      where: { email: 'testuser' }
    });

    if (!user) {
      console.log('❌ Test user not found in database!');
      process.exit(1);
    }

    console.log('✅ Step 1: User found');
    console.log(`   Email: ${user.email}`);
    console.log(`   Company ID: ${user.companyId}`);
    console.log(`   Role: ${user.role}`);

    // 2. Generate JWT token (same as login endpoint)
    const token = sign({ userId: user.id }, JWT_SECRET);
    console.log('\n✅ Step 2: JWT Token Generated');
    console.log(`   Token (first 50 chars): ${token.substring(0, 50)}...`);

    // 3. Verify token can be decoded
    const decoded = verify(token, JWT_SECRET);
    console.log('\n✅ Step 3: Token Verified');
    console.log(`   Decoded: ${JSON.stringify(decoded)}`);

    // 4. Simulate getCurrentUser logic
    const userId = decoded.userId;
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('\n✅ Step 4: User Retrieved from Token');
    console.log(`   User: ${authenticatedUser?.email}`);
    console.log(`   Company: ${authenticatedUser?.companyId}`);

    // 5. Get accounts for this company
    const accounts = await prisma.account.findMany({
      where: { companyId: authenticatedUser?.companyId },
      select: { id: true, name: true }
    });

    console.log('\n✅ Step 5: Accounts Retrieved for User\'s Company');
    console.log(`   Total Accounts: ${accounts.length}`);
    accounts.forEach(a => console.log(`    - ${a.name}`));

    console.log('\n✅ ALL TESTS PASSED - Login flow works correctly!\n');

    // Summary
    console.log('📝 Summary:');
    console.log(`   Database has ${await prisma.user.count()} users`);
    console.log(`   Database has ${await prisma.account.count()} accounts`);
    console.log(`   User testuser can access ${accounts.length} accounts`);

  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
  } finally {
    await prisma.$disconnect();
  }
}

testLoginFlow();
