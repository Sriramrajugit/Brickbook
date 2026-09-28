# Customer Package Selection - Implementation Guide

## Overview
The onboarding system now supports three customer package tiers: **Foundation**, **Structure**, and **Landmark**. Each tier includes specific modules and features that progressively expand capabilities.

## Package Tiers

### 📘 Foundation Package
**Best for:** Startups and basic accounting needs

**Modules included:**
- Dashboard
- Transactions
- Attendance
- Payroll
- Reports
- Masters:
  - Accounts
  - Categories
  - Employees & Partners
  - Users

### 🏢 Structure Package
**Best for:** Growing businesses with vendor management

**Includes Foundation + :**
- Bills & Invoices
- Import Data
- Advanced reporting capabilities

### 🏗️ Landmark Package
**Best for:** Enterprise customers with complex operations

**Includes Structure + :**
- Bill of Quantities (BOQ)
- Future modules (coming soon)
- Advanced features

## How to Onboard with Package Selection

### Step 1: Access Admin Panel
- Navigate to `/admin` (requires OWNER role)
- Click **"+ Onboard Customer"** button

### Step 2: Fill Company Details
- Company Name
- Owner Name
- Owner Email
- Owner Password
- Main Account Budget

### Step 3: Select Package
Choose from the dropdown:
```
Foundation - Dashboard, Transactions, Attendance, Payroll, Reports, Masters
Structure - Foundation + Bills & Invoices, Import Data
Landmark - Structure + BOQ, Future Modules
```

### Step 4: Submit
Click **"Onboard Customer"** to create the customer with selected package.

The system will:
1. Create the company
2. Create main site
3. Create owner user account
4. Create main account with specified budget
5. Create default categories
6. **Store the selected package tier**

## Technical Details

### Database Schema
The `Company` model now includes:
```prisma
package CustomerPackage @default(FOUNDATION)
```

Where `CustomerPackage` enum has values:
- `FOUNDATION`
- `STRUCTURE`
- `LANDMARK`

### API Endpoints

#### POST /api/admin/companies
Creates a new customer with package selection.

**Request body:**
```json
{
  "companyName": "Acme Corp",
  "ownerEmail": "owner@acme.com",
  "ownerName": "John Doe",
  "ownerPassword": "secure_password",
  "mainAccountBudget": 100000,
  "selectedPackage": "FOUNDATION" // Optional, defaults to FOUNDATION
}
```

**Response:**
```json
{
  "message": "Customer onboarded successfully",
  "data": {
    "companyId": 1,
    "companyName": "Acme Corp",
    "ownerId": 1,
    "ownerEmail": "owner@acme.com",
    "siteId": 1,
    "accountId": 1
  }
}
```

#### GET /api/admin/companies
Lists all companies with pagination. Includes package information.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Acme Corp",
      "package": "FOUNDATION",
      "createdAt": "2024-01-15T10:30:00Z",
      "_count": {
        "users": 2,
        "employees": 5,
        "accounts": 3,
        "transactions": 42
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Module Access Control Utility

Use the `packageModules.ts` utility to check and manage module access:

```typescript
import {
  hasModuleAccess,
  getPackageModules,
  getPackageTierLevel,
  getPackageBadgeColor,
  getSuggestedUpgrades,
} from '@/lib/packageModules'

// Check if a module is available
if (hasModuleAccess('FOUNDATION', 'Bills & Invoices')) {
  // This will return false
}

// Get all modules for a package
const modules = getPackageModules('STRUCTURE')
// Returns array of module names

// Get tier level (for comparison/sorting)
const level = getPackageTierLevel('LANDMARK') // Returns 3

// Get badge color for UI
const color = getPackageBadgeColor('STRUCTURE') // Returns 'bg-green-100 text-green-800'

// Get suggested upgrades
const upgrades = getSuggestedUpgrades('FOUNDATION')
// Returns ['STRUCTURE', 'LANDMARK']
```

## UI Components

### Admin Panel Companies Table
Each company now displays:
- Company name
- **Package tier** (with color-coded badge)
- Users count
- Employees count
- Accounts count
- Transactions count
- Creation date
- Actions (View, Delete)

Package badges use visual color coding:
- **Foundation**: Blue
- **Structure**: Green
- **Landmark**: Purple

### Onboarding Form
The form includes a package selector with:
- Dropdown menu
- Clear descriptions of what each package includes
- Helpful text explaining the differences

## Future Implementation

### Navigation/Feature Gating
To restrict navigation items based on package:

```typescript
import { hasModuleAccess } from '@/lib/packageModules'

const Navigation = ({ company }) => {
  return (
    <>
      {hasModuleAccess(company.package, 'Bills & Invoices') && (
        <NavItem href="/bills">Bills & Invoices</NavItem>
      )}
      {hasModuleAccess(company.package, 'BOQ') && (
        <NavItem href="/boq">BOQ</NavItem>
      )}
    </>
  )
}
```

### Page-Level Access Control
Protect pages based on company package:

```typescript
// In page.tsx
const CompanyPage = ({ params }) => {
  const company = await getCompany(params.id)
  
  if (!hasModuleAccess(company.package, 'Bills & Invoices')) {
    return <UpgradePrompt />
  }
  
  return <BillsInvoicesContent />
}
```

## Frequently Asked Questions

### Q: Can I change a customer's package after onboarding?
**A:** Currently packages are set at onboarding. Support for package upgrades can be added to the customer management UI.

### Q: What happens if an invalid package is submitted?
**A:** The system defaults to FOUNDATION package.

### Q: Are there limits on the number of customers per package?
**A:** No current limits are enforced. This can be added based on business requirements.

### Q: How do I implement navigation restrictions based on package?
**A:** Use the `hasModuleAccess()` utility function in navigation components and page-level checks.

## Troubleshooting

### Package not appearing in companies list
- Ensure database migration was applied: `npx prisma db push`
- Regenerate Prisma client: `npx prisma generate`
- Check browser cache is cleared

### Form not submitting with package
- Verify `selectedPackage` is included in the request body
- Check browser console for errors
- Ensure TypeScript compilation has no errors

### Module access utility not working
- Import from correct path: `@/lib/packageModules`
- Ensure package name matches enum values (case-sensitive)
- Module names must match exactly as defined in PACKAGE_MODULES
