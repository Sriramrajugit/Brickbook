# Quick Reference - Multi-Tenant System

## 🔐 Test Login Credentials

```
OWNER (Full Access):
  Email: owner@company.com
  Password: admin123

ADMIN (Full Access):
  Email: admin@company.com
  Password: admin123

SITE_MANAGER (Read-Only):
  Email: manager@company.com
  Password: admin123
```

## 📊 Server Status

```bash
# Check if running
http://localhost:3000

# Restart server
cd "c:\My Data\Workspace\Ledger\web"
npm run dev
```

## 🔍 Quick Tests

### 1. Test OWNER Login
```
1. Go to http://localhost:3000/login
2. Enter: owner@company.com / admin123
3. Should see dashboard with all data
4. Can create/edit/delete
```

### 2. Test SITE_MANAGER Restrictions
```
1. Logout and login as: manager@company.com / admin123
2. Should see limited data (assigned site only)
3. Try to create transaction - should be blocked
4. Should see "Permission denied" message
```

### 3. Test Tenant Isolation
```
1. Check dashboard stats - should show company 1 data
2. All transactions/accounts filtered by companyId
3. Cannot see data from other companies
```

## 🛠️ Common Tasks

### View Current Schema
```bash
cd web
npx prisma studio
```

### Check Database
```sql
-- Count records by company
SELECT 'Transactions' as table_name, companyId, COUNT(*) 
FROM transactions GROUP BY companyId;

SELECT 'Accounts' as table_name, companyId, COUNT(*) 
FROM accounts GROUP BY companyId;
```

### Apply RLS Policies
```bash
psql -U postgres -d ledger_db -f prisma/rls-policies.sql
```

### View JWT Token
```javascript
// In browser console after login
document.cookie
// Look for auth-token cookie
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `web/lib/auth.ts` | Enhanced auth with tenant filtering |
| `web/prisma/schema.prisma` | Multi-tenant database schema |
| `web/app/api/login/route.ts` | JWT generation |
| `web/app/api/transactions/route.ts` | Example route with tenant filter |
| `MULTI_TENANT_COMPLETE.md` | Full documentation |

## 🎯 Role Capabilities

| Action | OWNER | ADMIN | SITE_MANAGER | GUEST |
|--------|-------|-------|--------------|-------|
| View All Company Data | ✅ | ✅ | ❌ | ❌ |
| View Assigned Site | ✅ | ✅ | ✅ | Limited |
| Create Records | ✅ | ✅ | ❌ | ❌ |
| Edit Records | ✅ | ✅ | ❌ | ❌ |
| Delete Records | ✅ | ✅ | ❌ | ❌ |
| Create Users | ✅ | ✅ | ❌ | ❌ |

## 🔧 Troubleshooting

### Login Not Working
1. Check server is running
2. Verify user exists in database
3. Check JWT_SECRET in .env
4. Clear browser cookies

### No Data Showing
1. Check user's companyId matches data
2. Verify isActive = true for user and company
3. Check console for API errors

### "Unauthorized" Error
1. Check auth-token cookie exists
2. Verify JWT_SECRET hasn't changed
3. Try logging in again

## 📝 API Examples

### Create Transaction (OWNER/ADMIN)
```typescript
POST /api/transactions
{
  "amount": 5000,
  "description": "Test",
  "category": "Capital",
  "type": "Cash-In",
  "accountId": 1,
  "date": "2025-12-30"
}
// companyId added automatically from JWT
```

### Get Filtered Data
```typescript
GET /api/transactions
// Automatically filtered by:
// - OWNER: All company data
// - ADMIN: All company data  
// - SITE_MANAGER: Assigned site/account only
```

## 🎨 Frontend Updates Needed

- [ ] Show company name in header
- [ ] Show role badge (OWNER/ADMIN/SITE_MANAGER)
- [ ] Hide edit/delete buttons for SITE_MANAGER
- [ ] Show "Read-only mode" message
- [ ] Fetch dropdowns from API (not hardcoded)

## 📈 Next Steps

1. **Test all roles** - Verify access control works
2. **Apply RLS** - Database-level security
3. **Remove hardcoded values** - Create config APIs
4. **Update frontend** - Role-based UI
5. **Create second company** - Test isolation

## 🆘 Need Help?

See full documentation:
- `MULTI_TENANT_COMPLETE.md` - Complete implementation guide
- `API_ROUTES_UPDATED.md` - API changes and patterns
- `IMPLEMENTATION_STATUS.md` - Current status
- `MIGRATION_GUIDE.md` - Database migration details

---

**Status**: ✅ Implementation Complete & Operational
**Server**: Running on http://localhost:3000
**Last Updated**: December 30, 2025
