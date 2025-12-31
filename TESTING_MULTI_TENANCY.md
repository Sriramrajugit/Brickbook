# Multi-Tenancy Testing Guide

## Test Credentials

### Site A (siteId = 2)
- **Email:** manager.a@example.com
- **Password:** manager123
- **Site:** Site A - Location A

### Site B (siteId = 3)
- **Email:** manager.b@example.com
- **Password:** manager123
- **Site:** Site B - Location B

### Owner (All Sites)
- **Email:** owner@example.com
- **Password:** owner123
- **Site:** Can access all sites

---

## Testing Steps

### Step 1: Test Site A Isolation

1. **Login to Site A**
   - Navigate to http://localhost:3000/login
   - Email: `manager.a@example.com`
   - Password: `manager123`

2. **Create Test Employee for Site A**
   - Go to Employees page
   - Click "Add Employee"
   - Name: `John Doe - Site A`
   - Employee Type: `Mason`
   - Salary: `25000`
   - Status: `Active`
   - Save

3. **Create Test Category for Site A**
   - Go to Categories page (if exists) or check dashboard
   - Create category: `Site A Expense`

4. **Verify Dashboard**
   - Check that dashboard shows Site A data
   - Note the counts (employees, accounts, transactions)

5. **Logout**

---

### Step 2: Test Site B Isolation

1. **Login to Site B**
   - Navigate to http://localhost:3000/login
   - Email: `manager.b@example.com`
   - Password: `manager123`

2. **Verify Site A Employee is NOT Visible**
   - Go to Employees page
   - ✅ **CRITICAL CHECK:** "John Doe - Site A" should NOT appear
   - Should see only Site B employees (or empty if none created)

3. **Create Test Employee for Site B**
   - Click "Add Employee"
   - Name: `Jane Smith - Site B`
   - Employee Type: `Carpenter`
   - Salary: `30000`
   - Status: `Active`
   - Save

4. **Verify Dashboard**
   - Dashboard should show only Site B data
   - Counts should be different from Site A

5. **Test Other Pages**
   - **Accounts:** Should show only Site B accounts
   - **Transactions:** Should show only Site B transactions
   - **Attendance:** Should show only Site B employees
   - **Payroll:** Should calculate only for Site B employees
   - **Reports:** Should aggregate only Site B data

---

### Step 3: Cross-Verification

1. **Login back to Site A**
   - Email: `manager.a@example.com`
   - Password: `manager123`

2. **Verify Site B Employee is NOT Visible**
   - Go to Employees page
   - ✅ **CRITICAL CHECK:** "Jane Smith - Site B" should NOT appear
   - Should only see "John Doe - Site A"

3. **Test API Direct Access (Advanced)**
   - Open browser DevTools > Network tab
   - Go to Employees page
   - Check `/api/employees` request
   - Verify response only contains Site A employees
   - Note: Even if you manually call `/api/employees`, you should only get Site A data

---

## Expected Results

### ✅ Pass Criteria

- [ ] Site A user can create and see Site A data
- [ ] Site B user can create and see Site B data
- [ ] Site A user CANNOT see Site B data
- [ ] Site B user CANNOT see Site A data
- [ ] Dashboard stats are isolated per site
- [ ] Reports show only site-specific data
- [ ] Employees list is filtered by site
- [ ] Attendance only shows site-specific employees
- [ ] Payroll calculations are site-specific
- [ ] Transactions are filtered by site (through accounts)
- [ ] API endpoints return 401 for unauthorized access
- [ ] No cross-site data leakage in any page

### ❌ Fail Criteria

- Site A user can see Site B employee
- Site B user can see Site A employee
- Dashboard shows combined data from multiple sites
- API returns data from other sites
- Cross-site data visible in any page

---

## Troubleshooting

### Issue: Can't see any data after login
**Solution:** Make sure you're logged in as the correct site user. Check browser console for 401 errors.

### Issue: Seeing data from other sites
**Solution:** This is a CRITICAL security bug. Check the API route implementation for missing siteId filter.

### Issue: Getting 401 errors
**Solution:** Token might be expired. Logout and login again.

---

## Next Steps After Testing

If all tests pass:
1. Mark Phase 4 (Testing) as ✅ Complete
2. Proceed to Phase 3: Site Management UI (optional)
3. Document any issues found and fix them
4. Consider additional edge case testing

If tests fail:
1. Document which test failed
2. Check the specific API route for missing siteId filter
3. Review the API implementation guide in MULTI_TENANCY_GUIDE.md
4. Fix and re-test
