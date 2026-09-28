import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Update all customers (excluding Brickbook.in with id=1) to STRUCTURE package
    const result = await prisma.company.updateMany({
      where: { id: { not: 1 } },
      data: { package: 'STRUCTURE' }
    })
    
    console.log('\n=== PACKAGE UPDATE COMPLETED ===')
    console.log(`Updated ${result.count} customer(s) to STRUCTURE package`)
    
    // Show updated packages
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, package: true },
      where: { id: { not: 1 } },
      orderBy: { name: 'asc' }
    })
    
    console.log('\n=== UPDATED CUSTOMERS ===')
    companies.forEach(c => {
      console.log(`✅ ${c.name}: ${c.package}`)
    })
    
    console.log('\n=== AVAILABLE MODULES (STRUCTURE) ===')
    console.log('✅ Dashboard')
    console.log('✅ Transactions')
    console.log('✅ Attendance')
    console.log('✅ Payroll')
    console.log('✅ Reports')
    console.log('✅ Accounts')
    console.log('✅ Categories')
    console.log('✅ Employees & Partners')
    console.log('✅ Users')
    console.log('✅ Bills & Invoices (NEW)')
    console.log('✅ Import Data (NEW)')
    
  } finally {
    await prisma.$disconnect()
  }
}

main()
