const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading SQL file...');
  const sqlContent = fs.readFileSync(
    path.join(__dirname, '..', 'transactions.sql'),
    'utf-8'
  );

  // Extract VALUES section
  const valuesMatch = sqlContent.match(/VALUES\s*([\s\S]+)/);
  if (!valuesMatch) {
    throw new Error('Could not parse SQL file');
  }

  const valuesText = valuesMatch[1];
  
  // Parse each row
  const rowRegex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*(?:'([^']*)'|NULL),\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g;
  
  const transactions = [];
  let match;
  
  while ((match = rowRegex.exec(valuesText)) !== null) {
    transactions.push({
      id: parseInt(match[1]),
      amount: parseFloat(match[2]),
      description: match[3],
      category: match[4] || 'Other',
      type: 'Cash-Out', // Default to Cash-Out for expenses
      paymentMode: match[9].trim(),
      date: new Date(match[5]),
      accountId: parseInt(match[6]),
      createdAt: new Date(match[7]),
      updatedAt: new Date(match[8])
    });
  }

  console.log(`Parsed ${transactions.length} transactions`);
  console.log('Inserting into database...');

  let inserted = 0;
  let errors = 0;

  for (const txn of transactions) {
    try {
      await prisma.transaction.create({
        data: txn
      });
      inserted++;
      if (inserted % 50 === 0) {
        console.log(`Inserted ${inserted} transactions...`);
      }
    } catch (error) {
      errors++;
      if (errors < 10) {
        console.error(`Error inserting transaction ${txn.id}:`, error.message);
      }
    }
  }

  console.log(`\nCompleted!`);
  console.log(`Successfully inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
