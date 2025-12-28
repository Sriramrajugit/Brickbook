import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create sites
  const site1 = await prisma.site.upsert({
    where: { id: 1 },
    update: { name: 'Main Office', location: 'Headquarters' },
    create: {
      id: 1,
      name: 'Main Office',
      location: 'Headquarters',
    },
  })

  const site2 = await prisma.site.upsert({
    where: { id: 2 },
    update: { name: 'Site A', location: 'Location A' },
    create: {
      id: 2,
      name: 'Site A',
      location: 'Location A',
    },
  })

  const site3 = await prisma.site.upsert({
    where: { id: 3 },
    update: { name: 'Site B', location: 'Location B' },
    create: {
      id: 3,
      name: 'Site B',
      location: 'Location B',
    },
  })

  console.log('Sites created:', [site1, site2, site3])

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
        role: UserRole.OWNER,
        siteId: null,
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
          role: UserRole.OWNER,
          siteId: null,
        }
      })
    } else {
      owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Owner',
          password: ownerPassword,
          role: UserRole.OWNER,
          siteId: null,
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
      role: UserRole.SITE_MANAGER,
      siteId: site2.id,
    },
    create: {
      email: 'manager.a@example.com',
      name: 'Manager Site A',
      password: managerPassword,
      role: UserRole.SITE_MANAGER,
      siteId: site2.id,
    },
  })

  // Create Site Manager for Site B (password: 'manager123')
  const managerB = await prisma.user.upsert({
    where: { email: 'manager.b@example.com' },
    update: {
      name: 'Manager Site B',
      password: managerPassword,
      role: UserRole.SITE_MANAGER,
      siteId: site3.id,
    },
    create: {
      email: 'manager.b@example.com',
      name: 'Manager Site B',
      password: managerPassword,
      role: UserRole.SITE_MANAGER,
      siteId: site3.id,
    },
  })

  // Create Guest user (password: 'guest123')
  const guestPassword = await bcrypt.hash('guest123', 10)
  const guest = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {
      name: 'Guest User',
      password: guestPassword,
      role: UserRole.GUEST,
      siteId: null,
    },
    create: {
      email: 'guest@example.com',
      name: 'Guest User',
      password: guestPassword,
      role: UserRole.GUEST,
      siteId: null,
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
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
        description: null
      }
    })
  }

  console.log(`${categories.length} categories created/updated`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })