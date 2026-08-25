import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        status: 'Active',
        partnerType: 'Employee',
      },
      select: { id: true, name: true, etype: true, salaryFrequency: true },
      orderBy: { name: 'asc' },
    })

    console.log('Active Employees:')
    employees.forEach((emp) => {
      console.log(`ID: ${emp.id}, Name: ${emp.name}, Type: ${emp.etype}, Salary: ${emp.salaryFrequency}`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmployees()
