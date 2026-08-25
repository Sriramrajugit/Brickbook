import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAttendance() {
  try {
    const startDate = new Date('2026-05-01')
    const endDate = new Date('2026-05-31')
    endDate.setHours(23, 59, 59, 999)

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { id: true, employeeId: true, date: true, status: true },
      orderBy: [{ employeeId: 'asc' }, { date: 'asc' }],
    })

    console.log('All attendance records for May 2026:')
    attendances.forEach((att) => {
      const day = new Date(att.date).getDate()
      console.log(`ID: ${att.id}, Employee: ${att.employeeId}, Day: ${day}, Status: ${att.status}`)
    })

    console.log('\n\nRecords with Status > 1 (OT):')
    const otRecords = attendances.filter((a) => a.status > 1)
    otRecords.forEach((att) => {
      const day = new Date(att.date).getDate()
      console.log(`Employee ${att.employeeId}, Day ${day}: Status ${att.status}`)
    })

    console.log(`\nTotal records: ${attendances.length}`)
    console.log(`Total OT records: ${otRecords.length}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAttendance()
