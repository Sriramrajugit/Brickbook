import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:YBOcbuyviYZERpPVwEMNuOsVOIGMFYdo@gondola.proxy.rlwy.net:37719/railway?sslmode=disable'
    }
  }
});

async function verify() {
  try {
    console.log('Checking user data...\n');

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });

    if (!user) {
      console.log('❌ User ID 1 NOT FOUND in database');
    } else {
      console.log('✅ User found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Name:', user.name);
      console.log('  Role:', user.role);
      console.log('  Password hash:', user.password);

      // Test bcrypt
      if (user.password) {
        const match = await bcrypt.compare('admin', user.password);
        console.log('\n✅ Bcrypt verification: password "admin" matches?', match);
      }
    }

    // List all users
    const allUsers = await prisma.user.findMany();
    console.log('\n📋 Total users in database:', allUsers.length);
    allUsers.forEach(u => {
      console.log(`  - ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
