import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Get or create company
    let company = await prisma.company.findFirst({
      where: { name: 'Default Company' },
    });

    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Default Company' },
      });
    }

    console.log('✅ Company:', company.name);

    // ==================== ACCOUNTS ====================
    console.log('\n📍 Creating Accounts...');
    const accounts = await Promise.all([
      prisma.account.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'Cash Account',
          type: 'Cash',
          companyId: company.id,
          budget: 100000,
          address: 'Head Office',
        },
      }),
      prisma.account.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Bank Account - HDFC',
          type: 'Bank',
          companyId: company.id,
          budget: 500000,
          address: 'HDFC Branch, Mumbai',
        },
      }),
      prisma.account.upsert({
        where: { id: 3 },
        update: {},
        create: {
          name: 'Petty Cash',
          type: 'Petty Cash',
          companyId: company.id,
          budget: 50000,
          address: 'Office',
        },
      }),
    ]);
    console.log(`  ✓ Created ${accounts.length} accounts`);

    // ==================== CATEGORIES ====================
    console.log('\n🏷️  Creating Categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'Salary',
          description: 'Employee Salary Expenses',
          companyId: company.id,
        },
      }),
      prisma.category.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Supplier Payment',
          description: 'Payments to Suppliers',
          companyId: company.id,
        },
      }),
      prisma.category.upsert({
        where: { id: 3 },
        update: {},
        create: {
          name: 'Office Expenses',
          description: 'General Office Expenses',
          companyId: company.id,
        },
      }),
      prisma.category.upsert({
        where: { id: 4 },
        update: {},
        create: {
          name: 'Travel',
          description: 'Travel and Transportation',
          companyId: company.id,
        },
      }),
      prisma.category.upsert({
        where: { id: 5 },
        update: {},
        create: {
          name: 'Income',
          description: 'Business Income',
          companyId: company.id,
        },
      }),
    ]);
    console.log(`  ✓ Created ${categories.length} categories`);

    // ==================== EMPLOYEES - SUPPLIERS ====================
    console.log('\n🤝 Creating Supplier Employees...');
    const suppliers = await Promise.all([
      prisma.employee.upsert({
        where: { id: 101 },
        update: {},
        create: {
          name: 'ABC Cement',
          partnerType: 'Supplier',
          email: 'sales@abccement.com',
          phone: '9876543210',
          address: 'Industrial Area, Mumbai',
          gstNumber: '27AABCT1234A1Z0',
          creditPeriodDays: 45,
          isActive: true,
          companyId: company.id,
          status: 'Active',
        },
      }),
      prisma.employee.upsert({
        where: { id: 102 },
        update: {},
        create: {
          name: 'Steel Suppliers Ltd',
          partnerType: 'Supplier',
          email: 'info@steelsuppliers.com',
          phone: '9876543211',
          address: 'Steel Market, Delhi',
          gstNumber: '07AABCS5678B1Z0',
          creditPeriodDays: 30,
          isActive: true,
          companyId: company.id,
          status: 'Active',
        },
      }),
    ]);
    console.log(`  ✓ Created ${suppliers.length} supplier employees`);

    // ==================== BILLS ====================
    console.log('\n📄 Creating Bills...');
    const today = new Date();
    const bills = await Promise.all([
      prisma.partnerBill.upsert({
        where: { id: 1 },
        update: {},
        create: {
          companyId: company.id,
          employeeId: suppliers[0].id,
          accountId: accounts[0].id,
          invoiceNo: 'INV-ABC-001',
          billDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
          dueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          amount: 125000,
          paidAmount: 75000,
          status: 'PARTIALLY_PAID',
          billImagePath: null,
        },
      }),
      prisma.partnerBill.upsert({
        where: { id: 2 },
        update: {},
        create: {
          companyId: company.id,
          employeeId: suppliers[1].id,
          accountId: accounts[0].id,
          invoiceNo: 'INV-STEEL-2026-001',
          billDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
          amount: 250000,
          paidAmount: 0,
          status: 'UNPAID',
          billImagePath: null,
        },
      }),
      prisma.partnerBill.upsert({
        where: { id: 3 },
        update: {},
        create: {
          companyId: company.id,
          employeeId: suppliers[0].id,
          accountId: accounts[0].id,
          invoiceNo: 'INV-ABC-002',
          billDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
          dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          amount: 85000,
          paidAmount: 85000,
          status: 'FULLY_PAID',
          billImagePath: null,
        },
      }),
    ]);
    console.log(`  ✓ Created ${bills.length} bills`);

    // ==================== BILL PAYMENTS ====================
    console.log('\n💳 Creating Bill Payments...');
    const billPayments = await Promise.all([
      prisma.partnerBillPayment.upsert({
        where: { id: 1 },
        update: {},
        create: {
          companyId: company.id,
          billId: 1,
          paymentDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
          amount: 75000,
          paymentMode: 'BANK_TRANSFER',
          referenceNo: 'TXN20260702001',
          transactionId: null,
        },
      }),
      prisma.partnerBillPayment.upsert({
        where: { id: 2 },
        update: {},
        create: {
          companyId: company.id,
          billId: 3,
          paymentDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
          amount: 85000,
          paymentMode: 'GPAY',
          referenceNo: 'TXN20260620001',
          transactionId: null,
        },
      }),
    ]);
    console.log(`  ✓ Created ${billPayments.length} bill payments`);

    // ==================== TRANSACTIONS ====================
    console.log('\n💰 Creating Transactions...');
    const transactions = await Promise.all([
      prisma.transaction.create({
        data: {
          amount: 50000,
          description: 'Office Supplies Purchase',
          category: 'Office Expenses',
          type: 'Cash-Out',
          date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          accountId: accounts[0].id,
          categoryId: categories[2].id,
          paymentMode: 'GPAY',
          companyId: company.id,
        },
      }),
      prisma.transaction.create({
        data: {
          amount: 100000,
          description: 'Project Income - Construction Co',
          category: 'Income',
          type: 'Cash-In',
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
          accountId: accounts[1].id,
          categoryId: categories[4].id,
          paymentMode: 'BANK_TRANSFER',
          companyId: company.id,
        },
      }),
      prisma.transaction.create({
        data: {
          amount: 15000,
          description: 'Travel Expenses - Site Visit',
          category: 'Travel',
          type: 'Cash-Out',
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          accountId: accounts[2].id,
          categoryId: categories[3].id,
          paymentMode: 'Cash',
          companyId: company.id,
        },
      }),
    ]);
    console.log(`  ✓ Created ${transactions.length} transactions`);

    // ==================== EMPLOYEES ====================
    console.log('\n👥 Creating Employees...');
    const employees = await Promise.all([
      prisma.employee.create({
        data: {
          name: 'John Doe',
          partnerType: 'Employee',
          etype: 'Site Manager',
          salary: 50000,
          salaryFrequency: 'Monthly',
          status: 'Active',
          companyId: company.id,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Jane Smith',
          partnerType: 'Employee',
          etype: 'Site Engineer',
          salary: 40000,
          salaryFrequency: 'Monthly',
          status: 'Active',
          companyId: company.id,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Mike Johnson',
          partnerType: 'Employee',
          etype: 'Supervisor',
          salary: 35000,
          salaryFrequency: 'Monthly',
          status: 'Active',
          companyId: company.id,
        },
      }),
    ]);
    console.log(`  ✓ Created ${employees.length} employees`);

    // ==================== ATTENDANCE ====================
    console.log('\n📅 Creating Attendance Records...');
    const attendanceRecords = [];
    for (let i = 0; i < employees.length; i++) {
      for (let days = 20; days >= 0; days--) {
        const date = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          attendanceRecords.push(
            prisma.attendance.upsert({
              where: {
                employeeId_date: {
                  employeeId: employees[i].id,
                  date: new Date(date.toDateString()),
                },
              },
              update: {},
              create: {
                employeeId: employees[i].id,
                date: new Date(date.toDateString()),
                status: 1, // Present
                companyId: company.id,
              },
            })
          );
        }
      }
    }
    const attendances = await Promise.all(attendanceRecords);
    console.log(`  ✓ Created ${attendances.length} attendance records`);

    // ==================== PAYROLL ====================
    console.log('\n💵 Creating Payroll Records...');
    const payrolls = [];
    for (const employee of employees) {
      payrolls.push(
        prisma.payroll.create({
          data: {
            employeeId: employee.id,
            amount: employee.salary || 0,
            accountId: accounts[1].id,
            fromDate: new Date(today.getFullYear(), today.getMonth(), 1),
            toDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
            remarks: `Salary for ${new Date(today.getFullYear(), today.getMonth()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            companyId: company.id,
          },
        })
      );
    }
    const payrollRecords = await Promise.all(payrolls);
    console.log(`  ✓ Created ${payrollRecords.length} payroll records`);

    // ==================== ADVANCES ====================
    console.log('\n⏳ Creating Advance Records...');
    const advances = await Promise.all([
      prisma.advance.create({
        data: {
          employeeId: employees[0].id,
          amount: 10000,
          reason: 'Personal Emergency',
          date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
          companyId: company.id,
        },
      }),
      prisma.advance.create({
        data: {
          employeeId: employees[1].id,
          amount: 5000,
          reason: 'Medical Expenses',
          date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          companyId: company.id,
        },
      }),
    ]);
    console.log(`  ✓ Created ${advances.length} advance records`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Database seed completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`  • Accounts: ${accounts.length}`);
    console.log(`  • Categories: ${categories.length}`);
    console.log(`  • Supplier Employees: ${suppliers.length}`);
    console.log(`  • Bills: ${bills.length}`);
    console.log(`  • Bill Payments: ${billPayments.length}`);
    console.log(`  • Transactions: ${transactions.length}`);
    console.log(`  • Employees: ${employees.length}`);
    console.log(`  • Attendance: ${attendances.length}`);
    console.log(`  • Payrolls: ${payrollRecords.length}`);
    console.log(`  • Advances: ${advances.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin\n');
  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
