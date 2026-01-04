const bcrypt = require('bcryptjs');

bcrypt.hash('admin', 10).then(hash => {
  console.log('Correct bcrypt hash for "admin":');
  console.log(hash);
});
