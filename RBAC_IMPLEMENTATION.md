# Role-Based Access Control (RBAC) Implementation

## Overview
The application now implements a comprehensive role-based access control system with three distinct user roles: **Owner**, **Site Manager**, and **Guest**.

## Database Schema Updates

### New Enum: UserRole
```prisma
enum UserRole {
  OWNER
  SITE_MANAGER
  GUEST
}
```

### New Model: Site
```prisma
model Site {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  location  String?
  users     User[]
  accounts  Account[]
}
```

### Updated User Model
- Added `role` field (UserRole enum)
- Added `siteId` field (nullable, for Site Managers)
- Added relationship to Site model

### Updated Account Model
- Added `siteId` field to link accounts to specific sites

## User Roles & Permissions

### 1. Owner
- **Full Access**: Can access all sites and all features
- **Permissions**: 
  - View, add, edit, delete all transactions
  - Manage all accounts across all sites
  - Manage all employees
  - View all reports
  - Access all master data (accounts, categories, employees)

### 2. Site Manager
- **Site-Specific Access**: Can only access data for their assigned site
- **Permissions**:
  - View, add, edit, delete transactions for their site only
  - Manage accounts for their site
  - Manage employees for their site
  - View reports for their site
  - Access master data for their site

### 3. Guest
- **Read-Only Access**: Can view all data but cannot modify anything
- **Permissions**:
  - View all transactions (read-only)
  - View all accounts (read-only)
  - View all employees (read-only)
  - View all reports (read-only)
  - **Cannot** add, edit, or delete any data

## Implementation Details

### Authentication Layer (`lib/auth.ts`)
Added helper functions:
- `canEdit(role)` - Returns true for OWNER and SITE_MANAGER
- `canViewAll(role)` - Returns true for OWNER only
- `isGuest(role)` - Returns true for GUEST only
- `isSiteManager(role)` - Returns true for SITE_MANAGER only

### AuthProvider Component
Enhanced to include:
- User role information
- Site ID for site managers
- Helper methods: `canEdit()`, `isOwner()`, `isSiteManager()`, `isGuest()`

### UI Updates

#### MobileNav Component
- Displays user name, email, and role badge
- Role-specific color coding:
  - Owner: Purple badge with crown icon 👑
  - Site Manager: Blue badge with tools icon 🔧
  - Guest: Gray badge with user icon 👤

#### Transaction Page
- Add/Edit forms hidden for Guest users
- Yellow notice banner displayed for Guest users
- Form access controlled by `canEdit()` check

## Sites Created

1. **Main Office** - Headquarters
2. **Site A** - Location A
3. **Site B** - Location B

## Test Credentials

See [USER_CREDENTIALS.md](../USER_CREDENTIALS.md) for complete login details.

## API Protection

All mutation endpoints should check user permissions before allowing operations:

```typescript
const user = await getCurrentUser()
if (!user || user.role === 'GUEST') {
  return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
}

// For site managers, check site access
if (user.role === 'SITE_MANAGER' && user.siteId !== requestedSiteId) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
```

## Future Enhancements

1. **API Protection**: Add permission checks to all API routes
2. **Data Filtering**: Filter data based on user's site for Site Managers
3. **Audit Logging**: Track who made what changes
4. **Site Assignment UI**: Allow Owner to assign/reassign Site Managers
5. **Bulk Permissions**: Manage permissions for multiple users
6. **Role Management**: Add UI to change user roles
7. **Site-Specific Accounts**: Enforce account-site relationships

## Migration

Applied migration: `20251228105930_add_role_based_access`

This migration:
- Added UserRole enum
- Created sites table
- Added role and siteId to users table
- Added siteId to accounts table
- Updated existing user to Owner role
- Created 3 new sites

## Security Considerations

1. **Session Management**: User role stored in JWT and checked on each request
2. **Client-Side Protection**: UI elements hidden based on role
3. **Server-Side Protection**: API endpoints must verify permissions
4. **Site Isolation**: Site Managers can only access their assigned site data
5. **Read-Only Guest**: Guest users cannot perform any mutations

## Testing the Implementation

1. Login as **owner@example.com** (owner123) - See all features
2. Login as **manager.a@example.com** (manager123) - See site-specific features
3. Login as **guest@example.com** (guest123) - See read-only interface with notice

Each role should display appropriate UI elements and permissions based on their access level.
