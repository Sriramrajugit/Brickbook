import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function onboardCustomer(
  companyName: string,
  ownerEmail: string,
  ownerName: string,
  ownerPassword: string
) {
  try {
    console.log(`\n🚀 Onboarding customer: ${companyName}`)

    // 1. Create Company
    console.log('📝 Step 1: Creating company...')
    const company = await prisma.company.create({
      data: { name: companyName }
    })
    console.log(`✅ Company created with ID: ${company.id}`)

    // 2. Create Main Site
    console.log('📝 Step 2: Creating site...')
    const site = await prisma.site.create({
      data: {
        name: 'Main Office',
        location: 'Headquarters',
        companyId: company.id
      }
    })
    console.log(`✅ Site created with ID: ${site.id}`)

    // 3. Create Owner User
    console.log('📝 Step 3: Creating owner user...')
    const hashedPassword = await bcrypt.hash(ownerPassword, 10)
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        name: ownerName,
        password: hashedPassword,
        role: 'OWNER',
        companyId: company.id,
        siteId: null
      }
    })
    console.log(`✅ Owner user created: ${owner.email}`)

    // 4. Create Main Account
    console.log('📝 Step 4: Creating main account...')
    const account = await prisma.account.create({
      data: {
        name: 'Main Account',
        type: 'General',
        budget: 100000,
        companyId: company.id,
        siteId: site.id
      }
    })
    console.log(`✅ Main account created with ID: ${account.id}`)

    // 5. Create Default Categories
    console.log('📝 Step 5: Creating default categories...')
    const categories = [
      { name: 'Capital', description: 'Initial capital and investments' },
      { name: 'Salary', description: 'Employee salary payments' },
      { name: 'Salary Advance', description: 'Salary advance to employees' },
      { name: 'Rent', description: 'Rent and lease payments' },
      { name: 'Utilities', description: 'Electricity, water, internet' },
      { name: 'Transport', description: 'Transportation and fuel costs' },
      { name: 'Food & Tea', description: 'Office food and beverages' },
      { name: 'Repairs', description: 'Maintenance and repairs' },
      { name: 'Supplies', description: 'Office and supply purchases' },
      { name: 'Other', description: 'Miscellaneous expenses' }
    ]

    for (const cat of categories) {
      await prisma.category.upsert({
        where: {
          name_companyId: { name: cat.name, companyId: company.id }
        },
        update: {},
        create: {
          name: cat.name,
          description: cat.description,
          companyId: company.id
        }
      })
    }
    console.log(`✅ ${categories.length} categories created`)

    console.log('\n🎉 Onboarding complete!')
    console.log('\n📋 New Customer Details:')
    console.log(`  Company ID: ${company.id}`)
    console.log(`  Company: ${company.name}`)
    console.log(`  Site ID: ${site.id}`)
    console.log(`  Owner Email: ${owner.email}`)
    console.log(`  Owner ID: ${owner.id}`)
    console.log(`  Account ID: ${account.id}`)
    console.log(`\n🔐 Login Credentials:`)
    console.log(`  Email: ${owner.email}`)
    console.log(`  Password: ${ownerPassword}`)
    console.log('\n')

  } catch (error) {
    console.error('❌ Onboarding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute with your customer details
onboardCustomer(
  'ABC Corporation',           // Company Name
  'owner@abccorp.com',        // Owner Email
  'ABC Owner',                // Owner Name
  'secure@password123'        // Owner Password
)
