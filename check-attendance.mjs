import { prisma } from './lib/prisma.js'

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
  select: { employeeId: true, date: true, status: true },
  orderBy: [{ employeeId: 'asc' }, { date: 'asc' }],
})

console.log('Attendance Records:')
attendances.forEach((att) => {
  const day = new Date(att.date).getDate()
  console.log(`Employee ${att.employeeId}, Day ${day}: Status ${att.status}`)
})

// Show which records have OT (status > 1)
console.log('\nRecords with OT (status > 1):')
const otRecords = attendances.filter((a) => a.status > 1)
otRecords.forEach((att) => {
  const day = new Date(att.date).getDate()
  console.log(`Employee ${att.employeeId}, Day ${day}: Status ${att.status}`)
})

process.exit(0)
