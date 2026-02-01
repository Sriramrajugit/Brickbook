import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Type for UserRole to avoid importing from Prisma
type UserRole = 'OWNER' | 'SITE_MANAGER' | 'GUEST'

async function main() {
  console.log('🌱 Starting database seed...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  // Create company
  console.log('📝 Creating company...')
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: { name: 'Demo Company' },
    create: { id: 1, name: 'Demo Company' },
  });

  // Create sites linked to company
  const site1 = await prisma.site.upsert({
    where: { id: 1 },
    update: { name: 'Main Office', location: 'Headquarters', companyId: company.id },
    create: {
      id: 1,
      name: 'Main Office',
      location: 'Headquarters',
      companyId: company.id,
    },
  })

  const site2 = await prisma.site.upsert({
    where: { id: 2 },
    update: { name: 'Site A', location: 'Location A', companyId: company.id },
    create: {
      id: 2,
      name: 'Site A',
      location: 'Location A',
      companyId: company.id,
    },
  })

  const site3 = await prisma.site.upsert({
    where: { id: 3 },
    update: { name: 'Site B', location: 'Location B', companyId: company.id },
    create: {
      id: 3,
      name: 'Site B',
      location: 'Location B',
      companyId: company.id,
    },
  })

  console.log('Company and Sites created:', company, [site1, site2, site3])

  // Update or create Owner user (password: 'owner123')
  const ownerPassword = await bcrypt.hash('owner123', 10)
  
  // Check if owner user exists
  const existingOwner = await prisma.user.findUnique({
    where: { email: 'owner@example.com' }
  })
  
  let owner
  if (existingOwner) {
    owner = await prisma.user.update({
      where: { id: existingOwner.id },
      data: {
        name: 'Owner',
        password: ownerPassword,
        role: 'OWNER',
        siteId: null,
        companyId: company.id,
      }
    })
  } else {
    // Check if old admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (existingAdmin) {
      owner = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: 'owner@example.com',
          name: 'Owner',
          password: ownerPassword,
          role: 'OWNER',
          siteId: null,
          companyId: company.id,
        }
      })
    } else {
      owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Owner',
          password: ownerPassword,
          role: 'OWNER',
          siteId: null,
          companyId: company.id,
        }
      })
    }
  }

  // Create Site Manager for Site A (password: 'manager123')
  const managerPassword = await bcrypt.hash('manager123', 10)
  const managerA = await prisma.user.upsert({
    where: { email: 'manager.a@example.com' },
    update: {
      name: 'Manager Site A',
      password: managerPassword,
      role: 'SITE_MANAGER',
      siteId: site2.id,
      companyId: company.id,
    },
    create: {
      email: 'manager.a@example.com',
      name: 'Manager Site A',
      password: managerPassword,
      role: 'SITE_MANAGER',
      siteId: site2.id,
      companyId: company.id,
    },
  })

  // Create Site Manager for Site B (password: 'manager123')
  const managerB = await prisma.user.upsert({
    where: { email: 'manager.b@example.com' },
    update: {
      name: 'Manager Site B',
      password: managerPassword,
      role: 'SITE_MANAGER',
      siteId: site3.id,
      companyId: company.id,
    },
    create: {
      email: 'manager.b@example.com',
      name: 'Manager Site B',
      password: managerPassword,
      role: 'SITE_MANAGER',
      siteId: site3.id,
      companyId: company.id,
    },
  })

  // Create Guest user (password: 'guest123')
  const guestPassword = await bcrypt.hash('guest123', 10)
  const guest = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {
      name: 'Guest User',
      password: guestPassword,
      role: 'GUEST',
      siteId: null,
      companyId: company.id,
    },
    create: {
      email: 'guest@example.com',
      name: 'Guest User',
      password: guestPassword,
      role: 'GUEST',
      siteId: null,
      companyId: company.id,
    },
  })

  console.log('Users created:')
  console.log('Owner:', owner)
  console.log('Manager A:', managerA)
  console.log('Manager B:', managerB)
  console.log('Guest:', guest)

  // Create Categories
  const categories = [
    'Borewell',
    'Capital',
    'Category',
    'Civil work',
    'EB service',
    'Electrical',
    'Material cost',
    'Miscellaneous Exp',
    'Plot cost',
    'Plumbing',
    'Pre-Construction expenses',
    'Salary',
    'Salary Advance',
    'Tea / Food',
    'Transport'
  ]

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name_companyId: { name: categoryName, companyId: company.id } },
      update: { companyId: company.id },
      create: {
        name: categoryName,
        description: null,
        companyId: company.id,
      }
    })
  }

  console.log(`${categories.length} categories created/updated`)

  // Create Accounts
  const account1 = await prisma.account.upsert({
    where: { id: 1 },
    update: { name: 'Main Account', type: 'General', budget: 500000, companyId: company.id },
    create: {
      id: 1,
      name: 'Main Account',
      type: 'General',
      budget: 500000,
      companyId: company.id,
      siteId: site1.id,
    },
  })

  const account2 = await prisma.account.upsert({
    where: { id: 2 },
    update: { name: 'Site A Account', type: 'Project', budget: 300000, companyId: company.id },
    create: {
      id: 2,
      name: 'Site A Account',
      type: 'Project',
      budget: 300000,
      companyId: company.id,
      siteId: site2.id,
    },
  })

  console.log('2 accounts created/updated')

  // Create Employees
  const emp1 = await prisma.employee.upsert({
    where: { id: 1 },
    update: { name: 'John Doe', etype: 'Labour', salary: 15000, companyId: company.id },
    create: {
      id: 1,
      name: 'John Doe',
      etype: 'Labour',
      salary: 15000,
      status: 'Active',
      companyId: company.id,
    },
  })

  const emp2 = await prisma.employee.upsert({
    where: { id: 2 },
    update: { name: 'Jane Smith', etype: 'Supervisor', salary: 25000, companyId: company.id },
    create: {
      id: 2,
      name: 'Jane Smith',
      etype: 'Supervisor',
      salary: 25000,
      status: 'Active',
      companyId: company.id,
    },
  })

  console.log('2 employees created/updated')

  // Create Sample Transactions
  const txnCategory = await prisma.category.findFirst({
    where: { name: 'Material cost', companyId: company.id },
  })

  const salaryCategory = await prisma.category.findFirst({
    where: { name: 'Salary', companyId: company.id },
  })

  if (txnCategory) {
    await prisma.transaction.upsert({
      where: { id: 1 },
      update: {
        amount: 50000,
        description: 'Purchase of materials',
        category: 'Material cost',
        type: 'Cash-Out',
        date: new Date('2026-01-10'),
      },
      create: {
        id: 1,
        amount: 50000,
        description: 'Purchase of materials',
        category: 'Material cost',
        categoryId: txnCategory.id,
        type: 'Cash-Out',
        paymentMode: 'Bank Transfer',
        date: new Date('2026-01-10'),
        accountId: account1.id,
        createdBy: owner.id,
        companyId: company.id,
        siteId: site1.id,
      },
    })
  }

  if (salaryCategory) {
    await prisma.transaction.upsert({
      where: { id: 2 },
      update: {
        amount: 15000,
        description: 'Salary payment',
        category: 'Salary',
        type: 'Cash-Out',
        date: new Date('2026-01-13'),
      },
      create: {
        id: 2,
        amount: 15000,
        description: 'Salary payment',
        category: 'Salary',
        categoryId: salaryCategory.id,
        type: 'Cash-Out',
        paymentMode: 'G-Pay',
        date: new Date('2026-01-13'),
        accountId: account1.id,
        createdBy: owner.id,
        companyId: company.id,
        siteId: site1.id,
      },
    })
  }

  console.log('2 transactions created/updated')

  // Create Sample Attendance Records
  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: emp1.id, date: new Date('2026-01-13') } },
    update: { status: 1.0 },
    create: {
      employeeId: emp1.id,
      date: new Date('2026-01-13'),
      status: 1.0,
      companyId: company.id,
    },
  })

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: emp2.id, date: new Date('2026-01-13') } },
    update: { status: 1.0 },
    create: {
      employeeId: emp2.id,
      date: new Date('2026-01-13'),
      status: 1.0,
      companyId: company.id,
    },
  })

  console.log('2 attendance records created/updated')

  // Create Sample Payroll
  await prisma.payroll.upsert({
    where: { id: 1 },
    update: {
      amount: 15000,
      fromDate: new Date('2026-01-01'),
      toDate: new Date('2026-01-13'),
    },
    create: {
      id: 1,
      employeeId: emp1.id,
      amount: 15000,
      accountId: account1.id,
      fromDate: new Date('2026-01-01'),
      toDate: new Date('2026-01-13'),
      remarks: 'January payroll',
      companyId: company.id,
    },
  })

  console.log('1 payroll record created/updated')

  // Create Sample Advance
  await prisma.advance.upsert({
    where: { id: 1 },
    update: {
      amount: 5000,
      date: new Date('2026-01-08'),
      reason: 'Emergency advance',
    },
    create: {
      id: 1,
      employeeId: emp1.id,
      amount: 5000,
      date: new Date('2026-01-08'),
      reason: 'Emergency advance',
      companyId: company.id,
    },
  })

  console.log('1 advance record created/updated')
  
  console.log('✅ Database seeding completed successfully!')
  console.log('Users created:')
  console.log('  - owner@example.com / owner123')
  console.log('  - manager.a@example.com / manager123')
  console.log('  - manager.b@example.com / manager123')
  console.log('  - guest@example.com / guest123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })