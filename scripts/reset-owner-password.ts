import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  try {
    const email = 'owner@example.com';
    const newPassword = 'owner123';
    const hash = await bcrypt.hash(newPassword, 10);

    console.log('Attempting to update password for:', email);
    const user = await prisma.user.updateMany({
      where: { email },
      data: { password: hash },
    });

    console.log('UpdateMany result:', user);
    if (user.count > 0) {
      console.log(`Password for ${email} has been reset to '${newPassword}'.`);
    } else {
      console.log(`User with email ${email} not found.`);
    }
    await prisma.$disconnect();
    console.log('Script completed.');
    process.stdout.write(''); // Force flush
  } catch (err) {
    console.error('Error in resetPassword:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetPassword().catch(e => {
  console.error(e);
  process.exit(1);
});
