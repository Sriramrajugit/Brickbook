# Ledger Application - User Manual

**Version:** 1.0  
**Last Updated:** March 2026  
**Application:** Ledger Accounting System

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Core Features](#core-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Introduction

The **Ledger Application** is a comprehensive accounting and financial management system designed for businesses and organizations to track transactions, manage employees, monitor attendance, calculate payroll, and generate financial reports. It supports multiple companies/entities with role-based access control.

### Key Benefits
- 📊 Complete financial tracking and reporting
- 👥 Employee and attendance management
- 💰 Automated salary and advance management
- 📈 Multi-company support with isolation
- 🔐 Role-based access control
- 📱 Mobile-friendly interface

---

## Getting Started

### 1. Accessing the Application

1. Open your web browser
2. Navigate to the application URL (e.g., `http://localhost:3000` or your deployed URL)
3. You will be redirected to the **Login Page** if not already logged in

### 2. Logging In

**Login Screen:**
- **Email:** Enter your registered email address
- **Password:** Enter your password
- Click **Login** button

**First Time Login:**
- Contact your system administrator to obtain your login credentials
- Change your password on first login in the **Profile** section

### 3. Password Management

- **Change Password:** Navigate to **Profile** → **Change Password**
- **Forgot Password:** Contact your system administrator
- Use strong passwords with mix of uppercase, lowercase, numbers, and special characters

---

## Dashboard Overview

The **Dashboard** is your home page after login, showing:

### Key Metrics
- **Total Balance:** Sum of all your accounts
- **Total Transactions:** Count of all recorded transactions
- **Total Employees:** Number of active employees
- **Recent Transactions:** Latest 5 transactions
- **Upcoming Payroll:** Scheduled salary payments

### Dashboard Sections

**Quick Actions:**
- Create New Transaction
- Add Employee
- Record Attendance
- Process Payroll

**Navigation Menu:**
- **Accounts** - Manage bank/cash accounts
- **Transactions** - View and record transactions
- **Categories** - Organize transaction types
- **Employees** - Manage employee records
- **Attendance** - Track daily attendance
- **Payroll** - Calculate and process salaries
- **Salary Advances** - Track employee advances
- **Reports** - Generate financial reports
- **Users** - Manage user accounts (Admin only)
- **Profile** - Manage your account settings

---

## Core Features

### 1. ACCOUNTS MANAGEMENT

**Purpose:** Manage financial accounts (Bank, Cash Box, Wallet, etc.)

**How to Create an Account:**
1. Click **Accounts** in the navigation menu
2. Click **Add New Account** button
3. Fill in the details:
   - **Account Name:** e.g., "HDFC Bank", "Office Cash"
   - **Account Type:** Select from dropdown (Bank, Cash, Wallet, etc.)
   - **Budget:** Set the expected balance
   - **Start Date:** When the account was opened
   - **End Date:** (Optional) Leave blank for active accounts
4. Click **Save**

**Viewing Accounts:**
- See all accounts in the list with their current balances
- Click on any account to view its transaction history
- Edit details by clicking the **Edit** button
- Delete by clicking **Delete** (with confirmation)

**Account Reconciliation:**
- Monitor budget vs. actual balance
- The system shows budget allocation for each account
- Use to identify discrepancies

---

### 2. TRANSACTIONS

**Purpose:** Record all business transactions (Income and Expenses)

**Creating a Transaction:**

1. Click **Transactions** in the menu
2. Click **Add Transaction** button
3. Fill in required fields:
   - **Date:** Transaction date (defaults to today)
   - **Type:** 
     - **Cash-In:** Money received/income
     - **Cash-Out:** Money spent/expenses
   - **Amount:** Transaction amount in ₹
   - **Category:** Select transaction category
   - **Account:** Which account is affected
   - **Payment Mode:** e.g., G-Pay, Cash, Bank Transfer
   - **Description:** (Optional) Details about transaction
4. Click **Save Transaction**

**Filtering Transactions:**
- **By Date Range:** Set start and end dates
- **By Category:** Filter by transaction category
- **Search:** Use search box for keywords in description
- **Sorting:** Sort by date, amount, or category

**Transaction Types Explanation:**

| Type | When to Use | Example |
|------|------------|---------|
| **Cash-In** | Money received | Invoice payment, Loan, Refund |
| **Cash-Out** | Money spent | Rent, Salary, Supplies |

**Editing/Deleting Transactions:**
- Click **Edit** to modify transaction details
- Click **Delete** to remove (permanent, with confirmation)
- Only transaction creator can edit their transactions

---

### 3. CATEGORIES

**Purpose:** Organize and classify transactions

**Creating a Category:**

1. Click **Categories** in the menu
2. Click **Add Category** button
3. Enter:
   - **Category Name:** e.g., "Rent", "Utilities", "Sales"
   - **Description:** (Optional) What this category covers
4. Click **Save**

**Using Categories:**
- Categories help organize transactions
- Use consistent category names for better reporting
- Typical categories:
  - Income: Sales, Refund, Bonus
  - Expense: Rent, Utilities, Supplies, Salary

**Editing Categories:**
- Click **Edit** to modify
- Click **Delete** to remove (if no transactions use it)

---

### 4. EMPLOYEES

**Purpose:** Manage employee/partner information and salary

**Adding an Employee:**

1. Click **Employees** in the menu
2. Click **Add Employee** button
3. Fill in details:
   - **Name:** Full name
   - **Partner Type:** 
     - Employee (Regular staff)
     - Supplier (Vendor)
     - Contractor (Contract worker)
   - **Designation:** Job title
   - **Salary:** Monthly or daily wage
   - **Salary Frequency:** Monthly or Daily
   - **Status:** Active/Inactive
4. Click **Save**

**Employee Information:**
- View all employees with their current status
- Current salary and attendance stats
- Advance amounts pending

**Updating Employee Details:**
- Click **Edit** to modify designation, salary, or status
- Click **Deactivate** to mark as inactive (keeps records)
- Click **Delete** to remove completely

---

### 5. ATTENDANCE

**Purpose:** Track daily employee attendance

**Recording Attendance:**

1. Click **Attendance** in the menu
2. Select the **Date** for which to record attendance
3. For each employee, select status:
   - **Present (1.0):** Full day attendance
   - **Half Day (0.5):** Half-day attendance
   - **Absent (0.0):** No attendance
   - **Leave (0.0):** Authorized leave
4. Click **Save Attendance**

**Viewing Attendance:**
- View attendance records by date range
- Filter by employee name
- See attendance status and percentages
- Download attendance reports

**Attendance Report:**
- Shows monthly attendance percentage for each employee
- Used to calculate salary deductions
- Mark leave or special conditions

---

### 6. PAYROLL

**Purpose:** Calculate and manage employee salaries

**Processing Payroll:**

1. Click **Payroll** in the menu
2. Click **Create Payroll** button
3. Select:
   - **Employee:** Choose employee
   - **From Date:** Start of pay period
   - **To Date:** End of pay period
   - **Amount:** Base salary (auto-calculated if configured)
   - **Account:** Select account to debit
   - **Remarks:** (Optional) Payment notes
4. Click **Process Payroll**

**Payroll Calculation:**
- Base salary from employee record
- Adjusted for attendance percentage
- Minus any pending advances
- Account is automatically debited

**Viewing Payroll History:**
- See all payroll entries with dates and amounts
- Filter by employee or date range
- Edit pending entries (before payment)
- Delete to reverse (with confirmation)

**Payroll Reports:**
- Monthly salary summary by employee
- Total payroll expenses
- Attendance-based deductions

---

### 7. SALARY ADVANCES

**Purpose:** Track advances given to employees

**Recording an Advance:**

1. Click **Advances** in the menu (or from Employees page)
2. Click **Add Advance** button
3. Fill in:
   - **Employee:** Select employee
   - **Amount:** Advance amount in ₹
   - **Reason:** Why advance is given
   - **Date:** When advance was given
4. Click **Save**

**Advance Management:**
- Track all advances pending for each employee
- View in employee profile
- Advances deducted from next payroll automatically
- Remarks field for additional notes

**Advance Reports:**
- Total pending advances
- Advances per employee
- Advance history with dates

---

### 8. REPORTS

**Purpose:** Generate financial and operational reports

**Available Reports:**

**Financial Reports:**
1. **Account Summary**
   - All accounts with balances
   - Budget vs. actual comparison
   - Period-wise analysis

2. **Transaction Report**
   - Detailed transaction listing
   - Can filter by date, category, account
   - Export to PDF/Excel

3. **Category-wise Breakdown**
   - Expenses/income by category
   - Pie charts and bar graphs
   - Period comparison

**Payroll Reports:**
1. **Salary Report**
   - Monthly salary payouts
   - By employee or department
   - Trends over time

2. **Advance Report**
   - Pending advances
   - Recovered vs. pending

**Attendance Reports:**
1. **Monthly Attendance**
   - Employee-wise attendance %
   - Leave summary
   - Consecutive absences

**Report Features:**
- **Date Range:** Select custom periods
- **Filters:** By category, employee, account, etc.
- **Export:** Download as PDF or Excel
- **Print:** Print-friendly view
- **Charts:** Visual representations with graphs

---

### 9. PROFILE MANAGEMENT

**Accessing Your Profile:**

1. Click your **Name/Avatar** in the top-right corner
2. Select **Profile** from dropdown

**Profile Options:**

**View Profile:**
- Your name, email, role
- Company and site information
- Account creation date

**Change Password:**
1. Click **Change Password**
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Click **Update**

**Logout:**
1. Click **Logout** to end your session
2. You'll be redirected to the login page

---

### 10. IMPORT TRANSACTIONS

**Purpose:** Bulk import transactions from CSV/Excel files

**Preparing Your File:**

Create a CSV or Excel file with columns:
- **Date:** YYYY-MM-DD format
- **Type:** "Cash-In" or "Cash-Out"
- **Amount:** Numeric value
- **Category:** Category name (must exist)
- **Account:** Account name (must exist)
- **Description:** (Optional) Details
- **Payment Mode:** e.g., "Cash", "Bank"

**Importing:**

1. Click **Import** in the menu
2. Click **Choose File** and select your CSV/Excel file
3. Review preview of data to be imported
4. Click **Import** to insert records
5. Check import results and error summary

**Import Tips:**
- Ensure all categories and accounts exist before import
- Use consistent date format (YYYY-MM-DD)
- Dates should not be in future
- Valid amounts (positive numbers)

---

## User Roles & Permissions

The system supports multiple user roles with different permission levels:

### OWNER
- **Access Level:** Full system access
- **Permissions:**
  - View and manage all data across all sites
  - Create/edit/delete all records
  - Manage user accounts and roles
  - Generate all reports
  - Change system settings

### SITE_MANAGER
- **Access Level:** Limited to assigned site
- **Permissions:**
  - View data for their site only
  - Record attendance for their site
  - View payroll information
  - Cannot create new users or change settings
  - Read-only access to financial reports

### GUEST
- **Access Level:** Minimal read-only access
- **Permissions:**
  - View dashboard (limited data)
  - View reports (limited to summary)
  - Cannot create or edit any records
  - No access to sensitive financial data

### Role Assignment
- Only OWNER can assign or change user roles
- Roles are assigned during user creation
- Site-specific roles are tied to site assignment

---

## Troubleshooting

### Login Issues

**Problem:** Cannot log in
- **Solution:** 
  - Check email is correct (case-sensitive)
  - Verify password (if forgotten, contact admin)
  - Clear browser cookies and try again

**Problem:** Session expires frequently
- **Solution:**
  - This is normal for security
  - Re-login when prompted
  - Avoid leaving browser idle for long periods

### Data Not Appearing

**Problem:** Transactions not showing up
- **Solution:**
  - Check date range filter
  - Ensure you have access to the account/category
  - Clear browser cache (Ctrl+Shift+Delete)
  - Refresh the page

**Problem:** Cannot see employee records
- **Solution:**
  - Only OWNER can see all employees
  - SITE_MANAGER sees only their site's employees
  - Check if employee is marked as "Active"

### Financial Discrepancies

**Problem:** Account balance doesn't match expected
- **Solution:**
  - Check all transactions for the account
  - Look for recent edits or deletions
  - Verify transaction dates are correct
  - Contact your accountant or admin

### Cannot Perform Actions

**Problem:** Edit/Delete buttons are disabled
- **Solution:**
  - Check your user role
  - Only OWNER can delete records
  - Only transaction creator can edit their transactions
  - Contact admin if you need permissions

### Attendance Recording Issues

**Problem:** Cannot record attendance for an employee
- **Solution:**
  - Verify employee is marked "Active"
  - Check date is not in future
  - Only SITE_MANAGER and OWNER can record
  - Try refreshing and trying again

---

## FAQ

### General Questions

**Q: Can multiple users access the system simultaneously?**
A: Yes, multiple users can be logged in at the same time. Each user sees data based on their role and assigned site.

**Q: How is my data secured?**
A: Data is protected using:
- Secure password hashing (bcrypt)
- JWT token-based authentication
- Role-based access control
- HTTPS encryption (in production)

**Q: Can I change my email address?**
A: Contact your system administrator to change your email address.

**Q: How long are login sessions valid?**
A: Sessions are maintained with JWT tokens. For security, sessions may expire after extended inactivity.

### Transactions

**Q: Can I edit old transactions?**
A: Yes, you can edit any transaction you created. Use the Edit button in the transactions list.

**Q: What happens if I delete a transaction?**
A: The transaction is permanently removed and the account balance is adjusted. This action cannot be undone.

**Q: Can I export transactions?**
A: Yes, go to Reports → Transaction Report and click Export to PDF or Excel.

**Q: What payment modes are supported?**
A: Common modes include G-Pay, Cash, Bank Transfer, Check, etc. Add custom modes as needed through Categories.

### Employees & Payroll

**Q: Can I change an employee's salary mid-month?**
A: Yes, you can edit the salary amount. New salary applies to future payroll entries.

**Q: How are advances calculated in payroll?**
A: Advances are automatically deducted from the next payroll payment. If advance exceeds salary, it carries over to next month.

**Q: Can I pay partial advance?**
A: You can record partial recovery in remarks. The system deducts recorded advances automatically.

**Q: What if attendance is recorded as "Half Day"?**
A: Payroll is calculated as: `Salary × (Total Days Worked / Total Working Days) × 0.5`

### Reports

**Q: Can I generate reports for specific date ranges?**
A: Yes, most reports have date range filters. Select "From Date" and "To Date" to customize.

**Q: Can I compare current month with previous months?**
A: Use the Report filters to select different periods and note the differences.

**Q: How do I download reports?**
A: Click the **Export** button in any report to download as PDF or Excel.

### Multi-Company Support

**Q: Can one user access multiple companies?**
A: A user is assigned to one company. If you need multi-company access, contact the admin.

**Q: Is data isolated between companies?**
A: Yes, each company's data is completely isolated. Company A users cannot see Company B data.

**Q: Can I see all sites under my company?**
A: OWNER can see all sites. SITE_MANAGER sees only their assigned site.

---

## Getting Help

If you encounter issues not covered in this manual:

1. **Check the FAQ section** above
2. **Contact your system administrator** with:
   - Your user email
   - Description of the issue
   - Steps you followed when the problem occurred
   - Screenshots if possible
3. **Check application error messages** - they often provide helpful hints

---

## Updates & Support

This manual is kept current with application updates. Check the **"Last Updated"** date at the top.

For the latest features and updates, check the application's release notes.

**Support Email:** [Your Support Email]  
**Support Hours:** [Your Support Hours]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial release |

