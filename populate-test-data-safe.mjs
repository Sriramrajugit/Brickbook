import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateTestData() {
  try {
    console.log('🚀 Starting safe test data population (non-destructive)...\n');

    // Get or create company
    let company = await prisma.company.findFirst({
      where: { name: 'Test Company' }
    });

    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Test Company' }
      });
      console.log('✅ Company created:', company.name);
    } else {
      console.log('✅ Using existing company:', company.name);
    }

    // ==================== ACCOUNTS ====================
    console.log('\n📊 Setting up Accounts...');
    const accountsData = [
      { name: 'Marketing Project', type: 'Project', budget: 100000, projectStatus: 'IN_PROGRESS' },
      { name: 'Operations', type: 'Department', budget: 250000, projectStatus: 'IN_PROGRESS' },
      { name: 'R&D Initiative', type: 'Project', budget: 150000, projectStatus: 'YET_TO_START' },
      { name: 'Infrastructure', type: 'Infrastructure', budget: 500000, projectStatus: 'COMPLETED' },
      { name: 'Sales Account', type: 'Sales', budget: 200000, projectStatus: 'IN_PROGRESS' },
    ];

    for (const accData of accountsData) {
      // Find existing account
      const existing = await prisma.account.findFirst({
        where: {
          name: accData.name,
          companyId: company.id
        }
      });

      if (existing) {
        // Update existing
        const account = await prisma.account.update({
          where: { id: existing.id },
          data: {
            type: accData.type,
            budget: accData.budget,
            projectStatus: accData.projectStatus
          }
        });
        console.log(`  ✓ ${account.name} (Updated - Status: ${account.projectStatus})`);
      } else {
        // Create new
        const account = await prisma.account.create({
          data: {
            ...accData,
            companyId: company.id
          }
        });
        console.log(`  ✓ ${account.name} (Created - Status: ${account.projectStatus})`);
      }
    }

    // ==================== CATEGORIES ====================
    console.log('\n📁 Setting up Categories...');
    const categoriesData = [
      { name: 'Salary', description: 'Employee Salaries' },
      { name: 'Utilities', description: 'Electricity, Water, Gas' },
      { name: 'Rent', description: 'Office/Site Rent' },
      { name: 'Materials', description: 'Raw Materials' },
      { name: 'Transport', description: 'Transportation Expenses' },
      { name: 'Office Supplies', description: 'Stationery & Office Items' },
      { name: 'Maintenance', description: 'Building & Equipment Maintenance' },
      { name: 'Travel', description: 'Employee Travel' },
      { name: 'Marketing', description: 'Marketing & Advertising' },
      { name: 'Capital', description: 'Capital Expenses' },
    ];

    for (const catData of categoriesData) {
      const category = await prisma.category.upsert({
        where: { name_companyId: { name: catData.name, companyId: company.id } },
        update: { description: catData.description },
        create: { ...catData, companyId: company.id }
      });
      console.log(`  ✓ ${category.name}`);
    }

    // ==================== EMPLOYEES ====================
    console.log('\n👥 Setting up Employees...');
    const employeesData = [
      { name: 'John Doe', etype: 'Manager', salary: 50000 },
      { name: 'Rajesh Kumar', etype: 'Supervisor', salary: 35000 },
      { name: 'Priya Singh', etype: 'Accountant', salary: 30000 },
      { name: 'Amit Patel', etype: 'Labour', salary: 15000 },
      { name: 'Ramesh Verma', etype: 'Labour', salary: 15000 },
      { name: 'Sunita Sharma', etype: 'Staff', salary: 20000 },
      { name: 'Vikram Singh', etype: 'Engineer', salary: 45000 },
      { name: 'Neha Gupta', etype: 'Designer', salary: 32000 },
    ];

    const employees = [];
    for (const empData of employeesData) {
      try {
        const existing = await prisma.employee.findFirst({
          where: {
            name: empData.name,
            companyId: company.id
          }
        });

        let employee;
        if (existing) {
          employee = await prisma.employee.update({
            where: { id: existing.id },
            data: { 
              etype: empData.etype, 
              salary: empData.salary 
            }
          });
          console.log(`  ✓ ${employee.name} - ${employee.etype} (Updated)`);
        } else {
          employee = await prisma.employee.create({
            data: {
              ...empData,
              salaryFrequency: 'Monthly',
              status: 'Active',
              companyId: company.id,
              partnerType: 'Employee'
            }
          });
          console.log(`  ✓ ${employee.name} - ${employee.etype} (Created)`);
        }
        employees.push(employee);
      } catch (err) {
        console.error(`  ❌ Error for ${empData.name}:`, err.message);
      }
    }

    // ==================== ATTENDANCE ====================
    console.log('\n📅 Setting up Attendance Records...');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let attendanceCount = 0;
    for (const employee of employees.slice(0, 3)) {
      for (let day = 0; day < 15; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + day);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        try {
          // Use upsert to avoid duplicates
          const dateStr = date.toISOString().split('T')[0];
          const existing = await prisma.attendance.findFirst({
            where: {
              employeeId: employee.id,
              date: {
                gte: new Date(dateStr),
                lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000)
              }
            }
          });

          if (!existing) {
            await prisma.attendance.create({
              data: {
                employeeId: employee.id,
                date: date,
                status: Math.random() > 0.1 ? 1 : 0,
                companyId: company.id
              }
            });
            attendanceCount++;
          }
        } catch (err) {
          // Silently skip duplicates
        }
      }
    }
    console.log(`  ✓ Created ${attendanceCount} attendance records`);

    // ==================== PAYROLL ====================
    console.log('\n💰 Setting up Payroll Records...');
    
    const accounts = await prisma.account.findMany({
      where: { companyId: company.id }
    });

    if (accounts.length > 0) {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      let payrollCount = 0;
      for (const employee of employees.slice(0, 4)) {
        try {
          const existing = await prisma.payroll.findFirst({
            where: {
              employeeId: employee.id,
              fromDate: startOfMonth
            }
          });

          if (existing) {
            const payroll = await prisma.payroll.update({
              where: { id: existing.id },
              data: {
                amount: employee.salary || 25000
              }
            });
            console.log(`  ✓ ${employee.name} - ₹${payroll.amount} (Updated)`);
          } else {
            const payroll = await prisma.payroll.create({
              data: {
                employeeId: employee.id,
                amount: employee.salary || 25000,
                accountId: accounts[0].id,
                fromDate: startOfMonth,
                toDate: endOfMonth,
                remarks: 'Monthly Salary',
                companyId: company.id
              }
            });
            payrollCount++;
            console.log(`  ✓ ${employee.name} - ₹${payroll.amount} (Created)`);
          }
        } catch (err) {
          console.error(`  ❌ Error for ${employee.name}:`, err.message);
        }
      }
    }

    // ==================== TRANSACTIONS ====================
    console.log('\n💸 Setting up Sample Transactions...');
    
    if (accounts.length > 0) {
      const categories = await prisma.category.findMany({
        where: { companyId: company.id }
      });

      const transactionsData = [
        { description: 'Salary Payment', amount: 50000, type: 'Cash-Out', category: 'Salary', paymentMode: 'Bank Transfer' },
        { description: 'Project Income', amount: 75000, type: 'Cash-In', category: 'Marketing', paymentMode: 'Bank Transfer' },
        { description: 'Office Supplies Purchase', amount: 5000, type: 'Cash-Out', category: 'Office Supplies', paymentMode: 'G-Pay' },
        { description: 'Utility Bill Payment', amount: 8000, type: 'Cash-Out', category: 'Utilities', paymentMode: 'Bank Transfer' },
        { description: 'Rent Payment', amount: 30000, type: 'Cash-Out', category: 'Rent', paymentMode: 'Cheque' },
        { description: 'Client Payment Received', amount: 100000, type: 'Cash-In', category: 'Travel', paymentMode: 'Bank Transfer' },
        { description: 'Transport Expenses', amount: 3500, type: 'Cash-Out', category: 'Transport', paymentMode: 'Cash' },
        { description: 'Marketing Campaign', amount: 15000, type: 'Cash-Out', category: 'Marketing', paymentMode: 'Bank Transfer' },
      ];

      let txCount = 0;
      for (let i = 0; i < transactionsData.length; i++) {
        try {
          const txData = transactionsData[i];
          const randomDate = new Date();
          randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 10));
          
          // Create with unique description + date to avoid duplicates
          const uniqueDesc = `${txData.description} - ${randomDate.toISOString().split('T')[0]}`;
          
          const existing = await prisma.transaction.findFirst({
            where: {
              description: { contains: txData.description.substring(0, 10) },
              date: {
                gte: new Date(randomDate.toISOString().split('T')[0]),
                lt: new Date(new Date(randomDate.toISOString().split('T')[0]).getTime() + 24 * 60 * 60 * 1000)
              }
            }
          });

          if (!existing) {
            const categoryMatch = categories.find(c => 
              c.name.toLowerCase().includes(txData.category.toLowerCase()) ||
              txData.category.toLowerCase().includes(c.name.toLowerCase())
            );

            const transaction = await prisma.transaction.create({
              data: {
                date: randomDate,
                type: txData.type,
                amount: txData.amount,
                description: txData.description,
                category: txData.category,
                categoryId: categoryMatch?.id,
                paymentMode: txData.paymentMode,
                accountId: accounts[0].id,
                companyId: company.id
              }
            });
            txCount++;
            console.log(`  ✓ ${txData.description} - ₹${txData.amount}`);
          }
        } catch (err) {
          console.error(`  ❌ Error:`, err.message);
        }
      }
      console.log(`  Total: ${txCount} transactions created/updated`);
    }

    console.log('\n✅ Test data setup complete!');
    console.log('📊 Summary:');
    console.log(`   - Company: ${company.name}`);
    console.log(`   - Accounts: ${accountsData.length}`);
    console.log(`   - Employees: ${employees.length}`);
    console.log('   - ✅ All data is SAFE - existing records are preserved');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

populateTestData();
