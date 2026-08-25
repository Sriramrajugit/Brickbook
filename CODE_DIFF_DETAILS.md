# Code Differences: Key Changes Needed

This document shows specific code changes needed to sync local → production.

---

## 1. Transaction Page Header (HIGH PRIORITY)

### Current Production (web/app/transactions/page.tsx)
```tsx
<header className="bg-white shadow">
  <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
  </div>
</header>
```

### Should Be (from local/app/transactions/page.tsx)
```tsx
import ProfileMenu from '../components/ProfileMenu';

<header className="bg-white shadow">
  <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
    <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
    <div className="hidden lg:block">
      <ProfileMenu />
    </div>
  </div>
</header>
```

---

## 2. Transaction Category Logic (HIGH PRIORITY)

### Current Production (hardcoded)
```tsx
const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const category = e.target.value;
  setSelectedCategory(category);
  if (!isEditMode) {
    if (category === 'Capital') {
      setTransactionType('Cash-in');
    } else {
      setTransactionType('Cash-Out');
    }
  }
  if (!isEditMode) {
    setSelectedEmployee('');
  }
};
```

### Should Be (config-driven)
```tsx
import {
  getTransactionType,
  requiresEmployee,
  createsAdvanceRecord,
  getCategoriesRequiringEmployee,
} from '@/lib/transactionConfig';

const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const categoryName = e.target.value;
  setSelectedCategory(categoryName);
  
  // Find the category ID from categories array
  const category = categories.find(cat => cat.name === categoryName);
  setSelectedCategoryId(category?.id || null);
  
  // Use config-based logic to set transaction type
  const txType = getTransactionType(categoryName);
  setTransactionType(txType as 'Cash-In' | 'Cash-Out');
  
  // Reset employee selection when category changes
  setSelectedEmployee('');
};
```

**Benefits:**
- Maintainable: Add new categories in one file
- Reusable: All pages use same logic
- Type-safe: TypeScript enforced

---

## 3. Transaction API - Bill Payment Linking (CRITICAL)

### Current Production (no linking check)
```tsx
const transactions = await prisma.transaction.findMany({
  where,
  orderBy,
  skip: (page - 1) * limit,
  take: limit,
  include: { 
    account: true,
    employee: {
      select: { id: true, name: true }
    },
    createdByUser: { ... }
  },
});

return NextResponse.json({
  data: transactions,
  pagination: { ... },
});
```

### Should Be (with bill linking)
```tsx
const transactions = await prisma.transaction.findMany({
  where,
  orderBy,
  skip: (page - 1) * limit,
  take: limit,
  include: { 
    account: true,
    createdByUser: { ... }
  },
});

// Check which transactions are linked to bill payments
const transactionIds = transactions.map((t: any) => t.id);
const linkedBillPayments = await prisma.partnerBillPayment.findMany({
  where: {
    transactionId: { in: transactionIds }
  },
  select: { transactionId: true }
});
const linkedTransactionIds = new Set(
  linkedBillPayments.map((bp: any) => bp.transactionId)
);

// Add isLinkedToBillPayment flag to each transaction
const transactionsWithFlags = transactions.map((t: any) => ({
  ...t,
  isLinkedToBillPayment: linkedTransactionIds.has(t.id)
}));

return NextResponse.json({
  data: transactionsWithFlags,
  pagination: { ... },
});
```

### Protection on Frontend
```tsx
const handleEdit = async (transaction: Transaction) => {
  // Prevent editing bill payment transactions
  if (transaction.isLinkedToBillPayment) {
    setError('❌ Cannot edit bill payment transactions. Delete the payment from the Bills section to make changes.');
    return;
  }
  // ... rest of edit logic
};
```

---

## 4. Attendance Status Type Change (MEDIUM PRIORITY)

### Current Production (string-based)
```tsx
interface AttendanceRecord {
  id?: number
  employeeId: number
  employeeName: string
  date: string
  status: 'Present' | 'Absent' | 'OT-4hr' | 'OT-8hr' | 'Not Marked'
}

const markAttendance = async (
  employeeId: number,
  employeeName: string,
  status: 'Present' | 'Absent' | 'OT-4hr' | 'OT-8hr'
) => { ... }
```

### Local Version (numeric - DO NOT USE)
```tsx
interface AttendanceRecord {
  id?: number
  employeeId: number
  employeeName: string
  date: string
  status: number // 0=Absent, 1=Present, 1.5=OT4Hrs, 2=OT8Hrs
}

const markAttendance = async (
  employeeId: number,
  employeeName: string,
  status: number // 0=Absent, 1=Present, 1.5=OT4Hrs, 2=OT8Hrs
) => { ... }
```

**Recommendation:** Keep production's string-based model (more maintainable)

---

## 5. Employee GET API - Salary Security (HIGH PRIORITY)

### Current Production (secure - salary not exposed)
```tsx
const employees = await prisma.employee.findMany({
  where: tenantFilter,
  select: {
    id: true,
    name: true,
    partnerType: true,
    etype: true,
    status: true,
    salaryFrequency: true,
    createdAt: true,
    updatedAt: true,
    // ❌ NO SALARY HERE - Good!
  },
});
```

### Local Version (security issue - salary exposed)
```tsx
const employees = await prisma.employee.findMany({
  where: { companyId },
  select: {
    id: true,
    name: true,
    partnerType: true,
    etype: true,
    salary: true,  // ⚠️ EXPOSED - Don't copy this!
    salaryFrequency: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  },
});
```

**Recommendation:** Keep production's approach (don't expose salary in GET)

---

## 6. Permission Checks - Centralized Pattern (MEDIUM PRIORITY)

### Current Production (good pattern)
```tsx
import { canModify } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { canModify: canModifyData, reason } = canModify(user);
  if (!canModifyData) {
    return NextResponse.json({ error: reason }, { status: 403 });
  }
  
  // ... rest of logic
}
```

### Local Version (basic checks)
```tsx
if (user.role === 'GUEST') {
  return NextResponse.json(
    { error: 'Permission denied. Guests cannot create transactions.' },
    { status: 403 },
  );
}
```

**Recommendation:** Keep production's `canModify()` approach (more maintainable)

---

## 7. Add transactionConfig.ts (HIGH PRIORITY)

### New File: lib/transactionConfig.ts
```typescript
export interface CategoryConfig {
  name: string;
  transactionType: 'Cash-In' | 'Cash-Out';
  requiresEmployee: boolean;
  createsAdvanceRecord: boolean;
  employeeFilter?: 'Employee' | 'Contractor' | 'All';
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'Capital': {
    name: 'Capital',
    transactionType: 'Cash-In',
    requiresEmployee: false,
    createsAdvanceRecord: false,
  },
  'Income': {
    name: 'Income',
    transactionType: 'Cash-In',
    requiresEmployee: false,
    createsAdvanceRecord: false,
  },
  'Salary Advance': {
    name: 'Salary Advance',
    transactionType: 'Cash-Out',
    requiresEmployee: true,
    createsAdvanceRecord: true,
    employeeFilter: 'Employee',
  },
  'Salary': {
    name: 'Salary',
    transactionType: 'Cash-Out',
    requiresEmployee: true,
    createsAdvanceRecord: true,
    employeeFilter: 'Employee',
  },
  'To Contractor': {
    name: 'To Contractor',
    transactionType: 'Cash-Out',
    requiresEmployee: true,
    createsAdvanceRecord: false,
    employeeFilter: 'Contractor',
  },
};

export function getTransactionType(
  categoryName: string
): 'Cash-In' | 'Cash-Out' {
  return CATEGORY_CONFIG[categoryName]?.transactionType || 'Cash-Out';
}

export function requiresEmployee(categoryName: string): boolean {
  return CATEGORY_CONFIG[categoryName]?.requiresEmployee || false;
}

export function createsAdvanceRecord(categoryName: string): boolean {
  return CATEGORY_CONFIG[categoryName]?.createsAdvanceRecord || false;
}

export function getEmployeeFilter(
  categoryName: string
): 'Employee' | 'Contractor' | 'All' | undefined {
  return CATEGORY_CONFIG[categoryName]?.employeeFilter;
}

export function getCategoriesRequiringEmployee(): string[] {
  return Object.values(CATEGORY_CONFIG)
    .filter(config => config.requiresEmployee)
    .map(config => config.name);
}
```

---

## 8. Add ProfileMenu Component (MEDIUM PRIORITY)

### New File: app/components/ProfileMenu.tsx

See [app/components/ProfileMenu.tsx](../app/components/ProfileMenu.tsx) in local version.

**Key features:**
- Shows company name and user email
- Logout button
- Click-outside auto-close
- Company info caching
- Responsive styling

---

## 9. Tenant Isolation Pattern

### Current Production (good - uses helper function)
```tsx
import { getTenantFilter } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const tenantFilter = getTenantFilter(user);
  
  const employees = await prisma.employee.findMany({
    where: tenantFilter,  // Already includes companyId + siteId
    // ...
  });
}
```

### Local Version (direct approach)
```tsx
const user = await getCurrentUser();
if (!user || !user.companyId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const companyId = user.companyId as number;
// Later: where: { companyId, siteId: user.siteId }
```

**Recommendation:** Production's approach is cleaner (centralized tenant logic)

---

## 10. Bills Module - Main Files to Copy

### app/bills/page.tsx - Key sections
```tsx
// Import configuration
import { formatINR, formatDateDDMMYYYY } from '@/lib/formatters';

// Interface for Bill data
interface Bill {
  id: number;
  invoiceNo: string;
  billDate: string;
  dueDate: string | null;
  amount: number;
  paidAmount: number;
  status: string;
  employee: { id: number; name: string; partnerType: string };
  billImagePath: string | null;
}

// Filter states (date range, employee, status, search)
// Pagination states (page, limit, totalPages, totalRecords)
// Sorting states (sortBy, sortOrder)
// Form states (for create/edit)

// Key effects:
// 1. fetchEmployees() - get list of partners
// 2. fetchBills() - get paginated bills with filters
// 3. handleFormSubmit() - create/update bill
// 4. handleDelete() - delete bill
// 5. handlePayment() - record bill payment

// Uses /api/bills endpoints for CRUD
```

### app/api/bills/route.ts - Key operations
```tsx
// GET - List bills with pagination and filtering
// - Filter by employeeId, status, date range
// - Include employee and payments
// - Sort by billDate, amount, etc.

// POST - Create bill
// - Validate required fields (invoiceNo, billDate, amount, employeeId)
// - Link to employee
// - Create bill record with status 'UNPAID'
```

---

## Summary of Changes

| Component | Change | Difficulty |
|-----------|--------|-----------|
| ProfileMenu in header | Add to transactions/payroll/attendance | Easy |
| transactionConfig.ts | New file with category rules | Easy |
| Bill linking in transactions API | Add check for linked bills | Medium |
| Bills page | Copy entire module | Medium |
| Chat module | Copy entire module with libraries | Hard |
| Attendance status type | Keep production's string model | N/A - Don't change |
| Employee API salary | Keep production's secure approach | N/A - Don't change |

---

## Testing After Changes

```bash
# Test transactions with bill linking
curl "http://localhost:3000/api/transactions?page=1&limit=10"
# Response should include isLinkedToBillPayment flag

# Test category config
# Create transaction with 'Salary Advance' → should require employee

# Test ProfileMenu
# Visit transactions page → should see profile dropdown in header

# Test bills
# Visit /bills page → should show bill management UI

# Test chat
# Visit /chat page → should show chat interface
```

