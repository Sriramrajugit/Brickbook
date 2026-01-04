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

    const COMPANY_ID = 1;
    const SITE_ID = 1;

    // Get or create company
    const company = await prisma.company.upsert({
      where: { id: COMPANY_ID },
      update: {},
      create: {
        id: COMPANY_ID,
        name: 'Dev Company'
      }
    });
    console.log('✅ Company ready:', company.name);

    // Get or create site
    const site = await prisma.site.upsert({
      where: { id: SITE_ID },
      update: {},
      create: {
        id: SITE_ID,
        name: 'Main Site',
        companyId: COMPANY_ID
      }
    });
    console.log('✅ Site ready:', site.name);

    // Get or create main account
    const account = await prisma.account.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Main Account',
        type: 'General',
        budget: 0,
        companyId: COMPANY_ID,
        siteId: SITE_ID
      }
    });
    console.log('✅ Account ready:', account.name);

    // Collect all unique categories from CSV
    const uniqueCategories = [...new Set(records.map(r => r.category).filter(Boolean))];
    console.log(`\n📂 Creating ${uniqueCategories.length} categories...`);
    
    const categoryMap = new Map();
    for (const catName of uniqueCategories) {
      const cat = await prisma.category.upsert({
        where: {
          name_companyId: {
            name: catName,
            companyId: COMPANY_ID
          }
        },
        update: {},
        create: {
          name: catName,
          description: catName,
          companyId: COMPANY_ID
        }
      });
      categoryMap.set(catName, cat.id);
      console.log(`  ✓ ${catName}`);
    }

    // Import transactions
    console.log(`\n📥 Importing ${records.length} transactions...`);
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
            companyId: COMPANY_ID,
            siteId: SITE_ID,
            createdBy: 1  // Owner user ID
          }
        });
        imported++;

        if (imported % 50 === 0) {
          console.log(`  ⏳ Imported ${imported}/${records.length}...`);
        }
      } catch (err) {
        console.error(`  ❌ Error importing row:`, record.id, err.message);
        skipped++;
      }
    }

    const totalTx = await prisma.transaction.count();
    console.log(`\n✅ Import complete!`);
    console.log(`📈 Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total transactions in database: ${totalTx}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importTransactions();
