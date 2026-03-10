# Ledger Application - Quick Start Guide

**Version:** 1.0  
**Last Updated:** March 2026

A comprehensive quick-start guide covering installation, basic setup, and common operations.

---

## 📋 Table of Contents

1. [For Users](#for-users)
2. [For Administrators](#for-administrators)
3. [For Developers](#for-developers)

---

## For Users

### Accessing the Application

**Step 1: Getting Your Credentials**
- Contact your system administrator
- Request your login email and temporary password
- You'll receive login details via email

**Step 2: First Login**
1. Open the application URL in your browser
2. Enter your email address
3. Enter your password
4. Click **Login**

**Step 3: Change Your Password**
1. Click your name in the top-right corner
2. Select **Profile**
3. Click **Change Password**
4. Enter your new password (min 8 characters)
5. Click **Update**

### Your First Transaction

**Add Your First Transaction:**
1. Click **Transactions** in the menu
2. Click **Add Transaction**
3. Fill in details:
   - **Date:** Today (default)
   - **Type:** Choose "Cash-In" (money received) or "Cash-Out" (money spent)
   - **Amount:** Enter amount in ₹
   - **Category:** Select appropriate category (e.g., "Sales" for income)
   - **Account:** Choose which account this affects
   - **Payment Mode:** e.g., "G-Pay", "Cash"
   - **Description:** (Optional) What is this transaction about?
4. Click **Save Transaction**

**Boom!** Your first transaction is recorded. 🎉

### Common Daily Tasks

**Recording Employee Attendance:**
1. Click **Attendance**
2. Select the date
3. For each employee, mark:
   - Present (1.0) = Full day
   - Half Day (0.5) = Half day
   - Absent (0.0) = Not present
4. Click **Save**

**Processing Monthly Payroll:**
1. Click **Payroll**
2. Click **Create Payroll**
3. Select employee and date range
4. System auto-calculates based on attendance
5. Click **Process Payroll**
6. Salary is automatically deducted from account

**Recording Salary Advance:**
1. Click **Salary Advances**
2. Click **Add Advance**
3. Select employee
4. Enter advance amount
5. Add reason (optional)
6. Click **Save**
7. Advance is deducted from next payroll

### Viewing Reports

**Generate a Financial Report:**
1. Click **Reports**
2. Select report type (e.g., "Transaction Report")
3. Set date range
4. Click **Generate**
5. Click **Export** to download as PDF or Excel

**Common Reports:**
- **Account Summary:** All accounts and balances
- **Transaction Report:** Detailed transactions (filterable)
- **Salary Report:** Payroll summary
- **Attendance Report:** Monthly attendance statistics

### Need Help?

- **Forgot Password:** Contact administrator
- **Lost Data:** Check "Recent Transactions" in dashboard
- **Permission Denied:** Contact administrator for role change
- **Confused About Something:** Refer to the main User Manual

---

## For Administrators

### Initial Setup (First Time)

**Step 1: Database Setup**
```bash
# Set up PostgreSQL database
# Create database: ledger
# Note username and password
```

**Step 2: Environment Configuration**
1. Go to project directory: `c:\My Data\Workspace\Ledger`
2. Create file called `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/ledger"
DIRECT_URL="postgresql://username:password@localhost:5432/ledger"
JWT_SECRET="your-secret-key-at-least-32-characters-long"
NODE_ENV="development"
```

**Step 3: Install and Initialize**
```bash
cd "c:\My Data\Workspace\Ledger"
npm install
npx prisma generate
npx prisma migrate dev --name initial
```

**Step 4: Start the Application**
```bash
npm run dev
```

Application starts at: `http://localhost:3000`

### Creating Companies

The system is **multi-tenant** - separate companies have completely isolated data.

**To Create a New Company:**
1. Start application
2. Use default login
3. Navigate to admin panel
4. Create new company with name and details
5. Assign sites (optional)

### Managing Users

**Add New User:**
1. Click **Users** (Admin only)
2. Click **Add User**
3. Enter:
   - Email address
   - Full name
   - Temporary password
   - Role: OWNER or SITE_MANAGER
   - Site (if SITE_MANAGER)
4. Click **Create**
5. Send credentials to user

**User Roles:**
- **OWNER:** Full access to all company data
- **SITE_MANAGER:** Access to only their assigned site
- **GUEST:** Read-only dashboard access

**Change User Password:**
```bash
# Contact support or use database directly if user is locked out
npx prisma studio
# Navigate to Users table, edit password
```

**Disable User Account:**
1. Click **Users**
2. Find user in list
3. Click **Edit**
4. Set Status to "Inactive"
5. Click **Save**

### Backup and Restore

**Backup Database:**
```powershell
# PowerShell (Windows)
pg_dump -h localhost -U postgres -d ledger -f "c:\backups\ledger-$(Get-Date -Format 'yyyyMMdd').sql"
```

**Restore Database:**
```powershell
psql -h localhost -U postgres -d ledger -f "c:\backups\ledger-20260310.sql"
```

**Automated Daily Backup (Windows Task Scheduler):**
1. Create PowerShell script `backup-ledger.ps1`:
```powershell
$backupDir = "c:\backups"
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir\ledger_$date.sql"
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" `
    -h localhost -U postgres -d ledger -f $backupFile
```

2. Schedule with Task Scheduler
3. Set daily at 2:00 AM

### Performance Monitoring

**Check Database Size:**
```sql
SELECT pg_size_pretty(pg_database_size('ledger'));
```

**Find Slow Queries:**
```bash
npx prisma studio
# Use the query analyzer to review slow queries
```

**Monitor Server Performance:**
```powershell
# Check server resource usage
Get-Process node | Select-Object ProcessName, ID, WorkingSet
```

### Troubleshooting

**Application Won't Start:**
```bash
# Clear cache and reinstall
npm run clean:all
npm install
npx prisma generate
npm run dev
```

**Database Connection Error:**
```bash
# Verify PostgreSQL is running
# Test connection
psql -h localhost -U postgres -d postgres
```

**Can't Log In:**
1. Check user account status in database
2. Verify credentials are correct
3. Clear browser cookies and try again
4. Reset password if forgot

**Slow Performance:**
1. Check database size and optimize if > 1GB
2. Review and create missing indexes
3. Archive old transactions to separate table

---

## For Developers

### Development Workflow

**Start Developing:**

```bash
# 1. Set up environment
cd "c:\My Data\Workspace\Ledger"
npm install

# 2. Create .env with database credentials
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/ledger"' > .env
echo 'JWT_SECRET="your-secret"' >> .env

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. Start dev server (accessible on network!)
npm run dev
```

**Server runs on:** `http://0.0.0.0:3000` (all network interfaces)

### Making Code Changes

**Client Components (UI):**
- Located in `app/` and `app/components/`
- All pages are client components (`'use client'`)
- Changes hot-reload automatically

**API Routes:**
- Located in `app/api/`
- Edit, save, server restarts automatically
- Test with curl or Postman

**Database Schema:**
- Edit `prisma/schema.prisma`
- Create migration: `npx prisma migrate dev --name description`
- Prisma client regenerates automatically

### Common Development Tasks

**Add New Entity:**

1. Add model to `prisma/schema.prisma`
```prisma
model MyEntity {
  id    Int     @id @default(autoincrement())
  name  String
  companyId Int  @relation(...)
}
```

2. Create migration
```bash
npx prisma migrate dev --name add_my_entity
```

3. Create API routes: `app/api/myentity/route.ts`

4. Create UI: `app/myentity/page.tsx`

**Add New API Endpoint:**

1. Create file: `app/api/resource/route.ts`
2. Implement GET, POST, PUT, DELETE as needed
3. Use `getCurrentUser()` from `@/lib/auth` for auth
4. Return standardized response format

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await prisma.resource.findMany({
    where: { companyId: user.companyId }
  });

  return NextResponse.json({ data });
}
```

**Add New Page:**

1. Create `app/newpage/page.tsx`
2. Import hooks and components:
```typescript
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import MobileNav from '@/app/components/MobileNav';

export default function NewPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API
  }, []);

  return (
    <div>
      <MobileNav />
      {/* Your content */}
    </div>
  );
}
```

3. Add navigation link in `app/components/Navigation.tsx`

### Project Structure Overview

```
app/
├── api/                    # API Routes
│   ├── accounts/
│   ├── transactions/
│   ├── employees/
│   ├── payroll/
│   ├── login/
│   └── ...
├── components/             # Shared components
│   ├── Navigation.tsx
│   ├── AuthProvider.tsx
│   └── MobileNav.tsx
├── accounts/               # Feature pages
├── transactions/
├── employees/
├── payroll/
├── attendance/
├── categories/
├── reports/
├── users/
├── profile/
├── login/
├── layout.tsx              # Root layout
├── page.tsx                # Dashboard
└── globals.css             # Global styles

lib/
├── prisma.ts              # Prisma singleton
├── auth.ts                # Authentication utilities
├── formatters.ts          # Currency formatting (INR)
└── ...

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Migration history

types/                      # TypeScript types
public/                     # Static assets
Documents/                  # Documentation
```

### Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run dev:https           # Start with HTTPS

# Building
npm run build              # Production build
npm start                  # Start production server

# Database
npx prisma generate       # Regenerate Prisma client
npx prisma migrate dev    # Create and apply migration
npx prisma studio        # Open database GUI

# Code Quality
npm run lint              # Run linter
npm run clean             # Clear .next cache

# Testing
npm run dev               # Start and test in browser
```

### Debugging

**Server Logging:**
```typescript
console.log('Debug:', variable);
// Appears in terminal where npm run dev is running
```

**Database Query Logging:**
Add to `.env`:
```
DATABASE_LOG=query,error,warn
```

**Browser DevTools:**
- F12 → Network tab: Monitor API requests
- F12 → Console: View errors
- F12 → Application: Check cookies

**Prisma Studio:**
```bash
npx prisma studio
# Visual database explorer
```

### Testing Changes

**Test API Route:**
```bash
# Using curl
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer TOKEN"

# Or use Postman/Insomnia apps
```

**Test Database Changes:**
```bash
npx prisma studio
# Visually inspect data
```

### Deployment Preview

**Build Production Version:**
```bash
npm run build
npm start
# Visit http://localhost:3000
```

---

## 🚀 Key Takeaways

**For Users:**
- Focus on recording accurate data
- Use categories consistently
- Review reports regularly

**For Admins:**
- Regular backups are critical
- Monitor database size
- Keep user passwords secure

**For Developers:**
- Follow existing patterns
- Test changes locally first
- Keep `.env` out of git
- Document your changes

---

## Next Steps

1. **For Users:** Read the [User Manual](USER_MANUAL.md)
2. **For Admins:** Refer to [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
3. **For Developers:** Study the existing code and patterns

## Support

- **Questions:** Check relevant documentation
- **Issues:** Document and track in your system
- **Feedback:** Share improvements with team

Happy accounting! 📊💼

