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