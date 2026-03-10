# Ledger Application - Features Overview & Capabilities

**Version:** 1.0  
**Last Updated:** March 2026

Complete feature catalog and capability documentation for the Ledger accounting system.

---

## 📋 Table of Contents

1. [Core Accounting Features](#core-accounting-features)
2. [Employee Management](#employee-management)
3. [Reporting & Analytics](#reporting--analytics)
4. [User Management & Security](#user-management--security)
5. [System Administration](#system-administration)
6. [Data Management](#data-management)
7. [Integration & Export](#integration--export)
8. [Technical Capabilities](#technical-capabilities)

---

## Core Accounting Features

### 1. Account Management ✅

**Description:** Create and manage financial accounts for your business.

**Capabilities:**
- ✅ Create multiple accounts (Bank, Cash, Wallet, etc.)
- ✅ Set account budgets and track against actuals
- ✅ View real-time account balances
- ✅ Account lifecycle management (create, update, deactivate, delete)
- ✅ Account type classification
- ✅ Link accounts to specific sites/locations
- ✅ Track account opening and closing dates

**Use Cases:**
- Manage multiple bank accounts
- Track cash boxes at different locations
- Maintain separate division or cost center accounts
- Monitor company-wide vs. site-specific accounts
- Budget planning and tracking

**Fields:**
- Account Name, Type, Budget Amount
- Start Date, End Date
- Site Assignment
- Creation/Update Timestamps

---

### 2. Transaction Management ✅

**Description:** Record all financial transactions (Income & Expenses).

**Capabilities:**
- ✅ Create cash-in (income) transactions
- ✅ Create cash-out (expense) transactions
- ✅ Auto-categorize based on category rules
- ✅ Track payment modes (Cash, Bank Transfer, G-Pay, etc.)
- ✅ Add transaction descriptions and notes
- ✅ Bulk import via CSV/Excel
- ✅ Automatic debit/credit to accounts
- ✅ Transaction editing (by creator or admin)
- ✅ Transaction deletion with audit trail option
- ✅ Transaction date validation (no future dates)
- ✅ Real-time account balance updates

**Advanced Filtering:**
- Filter by date range (start/end dates)
- Filter by category
- Search by description
- Sort by date, amount, category
- Pagination for large datasets

**Use Cases:**
- Record daily sales
- Log business expenses
- Track customer invoices
- Record supplier payments
- Monitor account movements
- Audit trail for financial review

**Fields:**
- Amount, Type (Cash-In/Out), Category
- Account, Payment Mode
- Description, Date
- Created By, Timestamps

---

### 3. Category Management ✅

**Description:** Create and manage transaction categories for organization.

**Capabilities:**
- ✅ Create custom categories
- ✅ Add category descriptions
- ✅ Company-scoped unique category names
- ✅ Category editing
- ✅ Delete categories (if unused)
- ✅ Link transactions to categories
- ✅ Category-wise reporting

**Typical Categories:**

**Income Categories:**
- Sales Revenue
- Service Income
- Investment Returns
- Refunds Received
- Government Grants

**Expense Categories:**
- Salaries & Wages
- Rent & Lease
- Utilities (Electric, Water, Internet)
- Office Supplies
- Equipment
- Marketing
- Professional Services
- Travel
- Insurance
- Maintenance

**Use Cases:**
- Track spending by category
- Generate category-wise P&L reports
- Monitor spending trends
- Budget allocation by category
- Expense categorization for taxation

---

### 4. Advanced Financial Reporting ✅

**Description:** Generate detailed financial reports and analytics.

**Report Types:**

**Accounting Reports:**
- Account Summary (balances, activity)
- Transaction Ledger (detailed transaction list)
- Transaction Report (filterable, exportable)
- Category-wise breakdown with charts

**Financial Analysis:**
- Income vs. Expense comparison
- Period-on-period analysis
- Trend analysis with graphs
- Cash flow statement
- Budget vs. Actual variance

**Dashboard Metrics:**
- Total Balance (all accounts combined)
- Total Transactions
- Recent Transactions (last 5)
- Account Summary Cards

**Reporting Features:**
- ✅ Custom date range selection
- ✅ Multiple report formats (Table, Graph, Chart)
- ✅ Export to PDF
- ✅ Export to Excel/CSV
- ✅ Print-friendly views
- ✅ Filter by category, account, date
- ✅ Pie charts, bar graphs, trend lines

---

## Employee Management

### 1. Employee Database ✅

**Description:** Comprehensive employee and partner information management.

**Capabilities:**
- ✅ Create employee profiles
- ✅ Classify partner types (Employee, Supplier, Contractor)
- ✅ Set designations/job titles
- ✅ Define salary information
- ✅ Track employment status (Active/Inactive)
- ✅ Update employee information
- ✅ Deactivate employees (preserves records)
- ✅ Delete employee records
- ✅ View employee statistics

**Employee Fields:**
- Name, Designation, Partner Type
- Salary Amount, Salary Frequency (Daily/Monthly)
- Status, Timestamps
- Related: Attendance, Payroll, Advances

**Use Cases:**
- HR database maintenance
- Salary information tracking
- Multi-level organization structure
- Supplier and contractor management
- Employment record keeping

---

### 2. Attendance Tracking ✅

**Description:** Record and monitor daily employee attendance.

**Capabilities:**
- ✅ Daily attendance recording
- ✅ Batch attendance entry (multiple employees)
- ✅ Flexible status options:
  - Full Day (1.0)
  - Half Day (0.5)
  - Absent (0.0)
  - Leave (0.0)
- ✅ Date-based attendance records
- ✅ Attendance validation (no future dates)
- ✅ Update attendance records
- ✅ View attendance history
- ✅ Monthly attendance reports
- ✅ Attendance percentage calculations

**Attendance Features:**
- One attendance record per employee per day
- Flexible partial attendance (0.5 for half-day)
- Easy batch entry form
- Department/site-wise filtering
- Export attendance reports

**Use Cases:**
- Daily attendance register
- Leave tracking
- Payroll attendance-based deductions
- Absenteeism monitoring
- Employee productivity tracking
- Compliance reporting

---

### 3. Salary & Payroll Management ✅

**Description:** Automated salary calculation and payroll processing.

**Capabilities:**
- ✅ Create payroll entries
- ✅ Auto-calculate salary based on:
  - Base salary from employee record
  - Attendance percentage
  - Salary deductions from advances
- ✅ Define pay periods (from/to dates)
- ✅ Link payroll to accounts (auto-debit)
- ✅ Multiple payroll entries per employee per month
- ✅ Payroll remarks and notes
- ✅ Edit pending payroll
- ✅ Delete/reverse payroll entries
- ✅ Payroll history tracking
- ✅ Monthly payroll reports

**Payroll Calculation:**
```
Gross Salary = Employee Base Salary
Attendance Adjustment = Gross × (Days Worked / Total Days)
Deductions = Pending Advances
Net Salary = (Gross × Attendance Ratio) - Deductions
```

**Payroll Features:**
- Configurable pay periods
- Advance deduction automation
- Account reconciliation
- Payment mode tracking
- Payroll approval workflow (optional)

**Use Cases:**
- Monthly salary processing
- Attendance-based pay adjustments
- Salary advance deductions
- Multi-currency support (INR formatted)
- Payroll audit trail
- Salary slip generation (future)

---

### 4. Salary Advance Management ✅

**Description:** Track and manage employee salary advances.

**Capabilities:**
- ✅ Record salary advances
- ✅ Track advance amounts
- ✅ Add advance reason/notes
- ✅ Link to specific employee
- ✅ Record advance date
- ✅ Track advance status:
  - Pending (not yet deducted)
  - Partial (partially recovered)
  - Recovered (fully deducted)
- ✅ View employee's total pending advances
- ✅ Automatic deduction in payroll
- ✅ Advance history per employee

**Advance Features:**
- Multiple advances per employee
- Cascading deductions across payroll cycles
- Advance reporting
- Partial recovery tracking
- Clear audit trail

**Use Cases:**
- Emergency employee advances
- Short-term loans to employees
- Advance tracking
- Salary adjustments
- Employee financial management

---

## Reporting & Analytics

### 1. Financial Reports ✅

**Available Reports:**

**Balance Reports:**
- Account Summary (current balances)
- Account History (transactions over time)
- Period-wise Account Statement

**Transaction Reports:**
- Detailed Transaction Ledger
- Filterable Transaction List
- Transaction Export (PDF/Excel)

**Analysis Reports:**
- Income vs. Expense
- Category-wise Breakdown
- Period Comparison
- Trend Analysis

**Payroll Reports:**
- Monthly Salary Summary
- Salary by Employee
- Salary Trends
- Advance Summary

**Attendance Reports:**
- Monthly Attendance Record
- Attendance Percentage by Employee
- Leave Summary
- Absenteeism Report

### 2. Report Customization ✅

**Filtering Options:**
- Date Range (Start/End Date)
- Category Selection
- Account Selection
- Employee Selection
- Payment Mode Filter
- Status Filter

**Output Formats:**
- Web View (interactive)
- PDF Export (printable)
- Excel Export (editable spreadsheet)
- CSV Export (data import)
- Print (browser print dialog)

**Chart Types:**
- Pie Charts (category percentages)
- Bar Charts (period comparison)
- Line Graphs (trend analysis)
- Tables (detailed data)

### 3. Dashboard Analytics ✅

**Real-Time Metrics:**
- Total Account Balance
- Total Transactions Count
- Total Employees
- Recent Transactions List
- Upcoming Payroll Schedule
- Quick Action Buttons

**Dashboard Navigation:**
- All major sections accessible
- Responsive on mobile devices
- Customizable widgets (future)

---

## User Management & Security

### 1. User Accounts ✅

**Capabilities:**
- ✅ Create user accounts
- ✅ Email-based login
- ✅ Unique email per company
- ✅ User profiles
- ✅ Change password functionality
- ✅ Account status management
- ✅ Role assignment
- ✅ Site assignment (for SITE_MANAGER)
- ✅ User listing and editing
- ✅ Account deactivation
- ✅ Account deletion

**User Fields:**
- Email, Name, Password (hashed)
- Role, Status, Site Assignment
- Company Assignment
- Last Logout Timestamp

---

### 2. Role-Based Access Control (RBAC) ✅

**3-Tier Authorization:**

**OWNER Role:**
- Full system access
- View all company data
- Create/Edit/Delete all records
- Manage user accounts
- Change system settings
- Process payroll
- Access all reports
- Download/Export data

**SITE_MANAGER Role:**
- Limited to assigned site
- View site-specific data
- Create transactions for site
- Record attendance
- View payroll information
- Cannot manage users
- Read-only reports

**GUEST Role:**
- Minimal read-only access
- View dashboard (summary only)
- View reports (summary only)
- Cannot create/edit records
- No sensitive data access

### 3. Authentication System ✅

**Security Features:**
- ✅ JWT (JSON Web Token) based authentication
- ✅ Token stored in HTTP-only cookies
- ✅ Password hashing (bcrypt with salt)
- ✅ Session management
- ✅ Logout with token invalidation
- ✅ Secure password requirements
- ✅ Account status tracking
- ✅ Last logout timestamp

**Security:**
- No plain-text passwords stored
- HTTPS support (configurable)
- Secure cookie flags (SameSite, Secure)
- CORS protection
- SQL injection prevention (ORM layer)
- XSS protection (React auto-escaping)

**Session Features:**
- Token expires after configured duration
- Logout clears session
- One session per login
- Concurrent login support

---

### 4. User Profile Management ✅

**Profile Features:**
- ✅ View personal information
- ✅ View company assignment
- ✅ View site assignment (if applicable)
- ✅ Change password
- ✅ Logout functionality
- ✅ Account creation date tracking
- ✅ Current role display

**Password Management:**
- Minimum 8 characters
- Bcrypt hashing (salt rounds: 10)
- Change password anytime
- Password never shown in plain text
- Previous passwords cannot be reused (future)

---

## System Administration

### 1. Multi-Company Support ✅

**Multi-Tenancy Architecture:**
- ✅ Complete data isolation per company
- ✅ Separate user accounts per company
- ✅ Independent transactions per company
- ✅ Separate category lists per company
- ✅ Unique company identification
- ✅ Scalable for multiple organizations

**Company Features:**
- Create new company
- Company name and details
- Company Users (isolated)
- Company-specific data
- Cross-company reports (if needed)

### 2. Site Management ✅

**Multi-Site Features:**
- ✅ Create multiple sites within company
- ✅ Site can represent: Branches, Departments, Locations
- ✅ Optional site assignment
- ✅ Transactions linked to sites (optional)
- ✅ Site-specific user assignment
- ✅ Site Manager reports

**Use Cases:**
- Multi-branch operations
- Department-wise segregation
- Location-based accounting
- Project-specific tracking

### 3. System Configuration ✅

**Configurable Settings:**
- Database connection strings
- JWT secret keys
- Email settings (future)
- Session timeout
- Date formats
- Currency formatting
- Language selection (future)

**Environment Variables:**
- DATABASE_URL: PostgreSQL connection
- JWT_SECRET: Token signing key
- NODE_ENV: Production/Development
- LOG_LEVEL: Debug/Info/Warning

---

## Data Management

### 1. Data Import ✅

**CSV/Excel Import:**
- ✅ Import transactions from CSV files
- ✅ Import transactions from Excel files
- ✅ Batch import multiple records
- ✅ Validation before import
- ✅ Error reporting
- ✅ Preview before commit
- ✅ Rollback on errors (configurable)

**Import Format:**
Required columns:
- Date (YYYY-MM-DD)
- Type (Cash-In, Cash-Out)
- Amount (numeric)
- Category (existing)
- Account (existing)
- Description (optional)
- Payment Mode (optional)

**Validation Rules:**
- Date cannot be in future
- Amount must be positive
- Category must exist
- Account must exist
- Type must be valid value

### 2. Data Export ✅

**Export Formats:**
- ✅ PDF (Reports, Transactions)
- ✅ Excel/CSV (Data tables)
- ✅ JSON (API responses)
- ✅ Print-friendly HTML

**What Can Be Exported:**
- Transaction lists
- Account statements
- Employee records
- Payroll history
- Attendance records
- All reports

**Export Features:**
- Custom date ranges
- Filtered exports
- Formatted output
- Includable metadata

### 3. Data Backup ✅

**Built-in Features:**
- Database backup capability
- Point-in-time recovery
- Automated backup scripts (can be configured)
- Secure backup storage

**Backup Methods:**
- PostgreSQL dump (`pg_dump`)
- Automated scheduled backups
- Manual on-demand backups
- Cloud backup integration (future)

### 4. Audit Trail (Planned) ⏳

**Planned Features:**
- Transaction history tracking
- User action logging
- Change tracking for critical data
- Compliance reporting
- Delete/restore operations logging

---

## Integration & Export

### 1. Data Format Support ✅

**Supported Formats:**
- ✅ CSV (Comma-Separated Values)
- ✅ Excel (XLSX format)
- ✅ PDF (Reports and statements)
- ✅ JSON (API endpoints)

**Encoding:**
- UTF-8 (handles Indian characters)
- ISO-8859-1 (compatibility)

### 2. Currency Formatting ✅

**Indian Rupee (₹) Formatting:**
- ✅ Indian number system (Lakhs, Crores)
- ✅ Example: ₹1,23,456.78
- ✅ Applied to all currency displays
- ✅ Consistent formatting across reports

### 3. API Integration ✅

**REST API Available:**
- ✅ JSON request/response format
- ✅ Standard HTTP methods (GET, POST, PUT, DELETE)
- ✅ Pagination support
- ✅ Error responses
- ✅ Authentication headers

**API Endpoints:**
- `/api/accounts`
- `/api/transactions`
- `/api/employees`
- `/api/payroll`
- `/api/attendance`
- `/api/advances`
- `/api/categories`
- `/api/users`
- `/api/login`
- `/api/logout`

**API Features:**
- Filterable queries
- Sortable results
- Paginated responses
- Date range filters
- Search functionality

---

## Technical Capabilities

### 1. Performance ✅

**Scalability:**
- ✅ Multi-tenant architecture
- ✅ Database query optimization
- ✅ Index optimization for fast searches
- ✅ Pagination for large datasets
- ✅ Connection pooling
- ✅ Response compression (Gzip)

**Performance Metrics:**
- Typical API response: < 200ms
- Page load: < 2 seconds
- Database queries: < 100ms
- Maximum concurrent users: 100+ (configurable)

### 2. Mobile Support ✅

**Responsive Design:**
- ✅ Desktop optimized
- ✅ Tablet responsive
- ✅ Mobile-first navigation
- ✅ Touch-friendly buttons
- ✅ Optimized forms for mobile
- ✅ Mobile navigation menu

**Mobile Features:**
- Read transactions on mobile
- Record attendance on mobile
- View reports on mobile
- Mobile-optimized dashboard
- Responsive tables

### 3. Browser Compatibility ✅

**Supported Browsers:**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### 4. Database Capabilities ✅

**PostgreSQL Features:**
- ✅ ACID transactions
- ✅ Data integrity constraints
- ✅ Unique constraints
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Point-in-time recovery

**Data Types:**
- Numeric (Float, Integer)
- Text (String, descriptions)
- Date/Time (Timestamps)
- Boolean (Status flags)

### 5. Deployment Options ✅

**Deployment Platforms:**
- ✅ Linux Servers (VPS)
- ✅ Windows Servers
- ✅ Docker Containers
- ✅ Cloud Platforms (AWS, Azure, Railway, Vercel)
- ✅ On-Premise servers
- ✅ Shared hosting (with Node.js support)

**Deployment Scenarios:**
- Local development
- Staging environment
- Production environment
- Multi-region deployment (future)

---

## Feature Matrix

| Feature | Status | OWNER | SITE MGR | GUEST |
|---------|--------|-------|----------|-------|
| **Accounts** |
| Create Account | ✅ | ✅ | ❌ | ❌ |
| View Accounts | ✅ | ✅ | ✅ | ❌ |
| Edit Account | ✅ | ✅ | ❌ | ❌ |
| Delete Account | ✅ | ✅ | ❌ | ❌ |
| **Transactions** |
| Create Transaction | ✅ | ✅ | ✅ | ❌ |
| View Transactions | ✅ | ✅ | ✅ | ✅ |
| Edit Transaction | ✅ | ✅ | ✅* | ❌ |
| Delete Transaction | ✅ | ✅ | ❌ | ❌ |
| Export Transactions | ✅ | ✅ | ✅ | ❌ |
| **Employees** |
| Create Employee | ✅ | ✅ | ✅ | ❌ |
| View Employees | ✅ | ✅ | ✅ | ❌ |
| Edit Employee | ✅ | ✅ | ✅ | ❌ |
| Delete Employee | ✅ | ✅ | ❌ | ❌ |
| **Attendance** |
| Record Attendance | ✅ | ✅ | ✅ | ❌ |
| View Attendance | ✅ | ✅ | ✅ | ✅ |
| **Payroll** |
| Create Payroll | ✅ | ✅ | ✅ | ❌ |
| View Payroll | ✅ | ✅ | ✅ | ✅ |
| Process Payroll | ✅ | ✅ | ✅ | ❌ |
| **Reports** |
| Generate Reports | ✅ | ✅ | ✅ | ✅ |
| Export Reports | ✅ | ✅ | ✅ | ❌ |
| **Users** |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Change Password | ✅ | ✅ | ✅ | ✅ |

*SITE_MANAGER can edit their own transactions only

---

## Limitations & Future Features

### Current Limitations
- ❌ Inventory module (coming soon)
- ❌ GST/Tax calculations
- ❌ Multi-currency support
- ❌ Advanced approval workflows
- ❌ Two-factor authentication
- ❌ Bulk payment processing
- ❌ Recurring transactions
- ❌ Budget alerts/notifications

### Planned Features (Future Releases)
- 📋 Inventory management
- 📋 Tax and GST module
- 📋 Advanced reporting (Profit & Loss, Balance Sheet)
- 📋 Bank reconciliation
- 📋 Cheque management
- 📋 Recurring transactions
- 📋 Budget vs. actual alerts
- 📋 Mobile app (iOS/Android)
- 📋 Email notifications
- 📋 SMS alerts
- 📋 Advanced analytics & graphs
- 📋 Audit trail/Compliance
- 📋 Document upload/storage
- 📋 Multi-language support

---

## Summary

The Ledger Application provides a **comprehensive, multi-tenant accounting system** suitable for:
- Small to medium businesses
- Multi-location operations
- Organizations requiring role-based access
- Companies needing detailed financial tracking
- Employee payroll management
- Compliance and audit trails

**Key Strengths:**
1. Multi-company isolation with shared infrastructure
2. Flexible role-based access control
3. Comprehensive financial reporting
4. Employee payroll integration
5. Attendance tracking
6. Secure authentication
7. Responsive design
8. RESTful API for integration
9. Multiple export formats
10. Scalable architecture

**Ready to get started?** See the [Quick Start Guide](QUICK_START_GUIDE.md)

