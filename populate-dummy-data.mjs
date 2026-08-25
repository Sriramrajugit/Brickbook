import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateDummyData() {
  try {
    console.log('🚀 Starting comprehensive dummy data population...\n');

    // Get existing company or create new one
    let company = await prisma.company.findFirst({
      where: { name: 'Studio Ullixa' }
    });

    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Studio Ullixa' }
      });
      console.log('✅ Company created:', company.name);
    } else {
      console.log('✅ Using existing company:', company.name);
    }

    // ==================== EMPLOYEES ====================
    console.log('\n📋 Creating Employees...');
    const employees = [];
    const employeeData = [
      { name: 'John Doe', etype: 'Manager', salary: 50000, partnerType: 'Employee' },
      { name: 'Rajesh Kumar', etype: 'Supervisor', salary: 35000, partnerType: 'Employee' },
      { name: 'Priya Singh', etype: 'Accountant', salary: 30000, partnerType: 'Employee' },
      { name: 'Amit Patel', etype: 'Labour', salary: 15000, partnerType: 'Employee' },
      { name: 'Ramesh Verma', etype: 'Labour', salary: 15000, partnerType: 'Employee' },
      { name: 'Sunita Sharma', etype: 'Staff', salary: 20000, partnerType: 'Employee' },
    ];

    for (const emp of employeeData) {
      try {
        const employee = await prisma.employee.create({
          data: {
            ...emp,
            salaryFrequency: 'Monthly',
            status: 'Active',
            companyId: company.id
          }
        });
        employees.push(employee);
        console.log(`  ✓ ${employee.name}`);
      } catch (err) {
        if (err.code === 'P2002') {
          const existing = await prisma.employee.findFirst({
            where: { name: emp.name, companyId: company.id }
          });
          if (existing) {
            employees.push(existing);
            console.log(`  ⚠️  ${emp.name} already exists`);
          }
        } else {
          console.error(`  ❌ Error for ${emp.name}:`, err.message);
        }
      }
    }

    // ==================== ATTENDANCE ====================
    console.log('\n📅 Creating Attendance Records...');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let attendanceCount = 0;
    for (const employee of employees) {
      for (let day = 0; day < 20; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + day);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        try {
          await prisma.attendance.create({
            data: {
              employeeId: employee.id,
              date: date,
              status: Math.random() > 0.1 ? 1 : 0, // 1 = Present, 0 = Absent (Float type)
              companyId: company.id
            }
          });
          attendanceCount++;
        } catch (err) {
          if (err.code !== 'P2002') {
            console.error(`  ❌ Error:`, err.message);
          }
        }
      }
    }
    console.log(`  ✓ Created ${attendanceCount} attendance records`);

    // ==================== PAYROLL ====================
    console.log('\n💰 Creating Payroll Records...');
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Get or create a default account for payroll
    let payrollAccount = await prisma.account.findFirst({
      where: { companyId: company.id }
    });
    
    if (!payrollAccount) {
      payrollAccount = await prisma.account.create({
        data: {
          name: 'Payroll Account',
          type: 'General',
          companyId: company.id
        }
      });
    }
    
    let payrollCount = 0;
    for (const employee of employees) {
      try {
        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            amount: employee.salary || 25000,
            accountId: payrollAccount.id,
            fromDate: startOfMonth,
            toDate: endOfMonth,
            remarks: 'Monthly Salary',
            companyId: company.id
          }
        });
        payrollCount++;
        console.log(`  ✓ ${employee.name} - ₹${payroll.amount}`);
      } catch (err) {
        if (err.code === 'P2002') {
          console.log(`  ⚠️  Payroll for ${employee.name} already exists`);
        } else {
          console.error(`  ❌ Error for ${employee.name}:`, err.message);
        }
      }
    }
    console.log(`  Total: ${payrollCount} payroll records`);

    // ==================== ADVANCES ====================
    console.log('\n💳 Creating Advance Records...');
    let advanceCount = 0;
    for (let i = 0; i < Math.min(3, employees.length); i++) {
      try {
        const advance = await prisma.advance.create({
          data: {
            employeeId: employees[i].id,
            amount: 5000 + Math.random() * 10000,
            reason: ['Medical Emergency', 'Personal Loan', 'Travel Expense'][i % 3],
            date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
            companyId: company.id
          }
        });
        advanceCount++;
        console.log(`  ✓ Advance for ${employees[i].name} - ₹${advance.amount.toFixed(2)}`);
      } catch (err) {
        if (err.code !== 'P2002') {
          console.error(`  ❌ Error:`, err.message);
        }
      }
    }

    // ==================== ADDITIONAL TRANSACTIONS ====================
    console.log('\n💸 Creating Additional Transactions...');
    
    // Get accounts
    const accounts = await prisma.account.findMany({
      where: { companyId: company.id },
      take: 2
    });

    if (accounts.length === 0) {
      console.log('  ⚠️  No accounts found, skipping transactions');
    } else {
      const categories = await prisma.category.findMany({
        where: { companyId: company.id },
        take: 5
      });

      const categoryNames = ['Salary', 'Materials', 'Labour', 'Transport', 'Miscellaneous'];
      let transactionCount = 0;
      const paymentModes = ['Cash', 'G-Pay', 'Bank Transfer', 'Cheque', 'UPI'];

      for (let i = 0; i < 20; i++) {
        try {
          const randomDate = new Date();
          randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
          const categoryName = categoryNames[i % categoryNames.length];
          const category = categories.length > 0 ? categories[i % categories.length] : null;
          
          await prisma.transaction.create({
            data: {
              date: randomDate,
              type: Math.random() > 0.5 ? 'Cash-In' : 'Cash-Out',
              amount: 1000 + Math.random() * 50000,
              description: `Transaction ${i + 1}`,
              category: categoryName,
              paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
              accountId: accounts[Math.floor(Math.random() * accounts.length)].id,
              categoryId: category ? category.id : null,
              companyId: company.id,
              createdBy: 1
            }
          });
          transactionCount++;
        } catch (err) {
          if (err.code !== 'P2002') {
            console.error(`  ❌ Error:`, err.message);
          }
        }
      }
      console.log(`  ✓ Created ${transactionCount} additional transactions`);
    }

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(50));
    console.log('✅ DUMMY DATA POPULATION COMPLETE!\n');
    
    const summary = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM companies) as companies,
        (SELECT COUNT(*) FROM employees) as employees,
        (SELECT COUNT(*) FROM attendances) as attendance,
        (SELECT COUNT(*) FROM payrolls) as payroll,
        (SELECT COUNT(*) FROM advances) as advances,
        (SELECT COUNT(*) FROM transactions) as transactions,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM accounts) as accounts,
        (SELECT COUNT(*) FROM suppliers) as suppliers
    `;

    console.log('📊 SUMMARY:');
    console.log(`  👥 Users: ${summary[0].users}`);
    console.log(`  🏢 Companies: ${summary[0].companies}`);
    console.log(`  👨‍💼 Employees: ${summary[0].employees}`);
    console.log(`  📅 Attendance Records: ${summary[0].attendance}`);
    console.log(`  💰 Payroll Records: ${summary[0].payroll}`);
    console.log(`  💳 Advance Records: ${summary[0].advances}`);
    console.log(`  💸 Transactions: ${summary[0].transactions}`);
    console.log(`  🏷️  Categories: ${summary[0].categories}`);
    console.log(`  📍 Accounts: ${summary[0].accounts}`);
    console.log(`  🏪 Suppliers: ${summary[0].suppliers}`);
    console.log('\n🔑 Login Credentials:');
    console.log('  Email: testuser');
    console.log('  Password: test123\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

populateDummyData();
