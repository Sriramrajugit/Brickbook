# 🚀 Production Deployment Plan - Phase 1
**Date**: 2026-08-25  
**Status**: Ready for Implementation  
**Risk Level**: LOW (No deletions, additive only)

---

## 📋 MODULES TO DEPLOY

1. ✅ Transactions + Account Filter
2. ✅ Bills & Invoices (NEW)
3. ✅ Payroll
4. ✅ Attendance
5. ✅ Employees
6. ✅ Partners (NEW)

---

## 🗂️ DEPLOYMENT STRUCTURE

### **PHASE 1: DATABASE SCHEMA (CRITICAL FIRST)**

#### Step 1.1: Update Prisma Schema
**File**: `web/prisma/schema.prisma`

**Add these Enums** (at top after other enums):
```prisma
enum BillStatus {
  UNPAID
  PARTIALLY_PAID
  FULLY_PAID
}

enum PaymentMode {
  GPAY
  BANK_TRANSFER
  CASH
  CHEQUE
  UPI
  NEFT
  RTGS
  IMPS
}
```

**Add these Models** (before closing):
```prisma
// ==================== PARTNER BILLS MODULE ====================
model PartnerBill {
  id                  Int                   @id @default(autoincrement())
  companyId           Int
  employeeId          Int
  accountId           Int
  invoiceNo           String
  billDate            DateTime
  dueDate             DateTime?
  amount              Float
  paidAmount          Float                 @default(0)
  status              BillStatus            @default(UNPAID)
  billImagePath       String?
  remarks             String?
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  company             Company               @relation(fields: [companyId], references: [id])
  employee            Employee              @relation(fields: [employeeId], references: [id])
  account             Account               @relation(fields: [accountId], references: [id])
  payments            PartnerBillPayment[]

  @@unique([companyId, employeeId, invoiceNo])
  @@index([companyId])
  @@index([employeeId])
  @@index([accountId])
  @@index([status])
  @@map("partner_bills")
}

model PartnerBillPayment {
  id                  Int                   @id @default(autoincrement())
  companyId           Int
  billId              Int
  paymentDate         DateTime
  amount              Float
  paymentMode         PaymentMode           @default(GPAY)
  referenceNo         String?
  transactionId       Int?
  createdAt           DateTime              @default(now())
  company             Company               @relation(fields: [companyId], references: [id])
  bill                PartnerBill           @relation(fields: [billId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([billId])
  @@map("partner_bill_payments")
}

// ==================== PARTNER MODULE ====================
model Partner {
  id                  Int                   @id @default(autoincrement())
  companyId           Int
  name                String
  type                String                // "Contractor", "Supplier", "Vendor"
  email               String?
  phone               String?
  address             String?
  gstNumber           String?
  panNumber           String?
  bankAccount         String?
  bankName            String?
  ifscCode            String?
  paymentTerms        String?               // Net 30, Net 60, etc.
  isActive            Boolean               @default(true)
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  company             Company               @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId])
  @@map("partners")
}

model Supplier {
  id                  Int                   @id @default(autoincrement())
  companyId           Int
  name                String
  email               String?
  phone               String?
  address             String?
  gstNumber           String?
  isActive            Boolean               @default(true)
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  company             Company               @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId])
  @@map("suppliers")
}

model Item {
  id                  Int                   @id @default(autoincrement())
  companyId           Int
  name                String
  description         String?
  sku                 String?
  unitPrice           Float
  quantity            Int                   @default(0)
  unit                String?               // "pcs", "kg", "meter", etc.
  isActive            Boolean               @default(true)
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  company             Company               @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId])
  @@map("items")
}

// ==================== END PARTNER BILLS MODULE ====================
```

**Update Relations in Existing Models**:
- Add to `Company` model: `partnerBills PartnerBill[]`, `partnerBillPayments PartnerBillPayment[]`, `partners Partner[]`, `suppliers Supplier[]`, `items Item[]`
- Add to `Employee` model: `partnerBills PartnerBill[]`

#### Step 1.2: Create Migration
```bash
cd web
npx prisma migrate dev --name add_bills_partners_module
```

This creates a new migration file and applies it to the database.

---

### **PHASE 2: UI PAGES (NO DATA DELETIONS)**

#### Step 2.1: Transactions Module
**Copy File**:
```
web/app/transactions/page.tsx ← app/transactions/page.tsx
web/app/api/transactions/route.ts ← app/api/transactions/route.ts (ensure account filtering)
web/app/api/transactions/[id]/route.ts ← app/api/transactions/[id]/route.ts
```

**Changes**:
- ✅ Account filter dropdown
- ✅ Account column in table
- ✅ Sortable by account
- ✅ API supports `accountId` parameter

#### Step 2.2: Bills & Invoices Module (NEW)
**Copy Files**:
```
web/app/bills/page.tsx ← app/bills/page.tsx
web/app/api/bills/route.ts ← app/api/bills/route.ts
web/app/api/bills/[id]/route.ts ← app/api/bills/[id]/route.ts
web/app/api/bills/[id]/payments/route.ts ← app/api/bills/[id]/payments/route.ts
web/app/api/bills/upload/route.ts ← app/api/bills/upload/route.ts
web/app/api/bills/ocr/route.ts ← app/api/bills/ocr/route.ts
```

**Components**:
```
web/app/components/BillStatusBadge.tsx ← app/components/BillStatusBadge.tsx (if exists)
```

#### Step 2.3: Payroll Module
**Copy Files**:
```
web/app/payroll/page.tsx ← app/payroll/page.tsx
web/app/api/payroll/route.ts ← app/api/payroll/route.ts
web/app/api/payroll/[id]/route.ts ← app/api/payroll/[id]/route.ts
```

#### Step 2.4: Attendance Module
**Copy Files**:
```
web/app/attendance/page.tsx ← app/attendance/page.tsx
web/app/api/attendance/route.ts ← app/api/attendance/route.ts
web/app/api/attendance/[id]/route.ts ← app/api/attendance/[id]/route.ts
```

#### Step 2.5: Employees Module
**Copy Files**:
```
web/app/employees/page.tsx ← app/employees/page.tsx
web/app/api/employees/route.ts ← app/api/employees/route.ts
web/app/api/employees/[id]/route.ts ← app/api/employees/[id]/route.ts
web/app/api/employees/minimal/route.ts ← app/api/employees/minimal/route.ts (if exists)
```

#### Step 2.6: Partners Module
**Copy Files**:
```
web/app/partners/page.tsx ← app/partners/page.tsx
web/app/api/partners/route.ts ← app/api/partners/route.ts
web/app/api/partners/[id]/route.ts ← app/api/partners/[id]/route.ts
```

---

### **PHASE 3: SHARED LIBRARIES & UTILITIES**

**Copy Files**:
```
web/lib/transactionConfig.ts ← app/lib/transactionConfig.ts
web/lib/formDataUtils.ts ← app/lib/formDataUtils.ts
web/lib/formatters.ts ← app/lib/formatters.ts (update if changed)
```

**Components**:
```
web/app/components/ProfileMenu.tsx ← app/components/ProfileMenu.tsx (if exists)
```

---

### **PHASE 4: NAVIGATION UPDATES**

#### Update Navigation Component
**File**: `web/app/components/Navigation.tsx`

Add Bills link (if not exists):
```tsx
<NavLink href="/bills" label="Bills & Invoices" icon="📄" />
```

Add Partners link (if not exists):
```tsx
<NavLink href="/partners" label="Partners" icon="🤝" />
```

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Backup Production Database
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup-2026-08-25.sql
```

### Step 2: Update Schema & Run Migration
```bash
cd web/
# Update web/prisma/schema.prisma with all models above
npx prisma migrate dev --name add_bills_partners_module
# Verify: npx prisma studio
```

### Step 3: Copy All Files
```bash
# Create directories if needed
mkdir -p web/app/bills web/app/partners web/app/api/bills web/app/api/partners

# Copy all files from app/ to web/app/ (listed above)
# Use your git/copy tool to sync files
```

### Step 4: Rebuild & Test
```bash
cd web/
npm run clean
npm run build
npm run dev
```

### Step 5: Verification Checklist
- [ ] Database migration completed without errors
- [ ] Bills page loads and displays (empty if no data)
- [ ] Transactions page shows Account filter and column
- [ ] Payroll, Attendance pages work correctly
- [ ] Employees, Partners pages load
- [ ] Navigation updated with new links
- [ ] No production data deleted
- [ ] All API endpoints respond with 200 OK

---

## 📊 FILES SUMMARY

### **Total Files to Copy: 28+**

| Module | Files | Priority |
|--------|-------|----------|
| Transactions | 3 | HIGH |
| Bills & Invoices | 6 | HIGH |
| Payroll | 3 | HIGH |
| Attendance | 3 | HIGH |
| Employees | 4 | HIGH |
| Partners | 3 | HIGH |
| Libraries | 4 | MEDIUM |
| Components | 2 | MEDIUM |
| Schema | 1 | CRITICAL |

---

## ⚠️ SAFETY MEASURES

✅ **What's Protected**:
- No existing production data deleted
- All new fields are optional (backward compatible)
- Cascade deletes only on new models
- Migration can be reversed if needed

✅ **Testing Protocol**:
1. Run in `npm run dev` first
2. Verify all features work
3. Test bill creation, payment recording
4. Verify transaction account filtering
5. Run `npm run build` to catch any TypeScript errors
6. Deploy to staging first if possible

---

## 📝 ROLLBACK PLAN

If anything breaks:
```bash
# Rollback migration
npx prisma migrate resolve --rolled-back add_bills_partners_module

# Restore database from backup
psql $DATABASE_URL < backup-2026-08-25.sql
```

---

## ✅ STATUS TRACKING

**Deployment Phases**:
- [ ] Phase 1: Database Schema (Migration)
- [ ] Phase 2: UI Pages (28+ files)
- [ ] Phase 3: Libraries & Utilities
- [ ] Phase 4: Navigation Updates
- [ ] Phase 5: Build & Test
- [ ] Phase 6: Production Verification

---

**Next Step**: Ready to begin Phase 1 (Database Schema)? Reply with ✅
