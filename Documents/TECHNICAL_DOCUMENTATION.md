# Ledger Application - Technical Documentation

**Version:** 1.0  
**Last Updated:** March 2026  
**Tech Stack:** Next.js 16.1, React 19, Prisma ORM, PostgreSQL, Tailwind CSS v4, JWT Auth

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Authentication System](#authentication-system)
6. [Development Setup](#development-setup)
7. [Deployment Guide](#deployment-guide)
8. [Database Management](#database-management)
9. [Performance Optimization](#performance-optimization)
10. [Security Considerations](#security-considerations)
11. [Troubleshooting](#troubleshooting)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Client Layer (React)                     │
│         (Next.js 16.1 App Router with SSR/SSG)          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│                 API Layer (REST)                         │
│            Next.js API Routes (/api/*)                   │
│         - Authentication (JWT)                           │
│         - CRUD Operations                                │
│         - Business Logic                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Database Layer (ORM)                        │
│              Prisma + PostgreSQL                         │
│         - Data Persistence                               │
│         - Transaction Management                         │
│         - Query Optimization                             │
└─────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Architecture

The application implements multi-company/multi-site architecture:
- **Company Level:** Top-level isolation - separate data per company
- **Site Level:** Optional subdivision within a company
- **User Assignment:** Each user assigned to a company and optionally a site
- **Data Segregation:** All queries filtered by company/site for isolation

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16.1 (App Router)
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS v4 with PostCSS
- **State Management:** React Hooks (useState, useEffect, useContext)
- **HTTP Client:** Fetch API (no external library)

### Backend
- **Runtime:** Node.js ≥20.9.0
- **Framework:** Next.js API Routes
- **Language:** TypeScript (strict mode)
- **Port:** 3000 (default), accessible on 0.0.0.0

### Database
- **Database:** PostgreSQL
- **ORM:** Prisma 5.22.0
- **Adapter:** Prisma Adapter for PostgreSQL
- **Connection:** Environment variable `DATABASE_URL`

### Authentication & Security
- **Token:** JWT (jsonwebtoken 9.0.3)
- **Storage:** HTTP-only cookies
- **Hashing:** bcryptjs 3.0.3 for password hashing
- **Encryption:** HTTPS (configurable)

### Data Processing
- **CSV Parsing:** csv-parse 6.1.0
- **Excel Handling:** xlsx 0.18.5
- **PDF Generation:** jspdf 3.0.4, jspdf-autotable 5.0.2

### Package Manager
- **npm:** ≥9.0.0
- **Node:** ≥20.9.0

---

## Database Schema

### Entity-Relationship Overview

```
Company (Multi-tenant root)
├── Users (Email unique within company)
├── Sites (Optional subdivision)
├── Accounts (Bank, Cash, etc.)
├── Categories (Transaction types)
├── Transactions (All financial entries)
├── Employees (Staff, Contractors, Suppliers)
│   ├── Attendance (Daily records)
│   ├── Payroll (Salary payments)
│   └── Advances (Salary advances)
└── Inventory (Planned feature)
```

### Core Models

#### Company
```sql
Table: companies
- id (PK)
- name (UNIQUE)
- createdAt
- updatedAt

Relations:
- One-to-Many: users, sites, accounts, categories, transactions, employees, payrolls, attendances, advances
```

**Purpose:** Root entity for multi-tenancy. Provides complete data isolation.

#### User
```sql
Table: users
- id (PK)
- email (UNIQUE)
- name
- password (bcrypt hashed)
- role (OWNER | SITE_MANAGER | GUEST)
- status (Active | Inactive | Suspended)
- siteId (FK, nullable)
- companyId (FK, required)
- logoutTime (Last logout timestamp)
- createdAt
- updatedAt

Relations:
- Belongs to: Company, Site
- One-to-Many: transactions (createdByUser)
```

**Purpose:** User authentication and authorization. Supports role-based access control.

#### Site
```sql
Table: sites
- id (PK)
- name (UNIQUE)
- location
- companyId (FK)
- createdAt
- updatedAt

Relations:
- Belongs to: Company
- One-to-Many: accounts, users, transactions
```

**Purpose:** Optional organizational units within a company (branches, locations, departments).

#### Account
```sql
Table: accounts
- id (PK)
- name
- type (General, Bank, Cash, etc.)
- budget (Expected balance)
- startDate
- endDate
- siteId (FK, nullable)
- companyId (FK)
- createdAt
- updatedAt

Relations:
- Belongs to: Company, Site
- One-to-Many: transactions
```

**Purpose:** Represent bank accounts, cash boxes, or other financial accounts.

#### Category
```sql
Table: categories
- id (PK)
- name
- description
- companyId (FK)
- createdAt
- updatedAt

Constraints:
- UNIQUE: (name, companyId) - Company-scoped unique names

Relations:
- Belongs to: Company
- One-to-Many: transactions
```

**Purpose:** Classify transactions (Income, Expenses, etc.).

#### Transaction
```sql
Table: transactions
- id (PK)
- amount (Float)
- description
- category (String - category name)
- type (Cash-In | Cash-Out)
- date (Transaction date)
- paymentMode (G-Pay, Cash, Bank Transfer, etc.)
- accountId (FK)
- categoryId (FK, nullable)
- createdBy (FK to User, nullable)
- siteId (FK, nullable)
- companyId (FK)
- createdAt
- updatedAt

Relations:
- Belongs to: Account, Category, Company, Site, User (createdBy)
```

**Purpose:** Core financial transaction records. Includes income and expenses.

**Indexes:**
- (companyId) - For fast company-level filtering
- (siteId) - For site-specific queries

#### Employee
```sql
Table: employees
- id (PK)
- name
- partnerType (Employee | Supplier | Contractor)
- etype (Designation/Job Title)
- salary (Base salary)
- salaryFrequency (Daily | Monthly)
- status (Active | Inactive)
- companyId (FK)
- createdAt
- updatedAt

Relations:
- Belongs to: Company
- One-to-Many: attendances, payrolls, advances
```

**Purpose:** Store employee/partner information and salary details.

#### Attendance
```sql
Table: attendances
- id (PK)
- employeeId (FK)
- date (Date of attendance)
- status (Float: 1.0 = Present, 0.5 = Half day, 0.0 = Absent)
- companyId (FK)

Constraints:
- UNIQUE: (employeeId, date) - One record per employee per day

Relations:
- Belongs to: Employee (CASCADE delete), Company
```

**Purpose:** Track daily employee attendance for payroll calculations.

#### Payroll
```sql
Table: payrolls
- id (PK)
- employeeId (FK)
- amount (Salary paid)
- fromDate
- toDate
- remarks
- accountId (FK)
- companyId (FK)
- createdAt
- updatedAt

Relations:
- Belongs to: Employee, Company
```

**Purpose:** Record salary payments and payroll history.

#### Advance
```sql
Table: advances
- id (PK)
- employeeId (FK)
- amount (Advance amount)
- reason
- date (Date advance given)
- companyId (FK)
- createdAt
- updatedAt

Relations:
- Belongs to: Employee, Company
```

**Purpose:** Track salary advances given to employees.

---

## API Documentation

### Authentication Endpoints

#### POST /api/login
**Purpose:** User login and token generation

**Request:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "user@company.com",
      "name": "User Name",
      "role": "OWNER",
      "companyId": 1
    }
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid email or password"
}
```

**Sets Cookie:** `auth-token` (HTTP-only, Secure in production)

#### POST /api/logout
**Purpose:** Invalidate user session

**Request:** No body required (uses cookie authentication)

**Response:**
```json
{
  "data": { "message": "Logged out successfully" }
}
```

**Clears Cookie:** `auth-token`

---

### Account Endpoints

#### GET /api/accounts
**Purpose:** List all accounts with pagination

**Query Parameters:**
```
page=1              (default: 1)
limit=10            (default: 10)
sortBy=name         (options: name, balance, date)
sortOrder=asc       (options: asc, desc)
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "HDFC Bank",
      "type": "Bank",
      "budget": 100000,
      "startDate": "2026-01-01",
      "endDate": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Authentication:** Required (JWT token)
**Authorization:** OWNER (all accounts), SITE_MANAGER (site accounts only)

#### POST /api/accounts
**Purpose:** Create new account

**Request:**
```json
{
  "name": "HDFC Bank",
  "type": "Bank",
  "budget": 100000,
  "startDate": "2026-01-01",
  "endDate": null,
  "siteId": 1
}
```

**Response:** Created account object with ID

**Authorization:** OWNER only

#### PUT /api/accounts/[id]
**Purpose:** Update account details

**Request:** Same as POST

**Response:** Updated account object

**Authorization:** OWNER only

#### DELETE /api/accounts/[id]
**Purpose:** Delete account (if no transactions)

**Response:** Success message or error

**Authorization:** OWNER only

---

### Transaction Endpoints

#### GET /api/transactions
**Purpose:** List transactions with advanced filtering

**Query Parameters:**
```
page=1                          (Pagination)
limit=20                        (Records per page)
category=Salary                 (Filter by category)
startDate=2026-01-01            (ISO format)
endDate=2026-12-31              (ISO format)
search=payment                  (Search in description)
sortBy=date                     (date, amount, category)
sortOrder=desc                  (asc, desc)
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "amount": 50000,
      "type": "Cash-Out",
      "category": "Salary",
      "description": "March salary payment",
      "date": "2026-03-01",
      "paymentMode": "Bank Transfer",
      "account": { "id": 1, "name": "HDFC Bank" },
      "categoryRef": { "id": 5, "name": "Salary" },
      "createdBy": 1,
      "createdAt": "2026-03-01T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 156, "totalPages": 8 }
}
```

#### POST /api/transactions
**Purpose:** Create new transaction

**Request:**
```json
{
  "amount": 50000,
  "type": "Cash-Out",
  "category": "Salary",
  "categoryId": 5,
  "description": "Monthly salary",
  "date": "2026-03-01",
  "paymentMode": "Bank Transfer",
  "accountId": 1
}
```

**Validation:**
- amount: Required, positive number
- type: "Cash-In" or "Cash-Out"
- accountId: Must exist and belong to company
- categoryId: Optional, must exist if provided
- date: Must not be in future

**Response:** Created transaction object

**Authentication:** Required

#### PUT /api/transactions/[id]
**Purpose:** Update transaction

**Request:** Same as POST

**Authorization:** OWNER or transaction creator

#### DELETE /api/transactions/[id]
**Purpose:** Delete transaction

**Authorization:** OWNER or transaction creator

---

### Employee Endpoints

#### GET /api/employees
**Purpose:** List employees

**Query Parameters:**
```
page=1
limit=50
status=Active           (Active, Inactive)
search=name
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "partnerType": "Employee",
      "etype": "Manager",
      "salary": 50000,
      "salaryFrequency": "Monthly",
      "status": "Active"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 12, "totalPages": 1 }
}
```

#### POST /api/employees
**Purpose:** Create new employee

**Request:**
```json
{
  "name": "John Doe",
  "partnerType": "Employee",
  "etype": "Manager",
  "salary": 50000,
  "salaryFrequency": "Monthly",
  "status": "Active"
}
```

#### PUT /api/employees/[id]
**Purpose:** Update employee information

#### DELETE /api/employees/[id]
**Purpose:** Delete employee (archive)

---

### Attendance Endpoints

#### GET /api/attendance
**Purpose:** List attendance records

**Query Parameters:**
```
employeeId=1
date=2026-03-01
startDate=2026-03-01
endDate=2026-03-31
```

#### POST /api/attendance
**Purpose:** Record or batch record attendance

**Request (Single):**
```json
{
  "employeeId": 1,
  "date": "2026-03-01",
  "status": 1.0
}
```

**Request (Batch):**
```json
{
  "records": [
    { "employeeId": 1, "date": "2026-03-01", "status": 1.0 },
    { "employeeId": 2, "date": "2026-03-01", "status": 0.5 }
  ]
}
```

**Status Values:**
- 1.0 = Full day present
- 0.5 = Half day
- 0.0 = Absent

---

### Payroll Endpoints

#### GET /api/payroll
**Purpose:** List payroll records

**Query Parameters:**
```
employeeId=1
fromDate=2026-03-01
toDate=2026-03-31
```

#### POST /api/payroll
**Purpose:** Create payroll entry

**Request:**
```json
{
  "employeeId": 1,
  "amount": 45000,
  "fromDate": "2026-03-01",
  "toDate": "2026-03-31",
  "accountId": 1,
  "remarks": "March salary"
}
```

**Logic:**
- Amount is debited from account
- Employee's pending advances are considered
- Attendance multiplier is applied if configured

#### PUT /api/payroll/[id]
**Purpose:** Update pending payroll

#### DELETE /api/payroll/[id]
**Purpose:** Cancel payroll (refunds account)

---

### Advances Endpoints

#### GET /api/advances
**Purpose:** List salary advances

**Query Parameters:**
```
employeeId=1
status=pending           (pending, recovered, partial)
```

#### POST /api/advances
**Purpose:** Record salary advance

**Request:**
```json
{
  "employeeId": 1,
  "amount": 10000,
  "reason": "Medical emergency",
  "date": "2026-02-15"
}
```

#### PUT /api/advances/[id]
**Purpose:** Update advance record

#### DELETE /api/advances/[id]
**Purpose:** Delete advance

---

### Category Endpoints

#### GET /api/categories
**Purpose:** List transaction categories

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Salary",
      "description": "Employee salary payments"
    }
  ]
}
```

#### POST /api/categories
**Purpose:** Create new category

**Request:**
```json
{
  "name": "Office Supplies",
  "description": "Stationery and office items"
}
```

**Validation:**
- name: Required, unique per company
- must not conflict with existing categories

#### PUT /api/categories/[id]
#### DELETE /api/categories/[id]

---

### User Management Endpoints

#### GET /api/users
**Purpose:** List company users

**Authorization:** OWNER only

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "email": "owner@company.com",
      "name": "Owner",
      "role": "OWNER",
      "status": "Active"
    }
  ]
}
```

#### POST /api/users
**Purpose:** Create new user

**Request:**
```json
{
  "email": "newuser@company.com",
  "name": "New User",
  "password": "TempPassword123!",
  "role": "SITE_MANAGER",
  "siteId": 1
}
```

**Authorization:** OWNER only

#### PUT /api/users/[id]
**Purpose:** Update user (role, status)

**Authorization:** OWNER only

#### DELETE /api/users/[id]
**Purpose:** Delete user (account)

**Authorization:** OWNER only

---

## Authentication System

### JWT Token Flow

```
1. User submits email/password
   ↓
2. API validates credentials (bcrypt comparison)
   ↓
3. JWT token created with payload: { userId, companyId, role }
   ↓
4. Token stored in HTTP-only cookie
   ↓
5. Cookie sent with every request
   ↓
6. Middleware/API routes extract and verify token
```

### Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": 1,
  "companyId": 1,
  "role": "OWNER",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Signed with:** `JWT_SECRET` environment variable

### Session Management

**HTTP-Only Cookie:**
- Name: `auth-token`
- Secure flag: true (in production)
- SameSite: Strict
- Expires: Based on token expiration

**logoutTime Field:**
- Tracks when user last logged out
- Prevents token reuse after logout
- Renewed on each login

### Authorization

**Role-Based Access Control (RBAC):**

| Feature | OWNER | SITE_MANAGER | GUEST |
|---------|-------|--------------|-------|
| View all accounts | ✅ | ❌ | ❌ |
| Create account | ✅ | ❌ | ❌ |
| View all transactions | ✅ | ✅ | ❌ |
| Create transaction | ✅ | ✅ | ❌ |
| Edit own transaction | ✅ | ✅ | ❌ |
| Delete any transaction | ✅ | ❌ | ❌ |
| Record attendance | ✅ | ✅ | ❌ |
| Process payroll | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ❌ |

---

## Development Setup

### Prerequisites

- Node.js ≥ 20.9.0
- npm ≥ 9.0.0
- PostgreSQL database
- Windows, macOS, or Linux OS

### Installation Steps

**1. Clone Repository:**
```bash
cd "c:\My Data\Workspace\Ledger"
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Create Environment File:**

Create `.env` in project root:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ledger"
DIRECT_URL="postgresql://user:password@localhost:5432/ledger"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/ledger_shadow"

# Authentication
JWT_SECRET="your-secret-key-min-32-characters-long"

# Application
NODE_ENV="development"
```

**4. Generate Prisma Client:**
```bash
npm run postinstall
# or
npx prisma generate
```

**5. Run Database Migrations:**
```bash
npx prisma migrate dev --name initial
```

**6. Seed Database (Optional):**
```bash
npx prisma db seed
```

**7. Start Development Server:**
```bash
npm run dev
# or
npm run dev:https  # For HTTPS with self-signed certificate
```

Visit: `http://localhost:3000`

### Development Scripts

```bash
# Start server (network accessible)
npm run dev

# Start with HTTPS
npm run dev:https

# Production build
npm build

# Start production server
npm start

# Generate Prisma client
npx prisma generate

# Database migrations
npx prisma migrate dev --name description
npx prisma db push              # Push schema (dev only)
npx prisma studio              # Prisma GUI

# Linting
npm run lint

# Clean build cache
npm run clean

# Full clean and reinstall
npm run clean:all && npm install
```

---

## Deployment Guide

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database credentials are secure
- [ ] JWT_SECRET is strong and unique
- [ ] Database backups created
- [ ] SSL certificates obtained
- [ ] Tested in staging environment
- [ ] All migrations applied
- [ ] Tests passed

### Environment Variables (Production)

```env
# Hosting
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://produser:password@dbhost:5432/ledger
DIRECT_URL=postgresql://produser:password@dbhost:5432/ledger

# Security
JWT_SECRET=your-very-secure-secret-min-32-chars
```

### Build and Deploy

**1. Build Application:**
```bash
npm run build
```

This creates `.next` directory with optimized build.

**2. Deploy to Hosting Platform:**

**Option A: Railway.app**
```bash
# Push to Railway
railway up
```

**Option B: Vercel**
```bash
# Deploy to Vercel
vercel deploy --prod
```

**Option C: VPS (Linux Server)**
```bash
# SSH into server
ssh user@server.com

# Clone repository
git clone https://github.com/user/ledger.git
cd ledger

# Install dependencies
npm install --production

# Build
npm run build

# Run with PM2 (for process management)
pm2 start npm --name "ledger" -- start
```

**Option D: Docker**

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and deploy:
```bash
docker build -t ledger .
docker run -p 3000:3000 -e DATABASE_URL=... ledger
```

### SSL/HTTPS Setup

**For Production:**
- Obtain SSL certificate from Let's Encrypt or provider
- Configure reverse proxy (nginx, Apache)
- Redirect HTTP to HTTPS
- Set `Secure` and `SameSite` flags on cookies

**Using HTTPS Locally:**
```bash
npm run dev:https
```

This generates self-signed certificates for testing.

---

## Database Management

### Database Migrations

Prisma handles migrations:

**Create Migration:**
```bash
npx prisma migrate dev --name add_new_field
```

**Apply Pending Migrations:**
```bash
npx prisma migrate deploy
```

**View Migration Status:**
```bash
npx prisma migrate status
```

**Rollback (Dev Only):**
```bash
npx prisma migrate resolve --rolled-back add_new_field
```

### Database Backup

**PostgreSQL Backup:**
```bash
pg_dump -h localhost -U username databasname > backup.sql
```

**Restore:**
```bash
psql -h localhost -U username databasename < backup.sql
```

### Database Monitoring

**Prisma Studio (GUI):**
```bash
npx prisma studio
```

Opens visual database editor at `http://localhost:5555`

**Direct SQL Query:**
```bash
psql -h localhost -U username databasename
```

### Database Performance

**Create Indexes:**
Already optimized in schema with indexes on:
- Company ID (all models)
- Site ID (site-scoped models)
- Employee ID + Date (attendance unique constraint)

**Query Analysis:**
```sql
EXPLAIN ANALYZE SELECT * FROM transactions WHERE companyId = 1;
```

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting:**
   - Next.js App Router enables automatic code splitting
   - Each route loads only necessary code

2. **Image Optimization:**
   - Use Next.js `<Image>` component
   - Automatic WebP conversion and responsive sizing

3. **Caching:**
   - Static pages cached with `layout`/`page` segments
   - API responses can be cached with SWR/React Query

4. **Minification:**
   - Production build automatically minifies CSS/JS

### Backend Optimization

1. **Database Queries:**
   - Prisma uses query optimization
   - Add indexes for frequently filtered fields
   - Use `include`/`select` to avoid N+1 queries

Example:
```typescript
// Good - fetches with relations
const transactions = await prisma.transaction.findMany({
  where: { companyId },
  include: { account: true, category: true }
});

// Avoid - separate queries
const transactions = await prisma.transaction.findMany({
  where: { companyId }
});
for (let t of transactions) {
  t.account = await prisma.account.findUnique({ where: { id: t.accountId } });
}
```

2. **Pagination:**
   - Implement pagination for large datasets
   - Default limit: 10-20 records

3. **Connection Pooling:**
   - PostgreSQL connection pooling configured
   - Reuses database connections

### API Response Optimization

1. **Response Compression:**
   - Next.js automatically gzips responses
   - Reduces payload size by 70%+

2. **Selective Fields:**
   - Use Prisma `select` to return only needed fields

3. **Search Indexing:**
   - Database indexes on `name`, `category`, `date` fields

---

## Security Considerations

### Password Security

- **Hashing:** bcryptjs with salt rounds 10
- **Requirements:** Min 8 characters (enforced on client)
- **Storage:** Never stored in plain text

**Validation:**
```typescript
const passwordHash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(inputPassword, passwordHash);
```

### Data Encryption

**In Transit:**
- HTTPS/TLS encryption (production)
- HTTP-only cookies prevent XSS access

**At Rest:**
- Database passwords encrypted in `.env`
- Sensitive data indexed appropriately
- Regular backups encrypted

### SQL Injection Prevention

- **Prisma ORM:** Parameterized queries prevent injection
- No raw SQL queries except with explicit `$queryRaw` (with validation)

### XSS Protection

- React auto-escapes JSX content
- Avoid `dangerouslySetInnerHTML`
- Input validation on all forms

### CSRF Protection

- Same-site cookies (`SameSite: Strict`)
- State validation in forms

### Rate Limiting

Currently not implemented. For production, add:
```typescript
npm install express-rate-limit
```

### Environment Variables

- Never commit `.env` files
- Use environment variable management in production
- Rotate secrets regularly

### Audit Logging

To implement audit logging:
```typescript
// Create audit log on sensitive operations
await prisma.auditLog.create({
  data: {
    userId,
    action: 'DELETE_TRANSACTION',
    resourceId: transactionId,
    timestamp: new Date()
  }
});
```

---

## Troubleshooting

### Common Issues

**Issue: Database connection error**
```
Error: P1000 Authentication failed
```

**Solution:**
- Check DATABASE_URL format
- Verify PostgreSQL server running
- Check user credentials
- Confirm network connectivity

**Issue: Prisma migration conflicts**
```
Error: Migration not found: add_field
```

**Solution:**
```bash
npx prisma migrate resolve --rolled-back add_field
npx prisma migrate deploy
```

**Issue: JWT token invalid**
```
Error: Invalid token
```

**Solution:**
- Clear browser cookies
- Regenerate JWT_SECRET if changed
- Check token expiration

**Issue: Build fails with TypeScript errors**

**Solution:**
```bash
npm run clean
npm install
npx prisma generate
npm run build
```

**Issue: Slow API responses**

**Solution:**
- Check database indexes
- Use Prisma Studio to analyze queries
- Check for N+1 queries
- Enable query logging:
  ```env
  DATABASE_LOG=query
  ```

### Logging and Debugging

**Enable Prisma Logging:**
```env
# In .env
DATABASE_LOG=query,error,warn
```

**Check Server Logs:**
```bash
# Dev server logs print to console
npm run dev
```

**Browser DevTools:**
- Network tab: Check API requests/responses
- Console: JavaScript errors
- Application tab: Inspect cookies and storage

### Performance Monitoring

**Response Times:**
- Check Network tab in DevTools
- API should respond < 200ms for typical queries

**Error Rates:**
- Monitor 5xx error responses
- Check server logs for exceptions

---

## API Response Format

### Standard Success Response
```json
{
  "data": {
    // Resource or array of resources
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Standard Error Response
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Auth required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Configuration Files

### next.config.ts
Contains Next.js compilation settings, output configuration, and environment setup.

### tsconfig.json
TypeScript configuration with:
- Target: ES2017
- Module: ESNext
- Strict mode: enabled
- Path aliases: `@/*` for root imports

### .env Format
```env
# Comments with #
VARIABLE_NAME=value
DATABASE_URL="postgres://user:pass@host/db"
```

---

## Monitoring and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review error logs
- Check database size
- Monitor disk space

**Monthly:**
- Analyze performance metrics
- Review slow queries
- Update dependencies (security patches)

**Quarterly:**
- Database optimization
- Performance tuning
- Capacity planning

### Backup Strategy

**Frequency:** Daily
**Retention:** 30 days
**Testing:** Monthly restore test

```bash
# Automated backup script
0 2 * * * pg_dump -h localhost -U user db > /backups/db-$(date +\%Y\%m\%d).sql
```

---

## Support and Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial technical documentation |

