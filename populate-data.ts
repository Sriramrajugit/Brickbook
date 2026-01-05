import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function populateData() {
  try {
    console.log('🌱 Populating essential data...')

    // 1. Create Company
    console.log('📝 Creating company...')
    const company = await prisma.company.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: 'Studio Uliixa' }
    })
    console.log('✅ Company:', company.name)

    // 2. Create Site
    console.log('📝 Creating site...')
    const site = await prisma.site.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Main Site',
        location: 'Headquarters',
        companyId: company.id
      }
    })
    console.log('✅ Site:', site.name)

    // 3. Create User (Owner)
    console.log('📝 Creating owner user...')
    const ownerPassword = await bcrypt.hash('owner123', 10)
    const owner = await prisma.user.upsert({
      where: { email: 'owner@example.com' },
      update: { password: ownerPassword },
      create: {
        email: 'owner@example.com',
        name: 'Owner',
        password: ownerPassword,
        role: 'OWNER',
        companyId: company.id,
        siteId: site.id
      }
    })
    console.log('✅ User:', owner.email)

    // 4. Create Account
    console.log('📝 Creating account...')
    const account = await prisma.account.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Main Account',
        type: 'General',
        budget: 100000,
        companyId: company.id,
        siteId: site.id
      }
    })
    console.log('✅ Account:', account.name)

    // 5. Create Categories
    console.log('📝 Creating categories...')
    const categories = [
      { name: 'Salary', companyId: company.id },
      { name: 'Rent', companyId: company.id },
      { name: 'Utilities', companyId: company.id },
      { name: 'Food', companyId: company.id },
      { name: 'Transport', companyId: company.id }
    ]

    for (const cat of categories) {
      await prisma.category.upsert({
        where: { name_companyId: { name: cat.name, companyId: cat.companyId } },
        update: {},
        create: cat
      })
    }
    console.log(`✅ ${categories.length} categories created`)

    // 6. Create Sample Transactions
    console.log('📝 Creating sample transactions...')
    const transactions = [
      {
        amount: 50000,
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'Cash-In',
        date: new Date('2025-12-01'),
        accountId: account.id,
        companyId: company.id,
        siteId: site.id,
        createdBy: owner.id
      },
      {
        amount: 20000,
        description: 'Office Rent',
        category: 'Rent',
        type: 'Cash-Out',
        date: new Date('2025-12-05'),
        accountId: account.id,
        companyId: company.id,
        siteId: site.id,
        createdBy: owner.id
      },
      {
        amount: 5000,
        description: 'Electricity Bill',
        category: 'Utilities',
        type: 'Cash-Out',
        date: new Date('2025-12-10'),
        accountId: account.id,
        companyId: company.id,
        siteId: site.id,
        createdBy: owner.id
      },
      {
        amount: 30000,
        description: 'Freelance Project',
        category: 'Salary',
        type: 'Cash-In',
        date: new Date('2025-12-15'),
        accountId: account.id,
        companyId: company.id,
        siteId: site.id,
        createdBy: owner.id
      },
      {
        amount: 10000,
        description: 'Office Lunch',
        category: 'Food',
        type: 'Cash-Out',
        date: new Date('2025-12-20'),
        accountId: account.id,
        companyId: company.id,
        siteId: site.id,
        createdBy: owner.id
      }
    ]

    for (const tx of transactions) {
      await prisma.transaction.create({ data: tx })
    }
    console.log(`✅ ${transactions.length} transactions created`)

    // 7. Create Employee (for payroll testing)
    console.log('📝 Creating employee...')
    const employee = await prisma.employee.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'John Doe',
        etype: 'Full-time',
        salary: 50000,
        status: 'Active',
        companyId: company.id
      }
    })
    console.log('✅ Employee:', employee.name)

    console.log('\n✅ ✅ ✅ Data population completed successfully! ✅ ✅ ✅')
    console.log('\nYou can now login with:')
    console.log('  Email: owner@example.com')
    console.log('  Password: owner123')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateData()
