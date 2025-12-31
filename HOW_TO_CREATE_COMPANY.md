# How to Create a Company

## Method 1: Via API (For Testing)

### Using Postman/Thunder Client/curl

Login first to get auth token, then:

```bash
POST http://localhost:3000/api/companies
Content-Type: application/json
Cookie: auth-token=YOUR_TOKEN_HERE

{
  "name": "ABC Corporation",
  "code": "ABC",
  "address": "123 Business St, City",
  "phone": "+1234567890",
  "email": "info@abc.com"
}
```

### Using Browser Console

```javascript
// After logging in as OWNER
fetch('/api/companies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: "ABC Corporation",
    code: "ABC",
    address: "123 Business St, City",
    phone: "+1234567890",
    email: "info@abc.com"
  })
})
.then(r => r.json())
.then(data => console.log('Company created:', data))
```

## Method 2: Via Database (Prisma Studio)

1. **Open Prisma Studio**:
```bash
cd web
npx prisma studio
```

2. **Navigate to Company table**

3. **Click "Add Record"**

4. **Fill in the fields**:
   - name: "ABC Corporation"
   - code: "ABC" (must be unique, uppercase)
   - address: "123 Business St"
   - phone: "+1234567890"
   - email: "info@abc.com"
   - isActive: true

5. **Click "Save 1 change"**

## Method 3: Via SQL

```sql
-- Connect to your database
INSERT INTO companies (name, code, address, phone, email, "isActive", "createdAt", "updatedAt")
VALUES (
  'ABC Corporation',
  'ABC',
  '123 Business St, City',
  '+1234567890',
  'info@abc.com',
  true,
  NOW(),
  NOW()
);
```

## Method 4: Via Seed Script

Create a custom seed script:

```typescript
// prisma/seed-new-company.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating new company...')

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'ABC Corporation',
      code: 'ABC',
      address: '123 Business St, City',
      phone: '+1234567890',
      email: 'info@abc.com',
      isActive: true
    }
  })
  console.log(`✅ Company created: ${company.name}`)

  // Create first site
  const site = await prisma.site.create({
    data: {
      name: 'Main Office',
      location: 'City',
      companyId: company.id
    }
  })
  console.log(`✅ Site created: ${site.name}`)

  // Create OWNER user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const owner = await prisma.user.create({
    data: {
      email: 'owner@abc.com',
      name: 'ABC Owner',
      password: hashedPassword,
      role: 'OWNER',
      companyId: company.id,
      isActive: true
    }
  })
  console.log(`✅ OWNER user created: ${owner.email}`)

  // Create first account
  const account = await prisma.account.create({
    data: {
      name: 'Main Account',
      type: 'Ledger',
      budget: 0,
      companyId: company.id,
      siteId: site.id,
      createdBy: owner.id
    }
  })
  console.log(`✅ Account created: ${account.name}`)

  // Create basic categories
  const categories = [
    { name: 'Capital', description: 'Initial capital and investments' },
    { name: 'Salary', description: 'Employee salary payments' },
    { name: 'Maintenance', description: 'Maintenance and repairs' },
    { name: 'Supplies', description: 'Office supplies and materials' }
  ]

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        name: cat.name,
        description: cat.description,
        companyId: company.id,
        siteId: site.id,
        createdBy: owner.id
      }
    })
  }
  console.log(`✅ Categories created: ${categories.map(c => c.name).join(', ')}`)

  console.log('\n🎉 Company setup completed!')
  console.log('\n📋 Login Credentials:')
  console.log(`   Email: owner@abc.com`)
  console.log(`   Password: admin123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run it:
```bash
cd web
npx tsx prisma/seed-new-company.ts
```

## After Creating Company

### Create Users for the New Company

```typescript
// Via API or Prisma Studio
{
  "email": "admin@abc.com",
  "name": "ABC Admin",
  "password": "hashed_password",
  "role": "ADMIN",
  "companyId": 2,  // New company ID
  "isActive": true
}
```

### Create Sites

```typescript
{
  "name": "Branch Office",
  "location": "Another City",
  "companyId": 2
}
```

### Create Accounts

```typescript
{
  "name": "Expense Account",
  "type": "Expense",
  "budget": 10000,
  "companyId": 2,
  "siteId": 3,  // New site ID
  "createdBy": 5  // New owner user ID
}
```

## Verify Company Creation

### Check in Prisma Studio
```bash
npx prisma studio
```
Navigate to Companies table and verify the new record.

### Check via API
```bash
GET http://localhost:3000/api/companies
```

### Check in Database
```sql
SELECT * FROM companies ORDER BY "createdAt" DESC;
SELECT * FROM users WHERE "companyId" = 2;
SELECT * FROM sites WHERE "companyId" = 2;
```

## Testing Multi-Tenant Isolation

1. **Login as user from Company 1**
   - Should see only Company 1 data

2. **Login as user from Company 2**
   - Should see only Company 2 data

3. **Verify no cross-tenant data leakage**
   - Check transactions, accounts, employees
   - Verify companyId filters working

## Important Notes

⚠️ **Security Considerations:**
- Company creation should be restricted to Super Admins in production
- Currently only OWNER can create companies via API
- Consider adding email verification for new companies
- Add company onboarding workflow

⚠️ **Data Consistency:**
- Always create at least one site for the company
- Create at least one OWNER user
- Set up basic categories and accounts
- Ensure isActive = true for new companies

⚠️ **Code Field:**
- Must be unique across all companies
- Automatically converted to uppercase
- Cannot be changed after creation
- Used for company identification

## Current API Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/companies` | GET | Get current user's company | All authenticated users |
| `/api/companies` | POST | Create new company | OWNER only |
| `/api/companies` | PUT | Update company details | OWNER/ADMIN |

## Quick Example: Create Test Company

```javascript
// 1. Login as owner@company.com
// 2. Run in browser console:

fetch('/api/companies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: "Test Company Inc",
    code: "TEST",
    email: "info@testcompany.com"
  })
}).then(r => r.json()).then(console.log)

// 3. Create seed script for complete setup
// 4. Login with new company user
// 5. Verify data isolation
```

## Future Enhancements

- [ ] Company registration page in frontend
- [ ] Email verification for new companies
- [ ] Company invitation system
- [ ] Multi-company support for users
- [ ] Company settings page
- [ ] Company logo upload
- [ ] Subscription/billing integration
- [ ] Company deletion with data export

---

**Need help?** See the [MULTI_TENANT_COMPLETE.md](MULTI_TENANT_COMPLETE.md) for full documentation.
