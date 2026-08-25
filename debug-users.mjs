import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugUsers() {
  try {
    console.log('🔍 Fetching all users from database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        companyId: true,
        role: true,
        status: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    console.log(`📊 Total Users: ${users.length}\n`);

    for (const user of users) {
      console.log(`─────────────────────────────────`);
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'N/A'}`);
      console.log(`Company ID: ${user.companyId || 'MISSING'}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status || 'active'}`);
      console.log(`Password Hash: ${user.password ? '✅ SET' : '❌ NOT SET'}`);

      // Test bcrypt verification with both passwords
      if (user.password) {
        try {
          const isAdmin = await bcrypt.compare('admin', user.password);
          const isTest123 = await bcrypt.compare('test123', user.password);

          if (isAdmin) console.log(`✅ Password matches: "admin"`);
          if (isTest123) console.log(`✅ Password matches: "test123"`);
          if (!isAdmin && !isTest123) console.log(`❌ Password doesn't match "admin" or "test123"`);
        } catch (err) {
          console.log(`❌ Error verifying password:`, err);
        }
      }
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers();
