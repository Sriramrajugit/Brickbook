import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    // Hash the password "admin"
    const hashedPassword = await bcrypt.hash('admin', 10)
    
    // Update user with ID 1
    const user = await prisma.user.update({
      where: { id: 1 },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Admin password reset successfully!')
    console.log('Username: admin')
    console.log('Password: admin')
    console.log('User ID: 1')
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
