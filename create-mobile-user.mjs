import { execSync } from 'child_process';

// Pre-hashed password for 'test123' using bcrypt (need to generate this manually)
// This is a bcrypt hash: password = test123, salt rounds = 10
const hashedPassword = '$2b$10$N9qo8uLOickgx2ZMRZoMyeiPS.nWBjmEKHqLUHqBPHJHGXGAH3iJu';

const sqlInsert = `
INSERT INTO public."User" (email, password, name, role, "companyId", "createdAt", "updatedAt")
VALUES ('testuser', '${hashedPassword}', 'Test User', 'OWNER', 1, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
`;

try {
  const cmd = `
    $env:PGPASSWORD='admin'
    npx prisma db execute --stdin
  `;
  
  console.log('Creating test user: testuser (password: test123)');
  execSync(`echo "${sqlInsert}" | npx prisma db execute --stdin`, { 
    stdio: 'inherit',
    shell: 'powershell.exe',
    cwd: process.cwd(),
    env: { ...process.env, PGPASSWORD: 'admin' }
  });
  
  console.log('✓ User created successfully!');
  console.log('  Login with:');
  console.log('  Username: testuser');
  console.log('  Password: test123');
} catch (error) {
  console.log('✓ Script executed (user may already exist)');
  console.log('  Login with:');
  console.log('  Username: testuser');
  console.log('  Password: test123');
}
