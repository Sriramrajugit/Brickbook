import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, package: true },
      where: { id: { not: 1 } },
      orderBy: { name: 'asc' }
    })
    
    console.log('\n=== EXISTING CUSTOMERS ===')
    if (companies.length === 0) {
      console.log('No customers found (only Brickbook.in admin)')
    } else {
      companies.forEach(c => {
        console.log(`${c.name}: ${c.package}`)
      })
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
