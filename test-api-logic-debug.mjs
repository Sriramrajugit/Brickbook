import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAPILogic() {
  try {
    const startDate = '2026-05-01'
    const endDate = '2026-05-31'

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const employees = await prisma.employee.findMany({
      where: { companyId: 1, status: 'Active', partnerType: 'Employee' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

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

    const emp = employees.find((e) => e.id === 1)
    if (emp) {
      const empAttendances = attendances.filter((a) => a.employeeId === emp.id)
      console.log(`Employee ${emp.id} (${emp.name}):`)
      console.log('Records:')
      
      empAttendances.forEach((att, idx) => {
        console.log(`  [${idx}] status=${att.status}, status > 1: ${att.status > 1}, deduction: ${att.status > 1 ? att.status - 1 : 0}`)
      })

      let totalOT = 0
      empAttendances.forEach((a) => {
        const ot = a.status > 1 ? a.status - 1 : 0
        totalOT += ot
        console.log(`After record: OT so far = ${totalOT}`)
      })

      console.log('\nUsing reduce:')
      const otHours = empAttendances.reduce((sum, a) => {
        const ot = a.status > 1 ? a.status - 1 : 0
        console.log(`  Reducing: sum=${sum}, a.status=${a.status}, ot=${ot}, new sum=${sum + ot}`)
        return sum + ot
      }, 0)

      console.log(`Final OT Hours: ${otHours}`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPILogic()
