# Production Testing Guide - Ledger Application
**Date:** April 18, 2026  
**Version:** 1.0

---

## Quick Start Testing (5 minutes)

### Prerequisites
- Dev server running: `npm run dev` on port 3000
- Browser: Chrome, Firefox, Safari, or Edge
- Clean browser cache or Incognito window for fresh testing

---

## TEST SUITE 1: Authentication & Security (CRITICAL)

### Test 1.1: Unauthenticated Access Blocked
**What to test:** Direct URL access to protected route without login
```bash
# Terminal: Try accessing protected route without auth
Invoke-WebRequest -Uri "http://localhost:3000/attendance" -Method Get 2>&1
# Expected: Returns HTML (loading page), user redirected to login
```
**Manual test:**
1. Open Incognito/Private window
2. Visit `http://localhost:3000/attendance`
3. ✅ **PASS** if: Redirected to `/login` page
4. ❌ **FAIL** if: Can see attendance data without login

### Test 1.2: API Endpoints Require Authentication
**What to test:** Direct API access without token returns 401
```bash
# Test endpoint without auth
Invoke-WebRequest -Uri "http://localhost:3000/api/accounts/full" -Method Get -ErrorAction Continue 2>&1
# Expected: Error 401 Unauthorized
```
**Manual test:**
1. Open browser console (F12)
2. Copy your auth token from Application → Cookies → `auth-token`
3. Run in console: `fetch('/api/accounts/full').then(r => console.log(r.status))`
4. ✅ **PASS** if: Status is 200 (you're logged in, so token in browser)
5. Try in Incognito: `fetch('/api/accounts/full').then(r => console.log(r.status))`
6. ✅ **PASS** if: Status is 401 (no auth in Incognito)

### Test 1.3: Login Flow  
**Manual test:**
1. Go to `/login` page
2. Enter: **Email:** `admin` | **Password:** `admin`
3. Click **Login**
4. ✅ **PASS** if:
   - Redirected to dashboard
   - Can see account data
   - Session timer starts (see countdown in profile menu)

### Test 1.4: Logout Flow
**Manual test:**
1. While logged in, click profile menu (top right)
2. Click **Logout**
3. ✅ **PASS** if:
   - Redirected to login page
   - Auth token cleared from cookies
   - Cannot access dashboard anymore

---

## TEST SUITE 2: Dashboard (HIGH PRIORITY)

### Test 2.1: Dashboard Loads with Correct Data
**What to test:**
1. Login to dashboard
2. Check three cards at top:
   - **Total Budget:** Should show `₹NaN` ❌ or actual number ✅
   - **Total Cash In:** Should show transaction sum
   - **Total Cash Out:** Should show transaction sum

✅ **PASS** if: All show currency values (₹0.00 or actual amounts)

### Test 2.2: Account Summary Table
**What to test:**
1. Scroll down on dashboard
2. View "Account Summary" table
3. Check columns:
   - Account Name ✅
   - Type ✅
   - Budget (should have value) ✅
   - Cash In ✅
   - Cash Out ✅
   - Net Total ✅

✅ **PASS** if: All rows display with correct calculated values

### Test 2.3: Recent Transactions
**What to test:**
1. View "Recent Transactions" section
2. Should show last 5 transactions
3. Check date format (DD/MM/YYYY)
4. Check currency formatting (₹X,YZ,ABC.DE)

✅ **PASS** if: Transactions display correctly with proper formatting

---

## TEST SUITE 3: Transactions (HIGH PRIORITY)

### Test 3.1: Add Transaction
**Manual test:**
1. Navigate to **Transactions** page
2. Fill form:
   - Amount: `1000`
   - Category: `Expenses` (or any non-salary category)
   - Description: `Test transaction`
   - Date: Today's date
   - Account: `Main Project`
   - Type: Should auto-set to `Cash-Out` ✅
3. Click **Add Entry**
4. ✅ **PASS** if:
   - Green success message appears
   - Transaction added to list
   - Amount shows as ₹1,000.00

### Test 3.2: Add Salary Transaction (WITH Partner)
**Manual test:**
1. Navigate to **Transactions** page
2. Fill form:
   - Amount: `5000`
   - Category: `Salary` ← This is KEY
   - **Partner field appears** ✅
   - Select employee (e.g., "John Doe")
   - Description: Should auto-fill with `John Doe - Salary` ✅
   - Date: Today
   - Account: `Main Project`
3. Click **Add Entry**
4. ✅ **PASS** if:
   - Partner dropdown shows employee names
   - Transaction saved successfully

### Test 3.3: Edit Transaction
**Manual test:**
1. Find transaction in table
2. Click **Edit** button
3. Change amount to `2000`
4. Click **Update Entry**
5. ✅ **PASS** if:
   - Success message shows
   - Amount updated in table
   - Shows as ₹2,000.00

### Test 3.4: Category Filters
**Manual test:**
1. Go to **Transactions** page
2. Set filter: Category = `Salary`
3. Click **Apply**
4. ✅ **PASS** if:
   - Only Salary transactions show
   - Other categories hidden

### Test 3.5: Date Range Filter
**Manual test:**
1. Set Start Date and End Date
2. Click Apply
3. ✅ **PASS** if:
   - Only transactions in range show

---

## TEST SUITE 4: Accounts (MEDIUM PRIORITY)

### Test 4.1: View All Accounts
**Manual test:**
1. Go to **Accounts** page
2. View table with all accounts
3. Check columns: Name, Type, Budget, Address, City, State
4. ✅ **PASS** if:
   - All accounts display
   - Budget values show (not NaN)
   - All details visible

### Test 4.2: Create Account
**Manual test:**
1. Click **Add Account** button
2. Fill form:
   - Account Name: `Test Account`
   - Type: `General`
   - Budget: `10000`
   - Address: `123 Main St`
3. Click **Save**
4. ✅ **PASS** if:
   - Success message
   - Account appears in list
   - Budget shows as ₹10,000.00

---

## TEST SUITE 5: Employees (MEDIUM PRIORITY)

### Test 5.1: View Employees
**Manual test:**
1. Go to **Employees** page
2. View employee list
3. ✅ **PASS** if:
   - Employee names display
   - Partner type shows (Employee, Contractor, Supplier)
   - **NO salary data visible** ✅ (This is CRITICAL for security)

### Test 5.2: Salary Data Not Exposed
**What to verify:**
- Salary field: ❌ Should NOT be visible in UI
- Salary Frequency: ❌ Should NOT be visible in UI
- This prevents accidental exposure of sensitive compensation data

---

## TEST SUITE 6: API Security (CRITICAL)

### Test 6.1: Minimal Endpoints (Transactions Screen Uses)
```bash
# Test with auth in browser console
fetch('/api/accounts').then(r => r.json()).then(d => console.log(d))
# Expected: { data: [{id, name}, ...], pagination: {...} }
# Should NOT include: budget, address, dates
```

✅ **PASS** if: Only `id` and `name` returned

### Test 6.2: Full Endpoints (Admin Screens Use)
```bash
fetch('/api/accounts/full').then(r => r.json()).then(d => console.log(d))
# Expected: { data: [{id, name, budget, address, type, ...}, ...], pagination: {...} }
```

✅ **PASS** if: Full account data returned (for dashboard/reports)

### Test 6.3: Employees Minimal Includes partnerType
```bash
fetch('/api/employees/minimal').then(r => r.json()).then(d => console.log(d))
# Expected: [{id, name, partnerType}, ...]
```

✅ **PASS** if: `partnerType` field present (needed for transaction category filtering)

### Test 6.4: No Salary Exposed in Any Endpoint
```bash
fetch('/api/employees').then(r => r.json()).then(d => console.log(d[0]))
# Should NOT have: salary, salaryFrequency
```

❌ **FAIL** if: `salary` or `salaryFrequency` visible in response

---

## TEST SUITE 7: Multi-Tenancy (CRITICAL FOR SaaS)

### Test 7.1: User Data Isolation
**What to test:** User A cannot see User B's data

**Manual test:**
1. Login as User A (email: `admin`)
2. Note company: Should be visible in profile
3. View accounts, employees, transactions
4. Logout
5. Login as User B (if available)
6. ✅ **PASS** if: Completely different data shown (different company)

**API test:**
1. Every database query filters by `companyId`
2. Check server logs for: `Fetching accounts for companyId: 1`
3. ✅ **PASS** if: All queries include companyId filter

---

## TEST SUITE 8: Error Handling (MEDIUM PRIORITY)

### Test 8.1: Form Validation
**Manual test:**
1. Try adding transaction with empty Amount
2. ✅ **PASS** if: Shows validation error "Amount is required"

### Test 8.2: Future Date Prevention
**Manual test:**
1. Try to add transaction with tomorrow's date
2. ✅ **PASS** if: Shows error "Future date transactions not allowed"

### Test 8.3: API Error Handling
**Manual test:**
1. Go to Transactions page
2. Open browser Network tab
3. Add a transaction
4. ✅ **PASS** if:
   - Failed requests show user-friendly error message
   - Console shows detailed error in logs
   - User not blocked by technical errors

---

## TEST SUITE 9: Performance (LOW PRIORITY)

### Test 9.1: Page Load Time
**Manual test:**
1. Open browser DevTools → Network tab
2. Refresh dashboard
3. Check page load time

✅ **PASS** if:
- Dashboard loads < 2 seconds
- CSS/JS cached properly
- Images compressed

### Test 9.2: No N+1 Query Problems
**Check server logs:**
1. Opening Transactions page should NOT run 1000s of queries
2. Should batch load related data

---

## TESTING CHECKLIST

Copy and paste to mark as you test:

```
AUTHENTICATION & SECURITY
  [ ] Test 1.1 - Unauthenticated access blocked
  [ ] Test 1.2 - API endpoints return 401 without auth
  [ ] Test 1.3 - Login flow works
  [ ] Test 1.4 - Logout flow works

DASHBOARD  
  [ ] Test 2.1 - Dashboard shows correct data (no NaN)
  [ ] Test 2.2 - Account Summary table displays
  [ ] Test 2.3 - Recent Transactions format correct

TRANSACTIONS
  [ ] Test 3.1 - Add transaction
  [ ] Test 3.2 - Add Salary transaction with Partner
  [ ] Test 3.3 - Edit transaction
  [ ] Test 3.4 - Category filter works
  [ ] Test 3.5 - Date range filter works

ACCOUNTS
  [ ] Test 4.1 - View all accounts
  [ ] Test 4.2 - Create account

EMPLOYEES
  [ ] Test 5.1 - View employees (no salary data)
  [ ] Test 5.2 - Salary data NOT exposed

API SECURITY
  [ ] Test 6.1 - Minimal endpoints restrict fields
  [ ] Test 6.2 - Full endpoints return complete data
  [ ] Test 6.3 - Employee minimal has partnerType
  [ ] Test 6.4 - No salary exposed in any endpoint

MULTI-TENANCY
  [ ] Test 7.1 - User data properly isolated

ERROR HANDLING
  [ ] Test 8.1 - Form validation works
  [ ] Test 8.2 - Future dates prevented
  [ ] Test 8.3 - API errors handled gracefully

PERFORMANCE
  [ ] Test 9.1 - Pages load < 2 seconds
  [ ] Test 9.2 - No N+1 query problems
```

---

## CRITICAL FIXES APPLIED IN THIS SESSION

| Issue | Status | Details |
|-------|--------|---------|
| Authentication Bypass | ✅ FIXED | Protected pages now require auth verification before rendering |
| API Data Exposure | ✅ FIXED | All endpoints return 401 without valid authentication token |
| Partner Field Blank | ✅ FIXED | `/api/employees/minimal` now includes `partnerType` for category filtering |
| Dashboard Budget NaN | ✅ FIXED | Dashboard now uses `/api/accounts/full` instead of minimal endpoint |
| Salary Data Exposed | ✅ FIXED | Salary fields removed from employee endpoints |

---

## PRODUCTION READINESS CRITERIA

✅ **PASS** all items below before deploying to production:

- [ ] All 10 test suites pass
- [ ] No sensitive data exposed in any API response
- [ ] All protected routes require authentication
- [ ] Multi-tenancy isolation verified
- [ ] Error messages don't expose technical details
- [ ] Performance acceptable (< 2s page load)
- [ ] Database backups configured
- [ ] Environment variables secured (no secrets in code)
- [ ] HTTPS/SSL enabled in production
- [ ] Rate limiting configured
- [ ] Logging and monitoring configured
- [ ] Disaster recovery plan documented

---

## RELATED DOCUMENTATION

- See [AUTH-SETUP.md](./Documents/AUTH-SETUP.md) for authentication architecture
- See [API_SECURITY_PROTECTION.md](./Documents/API_SECURITY_PROTECTION.md) for API security details  
- See [DEPLOYMENT_GUIDE.md](./Documents/DEPLOYMENT_GUIDE.md) for production deployment steps

---

## Notes

- **Dev Server Port:** 3000 (available on network: `http://0.0.0.0:3000`)
- **Database:** PostgreSQL (connection string in `.env`)
- **JWT Secret:** Must be strong and unique in production
- **Session Timeout:** 15 minutes (configurable)
- **Hot Reload:** Enabled - changes apply immediately

---

**Next Steps:**
1. Run through all test suites above
2. Document any issues found
3. Fix any failing tests
4. Get sign-off from stakeholders
5. Plan production deployment
