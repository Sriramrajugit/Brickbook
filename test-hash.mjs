import bcrypt from 'bcryptjs';

const currentHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqDLG';
const password = 'admin';

console.log('Testing password verification...');
console.log('Hash:', currentHash);
console.log('Password:', password);

const matches = await bcrypt.compare(password, currentHash);
console.log('Password matches hash?', matches);

if (!matches) {
  console.log('\n⚠️  Hash does NOT match "admin" password!');
  console.log('Generating new hash...');
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash:', newHash);
  console.log('\nUse this hash instead in the database');
}
