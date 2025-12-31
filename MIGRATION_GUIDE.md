# Multi-Tenant Migration Guide

## Overview
This guide walks through migrating from site-based to company-based multi-tenant architecture with strict tenant isolation.

## Phase 1: Backup Current Database

```powershell
cd "c:\My Data\Workspace\Ledger\web"
.\scripts\backup-database.ps1
```

## Phase 2: Apply Schema Changes

### Step 1: Create Migration
```powershell
npx prisma migrate dev --name add_multitenant_architecture --create-only
```

### Step 2: Review Migration File
The migration will:
- Add `companies` table
- Add `companyId` to all business tables
- Add `ADMIN` role
- Add `accountId` to User table
- Add `isActive` flags
- Create indexes for tenant filtering

### Step 3: Data Migration
Before applying the migration, we need to migrate existing data.

**IMPORTANT**: The migration will fail if you don't provide default values for `companyId`.

Edit the migration SQL to include:

```sql
-- Step 1: Create companies table
CREATE TABLE "companies" (...);

-- Step 2: Insert default company
INSERT INTO "companies" (id, name, code, "isActive", "createdAt", "updatedAt")
VALUES (1, 'Default Company', 'DEFAULT', true, NOW(), NOW());

-- Step 3: Add companyId column with default
ALTER TABLE "sites" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "accounts" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "categories" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "transactions" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "employees" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "attendances" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "payrolls" ADD COLUMN "companyId" INTEGER DEFAULT 1;
ALTER TABLE "advances" ADD COLUMN "companyId" INTEGER DEFAULT 1;

-- Step 4: Update existing data
UPDATE "sites" SET "companyId" = 1;
UPDATE "users" SET "companyId" = 1;
UPDATE "accounts" SET "companyId" = 1 WHERE "companyId" IS NULL;
UPDATE "categories" SET "companyId" = 1 WHERE "companyId" IS NULL;
UPDATE "transactions" 
SET "companyId" = (
  SELECT "companyId" FROM "accounts" WHERE "accounts".id = "transactions"."accountId"
);
UPDATE "employees" SET "companyId" = 1 WHERE "companyId" IS NULL;
UPDATE "attendances"
SET "companyId" = (
  SELECT "companyId" FROM "employees" WHERE "employees".id = "attendances"."employeeId"
);
UPDATE "payrolls"
SET "companyId" = (
  SELECT "companyId" FROM "employees" WHERE "employees".id = "payrolls"."employeeId"
);
UPDATE "advances"
SET "companyId" = (
  SELECT "companyId" FROM "employees" WHERE "employees".id = "advances"."employeeId"
);

-- Step 5: Make companyId NOT NULL
ALTER TABLE "sites" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "accounts" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "transactions" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "employees" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "attendances" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "payrolls" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "advances" ALTER COLUMN "companyId" SET NOT NULL;

-- Step 6: Add foreign keys and indexes
ALTER TABLE "sites" ADD CONSTRAINT "sites_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;

-- ... (repeat for all tables)

-- Step 7: Create indexes
CREATE INDEX "sites_companyId_idx" ON "sites"("companyId");
CREATE INDEX "users_companyId_idx" ON "users"("companyId");
-- ... (repeat for all tables)
```

### Step 4: Apply Migration
```powershell
npx prisma migrate dev
```

### Step 5: Generate Prisma Client
```powershell
npx prisma generate
```

## Phase 3: Apply Row Level Security

```powershell
# Apply RLS policies
psql -U postgres -d ledger_db -f prisma/rls-policies.sql
```

## Phase 4: Update Application Code

### Step 1: Update Auth Module
Replace `lib/auth.ts` with `lib/auth-enhanced.ts`:

```powershell
mv web/lib/auth.ts web/lib/auth.ts.backup
mv web/lib/auth-enhanced.ts web/lib/auth.ts
```

### Step 2: Update All API Routes

**Pattern for ALL API routes:**

```typescript
import { getCurrentUser, getTenantFilter, canModify } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get tenant filter
  const tenantFilter = getTenantFilter(user)

  // Query with tenant filtering
  const data = await prisma.table.findMany({
    where: {
      ...tenantFilter,
      // other filters
    }
  })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !canModify(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  
  // NEVER accept companyId from request body
  const data = await prisma.table.create({
    data: {
      ...body,
      companyId: user.companyId, // Always from JWT
      createdBy: user.id
    }
  })

  return NextResponse.json(data)
}
```

### Step 3: Update Login API

```typescript
// app/api/auth/login/route.ts
import { generateToken } from '@/lib/auth'

const payload = {
  userId: user.id,
  companyId: user.companyId,
  role: user.role,
  accountId: user.accountId,
  siteId: user.siteId
}

const token = generateToken(payload)
```

### Step 4: Update Frontend Dropdowns

**Remove hardcoded values from all dropdowns:**

```typescript
// Before (WRONG):
<option value="Cash">Cash</option>
<option value="G-Pay">G-Pay</option>

// After (CORRECT):
const [paymentModes, setPaymentModes] = useState([])

useEffect(() => {
  fetch('/api/config/payment-modes')
    .then(res => res.json())
    .then(data => setPaymentModes(data))
}, [])

{paymentModes.map(mode => (
  <option key={mode.id} value={mode.value}>{mode.label}</option>
))}
```

## Phase 5: Create Configuration API

Create `/api/config` routes for all dropdown values:

```typescript
// app/api/config/payment-modes/route.ts
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Fetch from config table filtered by company
  const modes = await prisma.config.findMany({
    where: {
      companyId: user.companyId,
      type: 'PAYMENT_MODE',
      isActive: true
    }
  })
  
  return NextResponse.json(modes)
}
```

## Phase 6: Testing

### Test Checklist
- [ ] Create new company
- [ ] Create users for new company
- [ ] Verify OWNER sees all company data
- [ ] Verify ADMIN sees all company data
- [ ] Verify SITE_MANAGER sees only assigned site/account
- [ ] Verify SITE_MANAGER cannot UPDATE/DELETE
- [ ] Verify cross-company data is completely isolated
- [ ] Verify RLS policies are enforced
- [ ] Test all dropdowns load from database
- [ ] Test JWT contains correct tenant context

### Security Audit
```sql
-- Check for any queries missing companyId filter
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%transactions%' 
AND query NOT LIKE '%companyId%';
```

## Phase 7: Documentation

Update README with:
- New role definitions
- Multi-tenant architecture overview
- Security best practices
- API documentation

## Rollback Plan

If issues occur:

```powershell
# Restore from backup
cd "c:\My Data\Workspace\Ledger\web"
.\scripts\restore-database.ps1

# Reset migration
npx prisma migrate reset
```

## Post-Migration

1. Review all API routes for tenant filtering
2. Enable RLS monitoring
3. Set up audit logging
4. Train users on new role structure
5. Monitor query performance with new indexes

## Support

For issues during migration:
1. Check migration logs
2. Verify RLS policies are applied
3. Test with different user roles
4. Review JWT payload in browser DevTools
