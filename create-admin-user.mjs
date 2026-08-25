import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('admin', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      companyId: 1,
      role: 'OWNER',
    },
  });

  console.log('User created/updated:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
