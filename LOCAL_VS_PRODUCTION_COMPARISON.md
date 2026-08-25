# Local vs Production (web/) Comparison Report
**Generated:** 2026-08-25

---

## 📋 Executive Summary

The **local** (`app/`) version is significantly more advanced than the **production** (`web/`) version. Key differences include:

1. **Complete Bills Module** (LOCAL ONLY) - Full bill/invoice management system
2. **Chat/Q&A Module** (LOCAL ONLY) - AI-powered financial query interface  
3. **Enhanced Authentication** (LOCAL ONLY) - Role-based access control with `canModify` checks
4. **Advanced Attendance Model** (LOCAL ONLY) - String-based status values with OT tracking
5. **Richer Employee/Partner Management** (LOCAL ONLY) - Extended fields and partner types
6. **ProfileMenu Component** (LOCAL ONLY) - User profile dropdown in header
7. **Transaction Configuration** (LOCAL ONLY) - Centralized category configuration system
8. **Bill Payment Linking** (LOCAL ONLY) - Transactions can be linked to bill payments

---

## 🔍 DETAILED FILE COMPARISONS

---

## 1. PAGES COMPARISON

### 1.1 [app/transactions/page.tsx](app/transactions/page.tsx) vs [web/app/transactions/page.tsx](web/app/transactions/page.tsx)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Imports** | Uses `ProfileMenu`, `formatDateDDMMYYYY`, `transactionConfig` | Only `formatINR` | HIGH |
| **Header Component** | Includes `<ProfileMenu />` in header | No ProfileMenu | MEDIUM |
| **Filter States** | No `filterType` | Has `filterType` filter | LOW |
| **Form Fields** | Extensive: `selectedCategoryId`, `selectedEmployeeName`, `error`, `successMessage` | Simpler field set | MEDIUM |
| **Category Logic** | Uses `getTransactionType()` config-based system | Hardcoded: `'Capital' → 'Cash-in', else 'Cash-Out'` | HIGH |
| **Employee Selection** | Advanced: fetches from advances for Salary Advance, matches by amount & date | Simple: matches transaction.employee | HIGH |
| **Bill Payment Check** | Prevents editing bill-linked transactions with error message | No bill payment check | CRITICAL |
| **Transaction Type** | `'Cash-In'` or `'Cash-Out'` | `'Income'` or `'Expense'` | MEDIUM |
| **Account Filter Param** | `account` | `accountId` | LOW |
| **Refresh Logic** | Can set page explicitly | PageNum override support | LOW |

**Key Differences:**
- Local has **bill payment protection** - prevents editing transactions linked to bills
- Local uses **configuration-driven category logic** instead of hardcoded rules
- Local has **enhanced employee matching** for salary advance records
- Local shows **company profile** in header (ProfileMenu)

---

### 1.2 [app/payroll/page.tsx](app/payroll/page.tsx) vs [web/app/payroll/page.tsx](web/app/payroll/page.tsx)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Data Fetch Model** | Client-side calculation from attendance/advances | Server-side payroll preview | CRITICAL |
| **Salary Frequency** | Supports Monthly (M) & Daily (D) | No frequency support | HIGH |
| **Account Filter** | `/api/accounts/full` with type filtering | `/api/accounts/full` | LOW |
| **Employee Selection** | Checkbox-based, tracks paid status | No employee selection UI | CRITICAL |
| **Payroll State** | `payrollPreview` array, `selectedEmployees` Set | Direct calculation | MEDIUM |
| **OT Calculation** | `ot4hrDays * 1.5x` + `ot8hrDays * 2x` | Not shown in comparison | MEDIUM |
| **Monthly Validation** | Validates same calendar month for monthly employees | No monthly validation | MEDIUM |
| **Selection UI** | "Select All" buttons per frequency type | No UI selection | CRITICAL |
| **Already Paid Check** | Shows which employees already have payroll | Not visible | HIGH |

**Key Differences:**
- Local has **checkbox UI** for employee selection with "already paid" indicators
- Local enforces **monthly cohesion** for monthly employees
- Local calculates **payroll on client-side** vs server-side
- Local has **frequency-aware UI** (Monthly vs Daily sections)

---

### 1.3 [app/attendance/page.tsx](app/attendance/page.tsx) vs [web/app/attendance/page.tsx](web/app/attendance/page.tsx)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Status Type** | Numeric: `0` (Absent), `1` (Present), `1.5` (OT-4hr), `2` (OT-8hr) | String: `'Present'`, `'Absent'`, `'OT-4hr'`, `'OT-8hr'` | CRITICAL |
| **Employee Filter** | Filters to `partnerType === 'Employee'` only | Shows ALL employees | MEDIUM |
| **UI Display** | Salary frequency badge `(D)` or `(M)` | No frequency badge | LOW |
| **Status Display Func** | Custom `getStatusDisplay()` mapping numbers | Direct string display | LOW |
| **Status Colors** | `getStatusColor()` function with mapping | Ternary conditional display | LOW |
| **getAttendanceStatus Return** | Returns `-1` for "Not Marked" | Returns `'Not Marked'` string | LOW |
| **ProfileMenu** | No ProfileMenu in local | Not applicable | N/A |

**Key Differences:**
- Local uses **numeric status model** vs production's **string model**
- Local enforces **Employee-only filtering** (excludes contractors/suppliers)
- Local displays **salary frequency** as visual badge

---

### 1.4 [app/employees/page.tsx](app/employees/page.tsx) vs [web/app/employees/page.tsx](web/app/employees/page.tsx)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Fields Managed** | 10 fields (name, partnerType, etype, email, phone, address, gstNumber, creditPeriodDays, salary, status, isActive) | 4 fields (name, etype, salary, status) | CRITICAL |
| **Title** | "Partners" | "Partners" | N/A |
| **Sorting** | Full sorting UI (by name/partnerType, asc/desc) | No sorting | MEDIUM |
| **Profile Menu** | No ProfileMenu in header | Not applicable | N/A |
| **Error Handling** | Comprehensive with JSON parsing fallback | Basic error handling | LOW |
| **Form Layout** | Grid layout (2 columns) | Form visible in same section | LOW |
| **Success Message** | Timed auto-dismiss (3s) | None shown | LOW |
| **Salary Frequency** | Dropdown: Monthly/Daily → Stored as M/D | Not in production version | HIGH |
| **API Error Detail** | Returns detailed error data | Generic error message | MEDIUM |

**Key Differences:**
- Local has **extensive partner management** (10 fields vs 4)
- Local has **sorting capability** (by name or type)
- Local supports **salary frequency** (Monthly vs Daily)
- Local includes **business fields** (GST, credit period, address, email, phone)

---

### 1.5 [app/partners/page.tsx](app/partners/page.tsx) vs [web/app/partners/page.tsx](web/app/partners/page.tsx)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Existence** | ✅ EXISTS | ❌ DOES NOT EXIST | CRITICAL |
| **API Endpoint** | `/api/partners` | None | CRITICAL |
| **Features** | Full CRUD with filters (type, active status), search, pagination | N/A | CRITICAL |
| **Filter Options** | Partner type (SUPPLIER, etc.), Active status | N/A | CRITICAL |
| **Pagination** | Full pagination with page/limit controls | N/A | MEDIUM |
| **Form** | Inline form with edit/delete capabilities | N/A | CRITICAL |

**Key Differences:**
- **NEW MODULE in local**: Dedicated partners page with full management interface
- Separate from employees module
- Manages non-employee partners (suppliers, contractors)

---

## 2. API ROUTES COMPARISON

### 2.1 [app/api/transactions/route.ts](app/api/transactions/route.ts) vs [web/app/api/transactions/route.ts](web/app/api/transactions/route.ts)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Tenant Filtering** | Uses `companyId` + `siteId` | Uses `getTenantFilter(user)` | MEDIUM |
| **CORS Headers** | ✅ Explicit CORS preflight (OPTIONS) | ❌ No CORS | MEDIUM |
| **Bill Payment Linking** | ✅ Checks `partnerBillPayment` table, sets `isLinkedToBillPayment` flag | ❌ No bill linking | CRITICAL |
| **Account Query Param** | `account` parameter | `accountId` parameter | LOW |
| **Include Fields** | account, createdByUser only | account, employee, createdByUser | MEDIUM |
| **Type Filter** | Not in local | ✅ Supports `type` query filter | LOW |
| **Permission Check** | Basic role check (GUEST) | Uses `canModify()` function | MEDIUM |
| **Date Validation** | "Only truly future dates not allowed" (today OK) | "Future date transactions not allowed" (today NOT OK) | LOW |

**Key Differences:**
- Local has **bill payment transaction locking** system
- Production has **employee field** inclusion in response
- Local has **explicit CORS support**
- Production uses **centralized canModify** function

---

### 2.2 [app/api/payroll/route.ts](app/api/payroll/route.ts) vs [web/app/api/payroll/route.ts](web/app/api/payroll/route.ts)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **GET Response Model** | Returns `payrollPreview` array with calculated fields | Returns filtered `payroll` records from DB | CRITICAL |
| **Calculation** | Client calculation (preview mode) | Database records only | CRITICAL |
| **Salary Frequency Logic** | Differentiates M vs D employees | Not visible in production | MEDIUM |
| **Attendance Calculation** | Multiplies attendance status × salary | Not in production GET | MEDIUM |
| **Advance Handling** | Queries `advance` table, filters by isPaid=false | Updates advances to isPaid=true on POST | MEDIUM |
| **Monthly Validation** | Validates same calendar month on POST | No month validation | MEDIUM |
| **Overlapping Ranges** | Checks for overlapping date ranges | Not shown in comparison | MEDIUM |
| **Database Transaction** | Simple operations | Uses `prisma.$transaction()` for consistency | MEDIUM |
| **Error Handling** | Returns detailed `details` field | Generic error | LOW |

**Key Differences:**
- Local uses **preview/calculation model** (read-only GET, calculate on frontend)
- Production uses **database-stored records** (traditional CRUD)
- Local has **overlap detection** for payroll ranges
- Production has **transaction consistency** wrapper

---

### 2.3 [app/api/attendance/route.ts](app/api/attendance/route.ts) vs [web/app/api/attendance/route.ts](web/app/api/attendance/route.ts)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Status Format** | Numeric: 0, 1, 1.5, 2 | String: 'Present', 'Absent', 'OT-4hr', 'OT-8hr' | CRITICAL |
| **Employee Filter** | Enforces `partnerType: 'Employee'` | No filter | MEDIUM |
| **Upsert Method** | Find + Update/Create separately | Uses Prisma `upsert` with composite key | MEDIUM |
| **Date Handling** | Raw SQL insert, timezone UTC | Date object conversion, composite key | MEDIUM |
| **OT Hours Calc** | Not in GET | ✅ Calculates otHours on POST | MEDIUM |
| **Permission Check** | Basic GUEST check | Uses `canModify()` function | MEDIUM |
| **Tenant Filter** | companyId direct | Uses `getTenantFilter(user)` | MEDIUM |

**Key Differences:**
- Local uses **numeric status model** (0, 1, 1.5, 2)
- Production uses **string status model** ('Present', 'OT-4hr', etc.)
- Production calculates **OT hours** from status
- Local uses **raw SQL** for date-safe inserts
- Production uses **Prisma upsert** with composite key

---

### 2.4 [app/api/employees/route.ts](app/api/employees/route.ts) vs [web/app/api/employees/route.ts](web/app/api/employees/route.ts)

| Aspect | Local | Production | Impact |
|--------|-------|-----------|--------|
| **Select Fields** | 8 fields (id, name, partnerType, etype, salary, salaryFrequency, status, dates) | 8 fields (id, name, partnerType, etype, status, salaryFrequency, dates) | MEDIUM |
| **Salary Included** | ✅ SELECT includes salary | ❌ SELECT excludes salary for security | CRITICAL |
| **POST Fields** | All 8 fields accepted | Only name, etype, salary, status | HIGH |
| **PUT Fields** | Same as POST | Same as POST | HIGH |
| **salaryFrequency** | M/D format, stored directly | Not in production responses | MEDIUM |
| **Tenant Filter** | companyId direct | `getTenantFilter(user)` function | MEDIUM |
| **Permission Check** | Basic GUEST check | `canModify()` function | MEDIUM |
| **Logging** | Extensive console logs | Minimal logging | LOW |
| **Error Detail** | Returns errorMsg + errorStack | Generic error message | LOW |
| **Include Relations** | No include on GET | No include on GET | N/A |

**Key Differences:**
- Local **includes salary** in GET response (security risk?)
- Local accepts **partnerType, email, phone, address, GST, creditPeriodDays**
- Production uses **centralized permission check** (`canModify`)
- Production has **security-first approach** (excludes salary)

---

## 3. 🚀 LOCAL-ONLY MODULES (NOT IN PRODUCTION)

### 3.1 Bills Module
**Location:** [app/bills/](app/bills/) and [app/api/bills/](app/api/bills/)

**Purpose:** Complete bill/invoice management system

**Components:**
- [app/bills/page.tsx](app/bills/page.tsx) - Bill listing with filters, pagination, sorting
- [app/api/bills/route.ts](app/api/bills/route.ts) - GET/POST bills API
- [app/api/bills/[id]/route.ts](app/api/bills/[id]/) - Individual bill endpoints
- [app/api/bills/upload/](app/api/bills/upload/) - Bill image upload
- [app/api/bills/ocr/](app/api/bills/ocr/) - OCR processing

**Features:**
- Create/edit/delete bills
- Link bills to partners (employees/contractors)
- Track bill amounts, paid amounts, status
- Upload bill images
- OCR bill data extraction
- Filter by date range, employee, status
- Search functionality
- Pagination and sorting

**Impact:** **CRITICAL** - Major feature gap in production

---

### 3.2 Chat/Q&A Module
**Location:** [app/chat/](app/chat/), [lib/chat-*.ts](lib/), [types/chat-query.ts](types/)

**Purpose:** AI-powered financial query interface

**Components:**
- [app/chat/page.tsx](app/chat/page.tsx) - Chat interface
- [lib/chat-intent-parser.ts](lib/chat-intent-parser.ts) - Natural language intent detection
- [lib/chat-query-builder.ts](lib/chat-query-builder.ts) - Builds DB queries from intent
- [lib/chat-response-formatter.ts](lib/chat-response-formatter.ts) - Formats query results
- [lib/chat-nlp-extractor.ts](lib/chat-nlp-extractor.ts) - NLP entity extraction
- [lib/chat-intelligent-nlp.ts](lib/chat-intelligent-nlp.ts) - Advanced NLP processing
- [lib/chat-dynamic-query.ts](lib/chat-dynamic-query.ts) - Dynamic query generation
- [types/chat-query.ts](types/chat-query.ts) - TypeScript types

**Features:**
- Natural language queries about financial data
- Automatic query generation
- Smart suggestions
- Conversation history
- Multi-turn dialogue

**Impact:** **CRITICAL** - Advanced analytics feature not in production

---

### 3.3 Transaction Configuration System
**Location:** [lib/transactionConfig.ts](lib/transactionConfig.ts)

**Purpose:** Centralized category configuration instead of hardcoded logic

**Exports:**
```typescript
interface CategoryConfig {
  name: string;
  transactionType: 'Cash-In' | 'Cash-Out';
  requiresEmployee: boolean;
  createsAdvanceRecord: boolean;
  employeeFilter?: 'Employee' | 'Contractor' | 'All';
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig>
```

**Supported Categories:**
- `'Capital'` → Cash-In, no employee required
- `'Income'` → Cash-In, no employee required  
- `'Salary Advance'` → Cash-Out, requires Employee, creates Advance record
- `'Salary'` → Cash-Out, requires Employee, creates Advance record
- `'To Contractor'` → Cash-Out, requires Contractor

**Impact:** **HIGH** - Provides maintainability and extensibility for category logic

---

### 3.4 ProfileMenu Component
**Location:** [app/components/ProfileMenu.tsx](app/components/ProfileMenu.tsx)

**Purpose:** User profile dropdown menu in header

**Features:**
- Display company name
- User logout
- Click-outside detection
- Company info caching in localStorage
- Responsive positioning

**Used In:**
- [app/transactions/page.tsx](app/transactions/page.tsx)
- [app/payroll/page.tsx](app/payroll/page.tsx)
- [app/attendance/page.tsx](app/attendance/page.tsx)
- [app/bills/page.tsx](app/bills/page.tsx)

**Impact:** **MEDIUM** - UX improvement component

---

## 4. 📊 SUMMARY TABLE

| Feature | Local | Production | Status |
|---------|-------|-----------|--------|
| **Bills Management** | ✅ Complete module | ❌ Missing | CRITICAL GAP |
| **Chat/Q&A** | ✅ Full implementation | ❌ Missing | CRITICAL GAP |
| **Bill Payment Linking** | ✅ Transactions locked when linked | ❌ No linking | HIGH GAP |
| **Attendance Status** | Numeric (0,1,1.5,2) | String ('Present','OT-4hr') | DIFFERENT |
| **Employee Data** | 10+ fields (salary, GST, phone, address, frequency) | 4 fields (name, etype, salary, status) | SUBSET |
| **Payroll Model** | Preview/calculation | Traditional CRUD | DIFFERENT |
| **Permission Checks** | Basic | `canModify()` function | MODERN |
| **Tenant Isolation** | Direct companyId/siteId | `getTenantFilter()` function | MODERN |
| **Configuration** | transactionConfig.ts | Hardcoded logic | BETTER |
| **ProfileMenu** | ✅ Shows company name | ❌ Not present | MEDIUM GAP |
| **Partners Module** | ✅ Dedicated page | ❌ Mixed with Employees | ARCHITECTURAL |
| **CORS Support** | ✅ Explicit headers | ❌ Not present | LOW |

---

## 5. ⚠️ CRITICAL GAPS TO ADDRESS

### Must Copy to Production (HIGH PRIORITY):
1. **Bills Module** - Complete system for invoice tracking
2. **Chat Module** - Analytics/query interface
3. **ProfileMenu Component** - Better UX
4. **transactionConfig.ts** - Configuration system
5. **Bill Payment Linking** - Transaction protection

### Should Review (MEDIUM PRIORITY):
1. Attendance status model (numeric vs string)
2. Permission/authorization patterns
3. Tenant isolation approach
4. Employee data field set
5. API error handling

### Nice-to-Have (LOW PRIORITY):
1. CORS headers on APIs
2. Extended logging
3. Payroll calculation model

---

## 6. 📝 RECOMMENDATIONS

### Immediate Actions:
1. **Port Bills Module** to production - Include all API routes and OCR support
2. **Port Chat Module** to production - Include all NLP utilities
3. **Add ProfileMenu** to production header
4. **Import transactionConfig** into production transactions page/API
5. **Add Bill Payment Linking** logic to transaction API

### Medium-term:
1. Unify attendance status handling (choose numeric or string)
2. Review and align tenant isolation patterns
3. Standardize permission checks with `canModify()`
4. Review employee data fields (consider security implications)
5. Add comprehensive error handling consistency

### Long-term:
1. Consider unified partner/employee management
2. Implement comprehensive API documentation
3. Add integration tests for critical modules
4. Performance optimization for large datasets
5. Advanced analytics dashboard

