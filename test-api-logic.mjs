import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAPILogic() {
  try {
    const startDate = '2026-05-01'
    const endDate = '2026-05-31'

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    console.log('Date range:', start.toISOString(), 'to', end.toISOString())

    const employees = await prisma.employee.findMany({
      where: { companyId: 1, status: 'Active', partnerType: 'Employee' },
      select: { id: true, name: true, etype: true, salaryFrequency: true },
      orderBy: { name: 'asc' },
    })

    console.log('\nEmployees found:', employees.length)

    const attendances = await prisma.attendance.findMany({
      where: {
        companyId: 1,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { employeeId: true, date: true, status: true },
    })

    console.log('Attendance records found:', attendances.length)
    console.log('Attendance records:', attendances)

    // Test Employee 1 calculation
    const emp = employees.find((e) => e.id === 1)
    if (emp) {
      const empAttendances = attendances.filter((a) => a.employeeId === emp.id)
      console.log(`\nEmployee ${emp.id} (${emp.name}):`)
      console.log('Filtered attendances:', empAttendances)

      const totalDays = empAttendances.reduce((sum, a) => sum + a.status, 0)
      const otHours = empAttendances.reduce((sum, a) => (a.status > 1 ? a.status - 1 : 0), 0)

      console.log(`Total Days: ${totalDays}`)
      console.log(`OT Hours: ${otHours}`)
      console.log(`OT Hours (rounded): ${Math.round(otHours * 100) / 100}`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPILogic()
