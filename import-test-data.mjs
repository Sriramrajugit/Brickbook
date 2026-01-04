import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function importTransactions() {
  try {
    console.log('🔄 Reading transactions_test_data.csv...');
    const csvContent = fs.readFileSync(
      path.join(__dirname, 'transactions_test_data.csv'),
      'utf-8'
    );

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        if (context.column === 'id' || context.column === 'amount' || context.column === 'accountId' || context.column === 'categoryId') {
          return value === '' || value === 'NULL' ? null : Number(value);
        }
        return value === 'NULL' ? null : value;
      }
    });

    console.log(`📊 Found ${records.length} transactions to import`);

    // Get or create company for local dev
    const company = await prisma.company.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Dev Company'
      }
    });
    console.log('✅ Company ready:', company.name);

    // Get or create main account
    const account = await prisma.account.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Main Account',
        type: 'General',
        budget: 0,
        companyId: 1
      }
    });
    console.log('✅ Account ready:', account.name);

    // Get all categories so we can link them
    const categories = await prisma.category.findMany({
      where: { companyId: 1 }
    });
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));

    // Import transactions
    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        const categoryId = record.category ? categoryMap.get(record.category) : null;

        await prisma.transaction.create({
          data: {
            amount: Number(record.amount),
            description: record.description,
            category: record.category,
            type: record.type,
            paymentMode: record.paymentMode || 'Cash',
            date: new Date(record.date),
            accountId: 1,
            categoryId: categoryId || null,
            companyId: 1,
          }
        });
        imported++;

        if (imported % 50 === 0) {
          console.log(`⏳ Imported ${imported}/${records.length}...`);
        }
      } catch (err) {
        console.error(`❌ Error importing row:`, record, err.message);
        skipped++;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`📈 Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total transactions in database: ${await prisma.transaction.count()}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importTransactions();
