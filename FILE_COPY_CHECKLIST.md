# 📋 FILE COPY CHECKLIST - Production Deployment
**Start Date**: 2026-08-25  
**Direction**: app/ (local) → web/ (production)  
**Safety**: NO FILES DELETED - ADDITIVE ONLY

---

## 🔴 PHASE 1: DATABASE SCHEMA (DO FIRST)

### Step 1: Update `web/prisma/schema.prisma`

**Location**: Line order (find and update accordingly)

#### 1.1 Add Enums after existing enums (around line 500+)
```
✓ BillStatus enum (UNPAID, PARTIALLY_PAID, FULLY_PAID)
✓ PaymentMode enum (GPAY, BANK_TRANSFER, CASH, CHEQUE, UPI, NEFT, RTGS, IMPS)
```

#### 1.2 Update `Company` model relations
Add these fields to the relations section:
```
✓ partnerBills      PartnerBill[]
✓ partnerBillPayments PartnerBillPayment[]
✓ partners          Partner[]
✓ suppliers         Supplier[]
✓ items             Item[]
```

#### 1.3 Update `Employee` model
Add relation:
```
✓ partnerBills      PartnerBill[]
```

#### 1.4 Add New Models (copy from local schema.prisma lines 462-530)
```
✓ PartnerBill model
✓ PartnerBillPayment model
✓ Partner model
✓ Supplier model
✓ Item model
```

**Verification**:
```bash
cd web/
npx prisma generate  # Should complete without errors
```

---

## 🟠 PHASE 2: CREATE & RUN MIGRATION

### Step 2: Database Migration
```bash
cd web/
npx prisma migrate dev --name add_bills_partners_module
# Follow prompts and confirm migration
```

**Expected Output**:
```
✓ Migration 20260825XXXXX_add_bills_partners_module created
✓ Applied to database
```

**Verify Migration**:
```bash
npx prisma studio  # Should show new tables
```

---

## 🟡 PHASE 3: COPY UI PAGES & API ROUTES

### **MODULE 1: TRANSACTIONS + ACCOUNT FILTER**

| From (Local) | To (Production) | Status |
|-------------|-----------------|--------|
| `app/transactions/page.tsx` | `web/app/transactions/page.tsx` | ✏️ |
| `app/api/transactions/route.ts` | `web/app/api/transactions/route.ts` | ✏️ |
| `app/api/transactions/[id]/route.ts` | `web/app/api/transactions/[id]/route.ts` | ✏️ |

**What to Copy**:
- ✅ Account filter state and logic
- ✅ Account filter dropdown UI
- ✅ Account column in table
- ✅ API account filtering by `accountId`

---

### **MODULE 2: BILLS & INVOICES** (NEW)

| From (Local) | To (Production) | Status | Notes |
|-------------|-----------------|--------|-------|
| `app/bills/page.tsx` | `web/app/bills/page.tsx` | ✏️ | NEW file |
| `app/api/bills/route.ts` | `web/app/api/bills/route.ts` | ✏️ | NEW file |
| `app/api/bills/[id]/route.ts` | `web/app/api/bills/[id]/route.ts` | ✏️ | NEW file |
| `app/api/bills/[id]/payments/route.ts` | `web/app/api/bills/[id]/payments/route.ts` | ✏️ | NEW file |
| `app/api/bills/upload/route.ts` | `web/app/api/bills/upload/route.ts` | ✏️ | NEW file |
| `app/api/bills/ocr/route.ts` | `web/app/api/bills/ocr/route.ts` | ✏️ | NEW file |

**Directory Structure**:
```
web/app/
├── bills/
│   └── page.tsx
└── api/
    └── bills/
        ├── route.ts
        ├── [id]/
        │   ├── route.ts
        │   └── payments/
        │       └── route.ts
        ├── upload/
        │   └── route.ts
        └── ocr/
            └── route.ts
```

---

### **MODULE 3: PAYROLL**

| From (Local) | To (Production) | Status |
|-------------|-----------------|--------|
| `app/payroll/page.tsx` | `web/app/payroll/page.tsx` | ✏️ |
| `app/api/payroll/route.ts` | `web/app/api/payroll/route.ts` | ✏️ |
| `app/api/payroll/[id]/route.ts` | `web/app/api/payroll/[id]/route.ts` | ✏️ |

**What to Check**:
- ✅ Bug fixes applied
- ✅ Salary calculations correct
- ✅ Advance deduction logic
- ✅ OT calculations

---

### **MODULE 4: ATTENDANCE**

| From (Local) | To (Production) | Status |
|-------------|-----------------|--------|
| `app/attendance/page.tsx` | `web/app/attendance/page.tsx` | ✏️ |
| `app/api/attendance/route.ts` | `web/app/api/attendance/route.ts` | ✏️ |
| `app/api/attendance/[id]/route.ts` | `web/app/api/attendance/[id]/route.ts` | ✏️ |

**What to Check**:
- ✅ Status tracking fixes
- ✅ OT eligibility logic
- ✅ Date range calculations

---

### **MODULE 5: EMPLOYEES**

| From (Local) | To (Production) | Status |
|-------------|-----------------|--------|
| `app/employees/page.tsx` | `web/app/employees/page.tsx` | ✏️ |
| `app/api/employees/route.ts` | `web/app/api/employees/route.ts` | ✏️ |
| `app/api/employees/[id]/route.ts` | `web/app/api/employees/[id]/route.ts` | ✏️ |
| `app/api/employees/minimal/route.ts` | `web/app/api/employees/minimal/route.ts` | ✏️ |

**What to Check**:
- ✅ New employee fields
- ✅ Partner type logic
- ✅ Email, phone, address fields

---

### **MODULE 6: PARTNERS** (NEW)

| From (Local) | To (Production) | Status | Notes |
|-------------|-----------------|--------|-------|
| `app/partners/page.tsx` | `web/app/partners/page.tsx` | ✏️ | NEW file |
| `app/api/partners/route.ts` | `web/app/api/partners/route.ts` | ✏️ | NEW file |
| `app/api/partners/[id]/route.ts` | `web/app/api/partners/[id]/route.ts` | ✏️ | NEW file |

**Directory Structure**:
```
web/app/
├── partners/
│   └── page.tsx
└── api/
    └── partners/
        ├── route.ts
        └── [id]/
            └── route.ts
```

---

## 🟢 PHASE 4: COPY SHARED LIBRARIES & UTILITIES

| From (Local) | To (Production) | Status | Priority |
|-------------|-----------------|--------|----------|
| `lib/transactionConfig.ts` | `web/lib/transactionConfig.ts` | ✏️ | HIGH |
| `lib/formDataUtils.ts` | `web/lib/formDataUtils.ts` | ✏️ | MEDIUM |
| `lib/formatters.ts` | `web/lib/formatters.ts` | ✏️ | MEDIUM |
| `app/components/ProfileMenu.tsx` | `web/app/components/ProfileMenu.tsx` | ✏️ | MEDIUM |

**Note**: Only copy if modified from production version

---

## 🟣 PHASE 5: UPDATE NAVIGATION

### File: `web/app/components/Navigation.tsx`

**Add These Links** (if not already present):
```
✓ /bills → "Bills & Invoices"
✓ /partners → "Partners"
```

Also update:
- `web/app/components/MobileNav.tsx` - Add same links for mobile

---

## 📋 TOTAL FILES TO COPY

### By Module:
- **Transactions**: 3 files
- **Bills**: 6 files (NEW)
- **Payroll**: 3 files
- **Attendance**: 3 files
- **Employees**: 4 files
- **Partners**: 3 files (NEW)
- **Libraries**: 4 files
- **Components**: 2 files

### **TOTAL: 28 files**

---

## 🚀 EXECUTION COMMAND (PowerShell)

Once you've updated the schema and created the migration, you can use this to copy all files:

```powershell
# Transactions
Copy-Item app/transactions/page.tsx web/app/transactions/page.tsx
Copy-Item app/api/transactions/route.ts web/app/api/transactions/route.ts
Copy-Item app/api/transactions/[id]/route.ts web/app/api/transactions/[id]/route.ts

# Bills (create dirs first)
New-Item -ItemType Directory -Path web/app/bills -Force
New-Item -ItemType Directory -Path web/app/api/bills/[id]/payments -Force
New-Item -ItemType Directory -Path web/app/api/bills/upload -Force
New-Item -ItemType Directory -Path web/app/api/bills/ocr -Force

Copy-Item app/bills/page.tsx web/app/bills/page.tsx
Copy-Item app/api/bills/* web/app/api/bills/ -Recurse -Force

# Payroll
Copy-Item app/payroll/page.tsx web/app/payroll/page.tsx
Copy-Item app/api/payroll/* web/app/api/payroll/ -Recurse -Force

# Attendance
Copy-Item app/attendance/page.tsx web/app/attendance/page.tsx
Copy-Item app/api/attendance/* web/app/api/attendance/ -Recurse -Force

# Employees
Copy-Item app/employees/page.tsx web/app/employees/page.tsx
Copy-Item app/api/employees/* web/app/api/employees/ -Recurse -Force

# Partners
New-Item -ItemType Directory -Path web/app/partners -Force
New-Item -ItemType Directory -Path web/app/api/partners/[id] -Force

Copy-Item app/partners/page.tsx web/app/partners/page.tsx
Copy-Item app/api/partners/* web/app/api/partners/ -Recurse -Force

# Libraries
Copy-Item app/lib/transactionConfig.ts web/lib/transactionConfig.ts -Force
Copy-Item app/lib/formDataUtils.ts web/lib/formDataUtils.ts -Force
Copy-Item app/components/ProfileMenu.tsx web/app/components/ProfileMenu.tsx -Force

echo "✅ All files copied!"
```

---

## ✅ POST-COPY VERIFICATION

After copying all files:

```bash
cd web/

# 1. Check TypeScript errors
npm run build

# 2. Start dev server
npm run dev

# 3. Test each module in browser:
#    - http://localhost:3000/transactions (Account filter)
#    - http://localhost:3000/bills (NEW)
#    - http://localhost:3000/payroll
#    - http://localhost:3000/attendance
#    - http://localhost:3000/employees
#    - http://localhost:3000/partners (NEW)
```

---

## 🔄 VERIFICATION CHECKLIST

### Database
- [ ] Migration created successfully
- [ ] New tables exist in production DB
- [ ] No data loss in existing tables
- [ ] Prisma Studio shows all new models

### UI Pages
- [ ] Transactions page loads
- [ ] Account filter dropdown appears
- [ ] Account column in table
- [ ] Bills page loads (empty initially)
- [ ] Payroll page works
- [ ] Attendance page works
- [ ] Employees page works
- [ ] Partners page loads (empty initially)

### API Endpoints
- [ ] GET /api/transactions?accountId=1 returns 200
- [ ] GET /api/bills returns 200
- [ ] POST /api/bills creates bill
- [ ] GET /api/payroll returns 200
- [ ] GET /api/attendance returns 200
- [ ] GET /api/employees returns 200
- [ ] GET /api/partners returns 200

### Navigation
- [ ] Bills link appears in navigation
- [ ] Partners link appears in navigation
- [ ] Mobile navigation updated

### Build
- [ ] `npm run build` succeeds (no TS errors)
- [ ] `npm run dev` starts without errors
- [ ] No console errors in browser

---

## 📞 SUPPORT

If you encounter issues:
1. Check [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) for detailed steps
2. Review specific file copy command above
3. Run `npm run build` to catch TypeScript errors
4. Check database migration log: `npx prisma migrate status`

---

**Ready to Start?** Let me know which phase you want to begin with!
