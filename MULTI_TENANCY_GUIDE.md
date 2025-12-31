# Multi-Tenancy Implementation Guide

## Overview
This application now supports multi-tenancy where different clients (sites) can use the same system with complete data isolation.

## Current Implementation Status

### ✅ Completed - Phase 1
1. **Database Schema**
   - `Site` model exists with relationships to User and Account
   - `siteId` added to Employee and Category models with default value of 1
   - Users are linked to sites via `siteId`

2. **Authentication**
   - `getCurrentUser()` already returns siteId
   - Auth system tracks which site a user belongs to

3. **API Route Security** ✅ **PHASE 1 COMPLETE**
   - All API endpoints now filter by user's siteId
   - Unauthorized access returns 401
   - Create operations automatically set siteId
   - Update/Delete operations verify record belongs to user's site
   - Complete data isolation between sites

### ✅ Completed - Phase 2
**Seed Data Updated:**
- Default site (siteId = 1) exists as "Main Office"
- All existing employees (5) linked to default site
- All existing categories (15) linked to default site
- All existing transactions (436) linked to default site via accounts
- Verification: 0 orphaned records
- Additional test sites created: Site A (id=2), Site B (id=3)
- Test users created for each site: manager.a@example.com, manager.b@example.com

### ✅ Completed - Phase 4: Testing
**Multi-Tenancy Isolation Verified:**
- ✅ Site A user can create and view Site A data only
- ✅ Site B user can create and view Site B data only
- ✅ Cross-site data completely isolated (Site A cannot see Site B employee and vice versa)
- ✅ Dashboard stats filtered by site
- ✅ Employees page filtered by site
- ✅ Transactions filtered by site (through accounts)
- ✅ Attendance filtered by site (through employees)
- ✅ API endpoints return 401 for unauthorized access
- ✅ No data leakage detected across all tested pages
- **Test Results**: See TESTING_MULTI_TENANCY.md for detailed test cases

**Current Data Distribution:**
- Site 1 (Main Office): 5 employees, 15 categories, 436 transactions
- Site A: 1 employee, 0 transactions
- Site B: 1 employee, 0 transactions

### 🚧 Remaining Phases (Optional)

## Step-by-Step Implementation Plan

### Phase 1: Enforce Site Filtering in API Routes (HIGH PRIORITY)

**All API routes must filter by siteId:**

Example for `/api/employees/route.ts`:
```typescript
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || !user.siteId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const employees = await prisma.employee.findMany({
    where: { siteId: user.siteId }, // 👈 Site filter
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.siteId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await req.json()
  
  const employee = await prisma.employee.create({
    data: {
      ...data,
      siteId: user.siteId // 👈 Always set siteId
    }
  })

  return NextResponse.json(employee)
}
```

**Apply this pattern to:**
- ✅ `/api/accounts` - COMPLETED
- ✅ `/api/employees` - COMPLETED
- ✅ `/api/categories` - COMPLETED
- ✅ `/api/transactions` - COMPLETED (filters by account's siteId)
- ✅ `/api/attendance` - COMPLETED (filters through employee's siteId)
- ✅ `/api/dashboard/stats` - COMPLETED
- ✅ `/api/accounts/stats` - COMPLETED

**Note:** `/api/payroll` doesn't exist as a separate endpoint - payroll calculations happen client-side with filtered data.

### Phase 2: Update Seed Data

Create default site if it doesn't exist:

```typescript
// prisma/seed.ts
const defaultSite = await prisma.site.upsert({
  where: { name: 'Default Site' },
  update: {},
  create: {
    name: 'Default Site',
    location: 'Main Office'
  }
})

// Update existing records to link to default site
await prisma.employee.updateMany({
  where: { siteId: null },
  data: { siteId: defaultSite.id }
})

await prisma.category.updateMany({
  where: { siteId: null },
  data: { siteId: defaultSite.id }
})
```

### Phase 3: Site Management UI

Create `/app/admin/sites/page.tsx` for OWNER role:

**Features:**
- List all sites
- Create new site
- Edit site details
- View users per site
- Deactivate/archive sites

### Phase 4: User Management Enhancement

Update `/app/admin/users/page.tsx`:

**Features:**
- Assign users to sites
- OWNER can see all sites
- SITE_MANAGER only sees their site
- When creating user, assign siteId

### Phase 5: Site Selector (Optional)

For OWNER role who manages multiple sites:

```typescript
// Add to header/navbar
{user.role === 'OWNER' && (
  <select onChange={(e) => switchSite(e.target.value)}>
    {sites.map(site => (
      <option key={site.id} value={site.id}>{site.name}</option>
    ))}
  </select>
)}
```

### Phase 6: Registration Flow

When new client signs up:

1. Create new Site
2. Create OWNER user for that site
3. Link user to site via siteId
4. User can only see their site's data

## Security Checklist

- [ ] All API GET endpoints filter by user's siteId
- [ ] All API POST endpoints set siteId from authenticated user
- [ ] All API PUT/PATCH endpoints verify record belongs to user's site
- [ ] All API DELETE endpoints verify record belongs to user's site
- [ ] Dashboard stats API filters by siteId
- [ ] Reports filter by siteId
- [ ] No direct database queries without site filter
- [ ] SQL injection protection (Prisma handles this)
- [ ] Cannot access other site's data even with direct API calls

## Testing Plan

1. **Create Test Sites:**
   ```sql
   INSERT INTO sites (name, location) VALUES 
   ('Site A', 'Location A'),
   ('Site B', 'Location B');
   ```

2. **Create Test Users:**
   ```sql
   INSERT INTO users (email, name, password, role, "siteId") VALUES 
   ('usera@site.com', 'User A', 'hash', 'OWNER', 1),
   ('userb@site.com', 'User B', 'hash', 'OWNER', 2);
   ```

3. **Verify Isolation:**
   - Login as User A, create employee
   - Login as User B, should NOT see User A's employee
   - Verify all pages respect site boundaries

## Migration for Existing Customers

If you have existing data:

1. Create a site for each existing customer
2. Run SQL to assign records to appropriate sites:
   ```sql
   UPDATE employees SET "siteId" = 1 WHERE "siteId" IS NULL;
   UPDATE categories SET "siteId" = 1 WHERE "siteId" IS NULL;
   ```

## Next Steps

1. Start with Phase 1 - Add siteId filtering to all API routes
2. Test with 2 different sites
3. Implement site management UI
4. Create onboarding flow for new clients
5. Document for your team

## Questions to Answer

- **How will new clients sign up?** Self-service or admin creates them?
- **Pricing model?** Per site? Per user?
- **Data migration?** Existing customers get separate sites?
- **Subdomain per site?** e.g., clienta.yourapp.com vs yourapp.com/clienta
- **Branding?** Each site has own logo/colors?

Would you like me to start implementing Phase 1 (API route filtering)?
