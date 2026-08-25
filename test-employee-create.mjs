import fetch from 'node-fetch';

const testCreateEmployee = async () => {
  try {
    console.log('🧪 Testing employee creation via API...\n');
    
    // First get auth cookie by logging in
    console.log('1️⃣ Logging in to get auth token...');
    const loginRes = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'owner@example.com',
        password: 'owner123'
      })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed:', await loginRes.text());
      process.exit(1);
    }

    const loginData = await loginRes.json();
    console.log('✅ Login successful, got token');
    
    // Extract auth token from Set-Cookie header
    const cookies = loginRes.headers.get('set-cookie');
    console.log('📍 Cookies:', cookies);

    // Now create employee with auth token
    console.log('\n2️⃣ Creating new employee via API...');
    const createRes = await fetch('http://localhost:3000/api/employees', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        name: 'Test Employee API',
        partnerType: 'Employee',
        etype: 'Tester',
        salary: 10000,
        salaryFrequency: 'M',
        status: 'Active'
      })
    });

    console.log('Response Status:', createRes.status);
    console.log('Response Headers:', Object.fromEntries(createRes.headers));
    
    const responseText = await createRes.text();
    console.log('Response Body:', responseText);

    if (createRes.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Employee created successfully:', data);
    } else {
      console.error('❌ Failed to create employee:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testCreateEmployee();
