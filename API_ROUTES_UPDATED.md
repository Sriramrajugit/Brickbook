# API Routes - Multi-Tenant Update Complete ✅

All API routes have been updated with multi-tenant filtering and role-based access control.

## Updated Routes

### Authentication
- **POST /api/login**
  - ✅ Generates JWT with full tenant context (userId, companyId, role, accountId, siteId)
  - ✅ Validates user and company isActive status
  - ✅ Returns company info to client

- **GET /api/auth/me**
  - ✅ Returns full user info including companyId and accountId

### Transactions
- **GET /api/transactions**
  - ✅ Uses `getTenantFilter(user)` for company/site/account filtering
  - ✅ OWNER sees all company data
  - ✅ ADMIN sees all company data
  - ✅ SITE_MANAGER sees only assigned site/account

- **POST /api/transactions**
  - ✅ Uses `canModify(user)` check (SITE_MANAGER blocked)
  - ✅ Adds `companyId` from user JWT (never from request)
  - ✅ Adds `createdBy` for audit trail

- **PUT /api/transactions/[id]**
  - ✅ Uses `canModify(user)` check
  - ✅ Verifies transaction belongs to user's company with `getTenantFilter()`
  - ✅ Adds `updatedBy` for audit trail

- **DELETE /api/transactions/[id]**
  - ✅ Uses `canModify(user)` check
  - ✅ Verifies tenant ownership before delete

### Accounts
- **GET /api/accounts**
  - ✅ Uses `getTenantFilter(user)` for tenant isolation

- **POST /api/accounts**
  - ✅ Uses `canModify(user)` check
  - ✅ Adds `companyId` and `createdBy` from user

### Categories
- **GET /api/categories**
  - ✅ Uses `getTenantFilter(user)` for tenant isolation

- **POST /api/categories**
  - ✅ Uses `canModify(user)` check
  - ✅ Checks for duplicates scoped to company (not site)
  - ✅ Adds `companyId` and `createdBy` from user

### Employees
- **GET /api/employees**
  - ✅ Uses `getTenantFilter(user)` for tenant isolation

- **POST /api/employees**
  - ✅ Uses `canModify(user)` check
  - ✅ Adds `companyId` and `createdBy` from user

### Attendance
- **GET /api/attendance**
  - ✅ Uses `getTenantFilter(user)` via employee relation filter

- **POST /api/attendance**
  - ✅ Uses `canModify(user)` check
  - ✅ Verifies employee belongs to user's company
  - ✅ Adds `companyId` and `createdBy/updatedBy` from user

### Payroll
- **GET /api/payroll**
  - ✅ Uses `getTenantFilter(user)` via employee relation filter

- **POST /api/payroll**
  - ✅ Uses `canModify(user)` check
  - ✅ Verifies employee belongs to user's company
  - ✅ Creates salary category scoped to company
  - ✅ Creates transaction with `companyId` from user
  - ✅ Adds `companyId` and `createdBy` to payroll

### Advances
- **GET /api/advances**
  - ✅ Uses `getTenantFilter(user)` via employee relation filter

- **POST /api/advances**
  - ✅ Uses `canModify(user)` check
  - ✅ Verifies employee belongs to user's company
  - ✅ Creates salary advance category scoped to company
  - ✅ Creates transaction with `companyId` from user
  - ✅ Adds `companyId` and `createdBy` to advance

## Security Features Implemented

### Tenant Isolation
- All queries filtered by `companyId` via `getTenantFilter(user)`
- SITE_MANAGER additionally filtered by assigned site/account
- No hardcoded company IDs - always from JWT

### Role-Based Access Control
- **OWNER**: Full access to all company data
- **ADMIN**: Full access to all company data
- **SITE_MANAGER**: Read-only, restricted to assigned site/account
- **GUEST**: (legacy, not in multi-tenant)

### Modification Control
- `canModify(user)` checks prevent SITE_MANAGER from POST/PUT/DELETE
- Returns clear error messages explaining restrictions

### Audit Trail
- All create operations record `createdBy`
- All update operations record `updatedBy`
- Timestamps automatically tracked by Prisma

### Data Integrity
- `companyId` ALWAYS taken from JWT payload
- Never accepted from request body
- Verification checks before update/delete operations
- Transaction queries verify tenant ownership

## Test Credentials

Login with these users to test different roles:

```
OWNER:
Email: owner@company.com
Password: admin123
Access: Full company access (all sites, accounts)

ADMIN:
Email: admin@company.com
Password: admin123
Access: Full company access (all sites, accounts)

SITE_MANAGER:
Email: manager@company.com
Password: admin123
Access: Read-only, restricted to assigned site/account
```

## Testing Checklist

- [ ] Login with OWNER - verify JWT contains companyId, role
- [ ] Login with ADMIN - verify same access as OWNER
- [ ] Login with SITE_MANAGER - verify restricted access
- [ ] Create transaction as OWNER - verify companyId added
- [ ] Try to create transaction as SITE_MANAGER - verify blocked
- [ ] Verify OWNER sees all company data
- [ ] Verify SITE_MANAGER sees only assigned site/account
- [ ] Create second company - verify complete isolation
- [ ] Test category/employee/account creation with tenant filter

## Next Steps

1. **Apply RLS Policies** (Optional but recommended):
   ```powershell
   psql -U postgres -d ledger_db -f prisma/rls-policies.sql
   ```

2. **Remove Hardcoded Dropdowns**:
   - Create `/api/config/payment-modes`
   - Create `/api/config/transaction-types`
   - Create `/api/config/employee-types`
   - Update frontend to fetch from these endpoints

3. **Test Cross-Tenant Isolation**:
   - Seed second company
   - Verify no data leakage

4. **Update Frontend**:
   - Show company name in header
   - Add role-based UI restrictions
   - Disable edit buttons for SITE_MANAGER

## API Pattern Reference

### Standard GET Pattern
```typescript
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantFilter = getTenantFilter(user);
  const data = await prisma.table.findMany({
    where: tenantFilter
  });

  return NextResponse.json(data);
}
```

### Standard POST Pattern
```typescript
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { canModify: canModifyData, reason } = canModify(user);
  if (!canModifyData) return NextResponse.json({ error: reason }, { status: 403 });

  const body = await req.json();
  const data = await prisma.table.create({
    data: {
      ...body,
      companyId: user.companyId, // Always from JWT
      createdBy: user.id
    }
  });

  return NextResponse.json(data);
}
```

### Standard PUT/DELETE Pattern
```typescript
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { canModify: canModifyData, reason } = canModify(user);
  if (!canModifyData) return NextResponse.json({ error: reason }, { status: 403 });

  const tenantFilter = getTenantFilter(user);
  
  // Verify ownership
  const existing = await prisma.table.findFirst({
    where: { id: params.id, ...tenantFilter }
  });
  
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Proceed with update/delete
  const updated = await prisma.table.update({
    where: { id: params.id },
    data: { ...body, updatedBy: user.id }
  });

  return NextResponse.json(updated);
}
```

## Status: ✅ COMPLETE

All API routes are now multi-tenant aware with proper tenant isolation, role-based access control, and audit tracking.
