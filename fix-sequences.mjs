import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSequences() {
  try {
    const tables = [
      'companies',
      'sites',
      'users',
      'accounts',
      'categories',
      'employees',
      'transactions',
      'attendances',
      'payrolls',
      'advances',
      'partners',
      'partner_bills',
      'partner_bill_payments',
    ]

    for (const table of tables) {
      const seqName = `${table}_id_seq`
      const query = `SELECT setval('${seqName}', (SELECT COALESCE(MAX(id), 0) + 1 FROM ${table}));`
      try {
        const result = await prisma.$executeRawUnsafe(query)
        console.log(`✓ Reset sequence for ${table}`)
      } catch (err) {
        if (!err.message.includes('does not exist')) {
          console.error(`✗ Error resetting ${seqName}:`, err.message)
        }
      }
    }

    console.log('✅ All sequences reset successfully!')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

fixSequences()
