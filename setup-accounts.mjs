import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAccounts() {
  try {
    console.log('🏢 Setting up Accounts and Sites...\n');

    // Get the existing company
    const company = await prisma.company.findFirst({
      where: { name: 'Studio Ullixa' }
    });

    if (!company) {
      console.error('❌ Company not found. Please create a company first.');
      process.exit(1);
    }

    console.log('✅ Using company:', company.name);

    // Create Sites
    console.log('\n📍 Creating Sites...');
    const sitesData = [
      { name: 'Main Site - Project A', location: 'Delhi' },
      { name: 'North Site - Project B', location: 'Noida' },
      { name: 'South Site - Project C', location: 'Gurgaon' },
      { name: 'Head Office', location: 'New Delhi' },
    ];

    const sites = [];
    for (const siteData of sitesData) {
      try {
        const site = await prisma.site.upsert({
          where: { name: siteData.name },
          update: {},
          create: {
            ...siteData,
            companyId: company.id
          }
        });
        sites.push(site);
        console.log(`  ✓ ${site.name} (${site.location})`);
      } catch (err) {
        if (err.code !== 'P2002') {
          console.error(`  ❌ Error creating site:`, err.message);
        } else {
          const existing = await prisma.site.findUnique({
            where: { name: siteData.name }
          });
          if (existing) {
            sites.push(existing);
            console.log(`  ⚠️  ${siteData.name} already exists`);
          }
        }
      }
    }

    // Create Accounts
    console.log('\n💰 Creating Accounts...');
    const accountsData = [
      {
        name: 'Main Project Account',
        type: 'Project',
        budget: 500000,
        address: '123 Main Street',
        city: 'Delhi',
        state: 'Delhi',
        zip: '110001',
        siteIndex: 0,
        startDate: new Date(2025, 0, 1), // Jan 2025
        endDate: new Date(2026, 11, 31)  // Dec 2026
      },
      {
        name: 'North Site - Operations',
        type: 'Operations',
        budget: 300000,
        address: 'Noida City Center',
        city: 'Noida',
        state: 'UP',
        zip: '201301',
        siteIndex: 1,
        startDate: new Date(2025, 3, 1),
        endDate: new Date(2026, 8, 30)
      },
      {
        name: 'South Site - Development',
        type: 'Development',
        budget: 750000,
        address: 'Gurgaon Business Center',
        city: 'Gurgaon',
        state: 'Haryana',
        zip: '122001',
        siteIndex: 2,
        startDate: new Date(2025, 6, 1),
        endDate: new Date(2027, 5, 30)
      },
      {
        name: 'Administration Account',
        type: 'General',
        budget: 100000,
        address: 'Head Office',
        city: 'New Delhi',
        state: 'Delhi',
        zip: '110016',
        siteIndex: 3,
        startDate: new Date(2025, 0, 1),
        endDate: null
      },
      {
        name: 'Maintenance & Repairs',
        type: 'Maintenance',
        budget: 50000,
        address: 'All Sites',
        city: 'Multi-site',
        state: 'Multi-state',
        zip: null,
        siteIndex: 0,
        startDate: new Date(2025, 0, 1),
        endDate: null
      },
      {
        name: 'Staff Welfare Fund',
        type: 'Welfare',
        budget: 25000,
        address: 'All Sites',
        city: 'Multi-site',
        state: 'Multi-state',
        zip: null,
        siteIndex: 3,
        startDate: new Date(2025, 0, 1),
        endDate: null
      }
    ];

    let createdCount = 0;
    const accounts = [];

    for (const accountData of accountsData) {
      try {
        const { siteIndex, ...data } = accountData;
        const site = sites[siteIndex] || sites[0];

        const account = await prisma.account.create({
          data: {
            ...data,
            siteId: site.id,
            companyId: company.id
          }
        });
        accounts.push(account);
        createdCount++;
        console.log(`  ✓ ${account.name} (${account.type}) - Budget: ₹${account.budget}`);
      } catch (err) {
        if (err.code === 'P2002') {
          console.log(`  ⚠️  ${accountData.name} already exists`);
          const existing = await prisma.account.findFirst({
            where: { name: accountData.name }
          });
          if (existing) {
            accounts.push(existing);
          }
        } else {
          console.error(`  ❌ Error:`, err.message);
        }
      }
    }

    console.log(`\n✅ Created ${createdCount} accounts`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ACCOUNTS AND SITES SETUP COMPLETE!\n');

    const totalSites = await prisma.site.count({
      where: { companyId: company.id }
    });

    const totalAccounts = await prisma.account.count({
      where: { companyId: company.id }
    });

    console.log('📊 SUMMARY:');
    console.log(`  📍 Sites: ${totalSites}`);
    console.log(`  💰 Accounts: ${totalAccounts}`);
    console.log('\n📋 ACCOUNTS CREATED:');

    const allAccounts = await prisma.account.findMany({
      where: { companyId: company.id },
      include: {
        site: {
          select: { name: true, location: true }
        }
      }
    });

    allAccounts.forEach(acc => {
      const budgetStr = acc.budget ? `₹${acc.budget}` : 'No budget';
      const siteStr = acc.site ? `(${acc.site.location})` : '(Multi-site)';
      console.log(`   • ${acc.name} - ${acc.type} - ${budgetStr} ${siteStr}`);
    });

    console.log('\n✅ Ready to use! You can now:');
    console.log('   1. Login to the application');
    console.log('   2. Go to Accounts page to see all accounts');
    console.log('   3. Create transactions for different accounts');
    console.log('   4. Track spending against budgets\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAccounts();
