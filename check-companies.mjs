import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkEmployeeCompanies() {
  try {
    // Get Employee 1
    const emp1 = await prisma.employee.findFirst({
      where: { id: 1 },
      select: { id: true, name: true, companyId: true, status: true, partnerType: true },
    })
    console.log('Employee 1:', emp1)

    // Get Employee 4
    const emp4 = await prisma.employee.findFirst({
      where: { id: 4 },
      select: { id: true, name: true, companyId: true, status: true, partnerType: true },
    })
    console.log('Employee 4:', emp4)

    // Check current user company
    const user = await prisma.user.findFirst({
      where: { id: 1 },
      select: { id: true, email: true, companyId: true },
    })
    console.log('User 1:', user)

    // Check if Employee 1's attendance records match the company
    const emp1Company = await prisma.company.findFirst({
      where: { id: emp1?.companyId },
      select: { id: true, name: true },
    })
    console.log('Employee 1 Company:', emp1Company)

    // Check attendance for both employees
    const emp1Attendances = await prisma.attendance.findMany({
      where: {
        employeeId: 1,
        date: {
          gte: new Date('2026-05-01'),
          lte: new Date('2026-05-31'),
        },
      },
      select: { id: true, companyId: true, employeeId: true, date: true, status: true },
    })
    console.log('Employee 1 Attendances:', emp1Attendances)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmployeeCompanies()
