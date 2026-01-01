import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const csvPath = path.join(__dirname, '..', 'transactions_test_data.csv')
  const fileContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = fileContent.split('\n')
  
  // Skip header row
  const dataLines = lines.slice(1).filter(line => line.trim())
  
  console.log(`Found ${dataLines.length} transactions to import`)
  
  // Get or create a default company
  let company = await prisma.company.findFirst()
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Default Company' }
    })
  }
  const companyId = company.id
  
  let imported = 0
  let skipped = 0
  
  for (const line of dataLines) {
    try {
      // Parse CSV line (handling quoted fields)
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim())
      
      if (!values || values.length < 6) {
        console.log('Skipping invalid line:', line)
        skipped++
        continue
      }
      
      const [id, amount, description, category, type, date, accountId, createdAt, updatedAt, paymentMode] = values
      
      // Parse date - handle both formats
      let transactionDate: Date
      try {
        transactionDate = new Date(date)
        if (isNaN(transactionDate.getTime())) {
          throw new Error('Invalid date')
        }
      } catch (e) {
        console.log(`Skipping transaction with invalid date: ${date}`)
        skipped++
        continue
      }
      
      // Get or create account (default to account ID 1 if not found)
      const accId = parseInt(accountId) || 1
      
      // Check if account exists, if not use default
      const account = await prisma.account.findFirst({
        where: { id: accId }
      })
      
      const finalAccountId = account ? accId : 1
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          amount: parseFloat(amount),
          description: description || null,
          category: category,
          type: type,
          paymentMode: paymentMode || 'Cash',
          date: transactionDate,
          accountId: finalAccountId,
          categoryId: null, // We'll leave this null for now
          companyId: companyId,
        }
      })
      
      imported++
      
      if (imported % 50 === 0) {
        console.log(`Imported ${imported} transactions...`)
      }
    } catch (error) {
      console.error(`Error importing transaction:`, error)
      skipped++
    }
  }
  
  console.log(`\n✅ Import complete!`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${dataLines.length}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Import failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
