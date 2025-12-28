# Copilot Instructions - Ledger Application

## Project Overview
This is a **Next.js 16.1 (App Router) ledger/accounting system** for managing transactions, employees, payroll, and attendance. The app uses **Prisma ORM** with **PostgreSQL**, **JWT authentication**, and **Tailwind CSS v4**.

## Architecture & Key Patterns

### 1. Authentication Flow
- **JWT tokens** stored in httpOnly cookies (`auth-token`)
- Auth utilities in [lib/auth.ts](../lib/auth.ts): `getCurrentUser()` returns current user or null
- Protected routes use `getCurrentUser()` in API routes to verify authentication
- Login endpoint: [/api/login](../app/api/login/route.ts) returns JWT token
- Logout endpoint: [/api/logout](../app/api/logout/route.ts) clears cookie
- See [AUTH-SETUP.md](../AUTH-SETUP.md) for complete authentication architecture
- **No middleware.ts exists** - authentication is handled per-route

### 2. Database & Prisma Patterns
- Prisma client singleton: `import { prisma } from '@/lib/prisma'` ([lib/prisma.ts](../lib/prisma.ts))
- Schema: [prisma/schema.prisma](../prisma/schema.prisma) - 7 models: User, Account, Category, Transaction, Employee, Attendance, Payroll, Advance
- Generated Prisma client is in `app/generated/prisma/` (excluded from git)
- Always run `prisma generate` after schema changes (included in postinstall script)
- **Key relationships:**
  - Transaction → Account (required), Transaction → Category (optional)
  - Employee → Attendance/Payroll/Advance (cascade delete on attendance)
  - See [ER-DIAGRAM.md](../ER-DIAGRAM.md) for full schema visualization

### 3. API Route Structure
- **Standard pattern** (see [app/api/transactions/route.ts](../app/api/transactions/route.ts)):
  - GET: Supports pagination (`page`, `limit`), filtering (`category`, `startDate`, `endDate`, `search`), and sorting (`sortBy`, `sortOrder`)
  - POST: Create new records, return full object with relations
  - Response format: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- **Error handling:** Return `{ error: 'message' }` with 500 status
- **All API routes** follow REST conventions: `/api/{resource}/route.ts` for collection, `/api/{resource}/[id]/route.ts` for single item

### 4. Client-Side Pages
- **All pages are client components** (`'use client'`) with extensive state management
- **Standard imports:** `useState`, `useEffect`, `MobileNav`, `useAuth` from AuthProvider, `formatINR` from formatters
- **Typical state pattern** (see [app/transactions/page.tsx](../app/transactions/page.tsx)):
  - Filter states: `startDate`, `endDate`, `filterCategory`, `searchText`
  - Pagination: `currentPage`, `totalPages`, `totalRecords`, `limit`
  - Sorting: `sortBy`, `sortOrder`
  - Data fetching with `loading` state
- **Navigation:** Desktop nav in [app/components/Navigation.tsx](../app/components/Navigation.tsx), mobile in `MobileNav`

### 5. Formatting & Display
- **Currency:** Use `formatINR(amount)` from [lib/formatters.ts](../lib/formatters.ts) for all currency displays
- Returns formatted string: `₹1,23,456.78` (Indian number system with lakhs/crores)
- **Never** display raw numbers for currency amounts

## Development Workflows

### Running the App
```bash
npm run dev           # Start dev server on 0.0.0.0 (accessible on network)
npm run build         # Build for production (runs prisma generate first)
npm start             # Start production server
```

### Database Operations
```bash
npx prisma generate   # Generate Prisma client (auto-runs on postinstall)
npx prisma migrate dev --name description  # Create new migration
npx prisma db push    # Push schema without migration (dev only)
npx prisma studio     # Open Prisma Studio GUI
```

### Testing & Maintenance
- Audit script: `.\scripts\test-web-audit.ps1` or use task "Run Audit"
- Clean build: `npm run clean` (removes .next cache)
- Fresh install: `npm run clean:all && npm install`
- See [OPTIMIZATION.md](../OPTIMIZATION.md) for size reduction strategies

## Project-Specific Conventions

### TypeScript Paths
- Use `@/*` import alias for root-level imports: `import { prisma } from '@/lib/prisma'`
- TSConfig target: ES2017, strict mode enabled

### Component Patterns
- **AuthProvider** wraps the app in [app/layout.tsx](../app/layout.tsx), provides `useAuth()` hook with `logout()` method
- **Navigation** only renders when authenticated
- **Mobile-first:** Always include `MobileNav` component for responsive design

### Data Fetching
- **Client-side fetching** with async/await and try/catch
- **No server components** for data fetching - all happens client-side via API routes
- Always handle loading states and error messages

### Form Handling
- Forms typically use controlled components with individual state variables
- Transaction type auto-selection based on category (Income categories → Cash-In, others → Cash-Out)
- Payment modes stored in transactions: default "G-Pay"

## Common Tasks

### Adding a New API Route
1. Create `app/api/{resource}/route.ts`
2. Import `{ NextRequest, NextResponse }` and `{ prisma }`
3. Export `GET`, `POST`, `PUT`, `DELETE` as needed
4. Use `getCurrentUser()` if authentication required
5. Follow pagination/filtering pattern from existing routes

### Adding a New Page
1. Create `app/{page}/page.tsx` as client component (`'use client'`)
2. Import standard utilities: `useState`, `useEffect`, `MobileNav`, `formatINR`
3. Implement filter/pagination/sort state if listing data
4. Add navigation link to [app/components/Navigation.tsx](../app/components/Navigation.tsx)
5. Add mobile nav item to `MobileNav`

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Prisma client regenerates automatically
4. Update affected API routes and TypeScript types
5. Consider data migration if changing existing fields

## Environment Variables
Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing

## Key Files Reference
- **Auth:** [lib/auth.ts](../lib/auth.ts), [app/api/login/route.ts](../app/api/login/route.ts)
- **Database:** [lib/prisma.ts](../lib/prisma.ts), [prisma/schema.prisma](../prisma/schema.prisma)
- **Utilities:** [lib/formatters.ts](../lib/formatters.ts)
- **Layout:** [app/layout.tsx](../app/layout.tsx), [app/components/Navigation.tsx](../app/components/Navigation.tsx)
- **Config:** [next.config.ts](../next.config.ts), [tsconfig.json](../tsconfig.json)

## Important Notes
- Default login: User ID 1, password "admin" (bcrypt-hashed in DB)
- All routes except `/login` require authentication
- Prisma client generation happens automatically via postinstall hook
- Build artifacts (.next, node_modules) excluded from git - see [OPTIMIZATION.md](../OPTIMIZATION.md)
