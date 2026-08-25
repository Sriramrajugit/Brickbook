import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseAndFix() {
  try {
    console.log('🔍 Diagnosing Employee table...\n');
    
    // Check how many employees exist
    const employeeCount = await prisma.employee.count();
    console.log(`📊 Total employees in database: ${employeeCount}`);
    
    // Get all employee IDs to see what we have
    if (employeeCount > 0) {
      const allIds = await prisma.$queryRawUnsafe('SELECT id FROM employees ORDER BY id');
      console.log(`📋 Employee IDs:`, allIds.map(e => e.id).join(', '));
    }
    
    // Check the sequence current value
    try {
      const seq = await prisma.$queryRawUnsafe("SELECT last_value FROM employees_id_seq");
      console.log(`🔢 Current sequence value: ${seq[0]?.last_value || 'N/A'}`);
    } catch (e) {
      console.log('⚠️  Sequence check failed (may not exist yet)');
    }
    
    console.log('\n✨ Attempting to create a test employee...\n');
    
    // Try creating a test employee
    const testEmployee = await prisma.employee.create({
      data: {
        name: 'Test Employee',
        partnerType: 'Employee',
        etype: 'Test',
        salary: 0,
        salaryFrequency: 'M',
        status: 'Active',
        companyId: 1, // Assuming company ID 1 exists
      },
    });
    
    console.log(`✅ Successfully created employee:`, testEmployee);
    console.log(`✨ New employee ID: ${testEmployee.id}`);
    
    // Now delete it and reset sequence again
    await prisma.employee.delete({
      where: { id: testEmployee.id },
    });
    
    console.log(`✅ Cleaned up test employee (ID: ${testEmployee.id})`);
    
    // Set sequence to the appropriate next value
    const maxId = testEmployee.id;
    const nextId = maxId + 1;
    
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE employees_id_seq RESTART WITH ${nextId}`);
    console.log(`✅ Sequence reset to start at ${nextId}`);
    
    console.log('\n✨ Fix complete! You can now add new employees/partners.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAndFix();
