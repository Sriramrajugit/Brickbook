# User Management Feature

## Overview
Added a comprehensive user management screen under **Master → Users** menu (OWNER role only).

## Features Implemented

### 1. User List View
- Display all users with their details:
  - Name and Email
  - Role (OWNER / SITE_MANAGER / GUEST)
  - Assigned Site
  - Created Date
- Color-coded role badges
- Responsive table layout

### 2. Add New User
- Create users with:
  - Email (unique)
  - Name
  - Password
  - Role selection
  - Site assignment (except for OWNER role)
- Automatic password hashing
- Email uniqueness validation

### 3. Edit User
- Update user details:
  - Name
  - Role
  - Site assignment
  - Password (optional - leave blank to keep current)
- Cannot change email (unique identifier)

### 4. Delete User
- Remove users from the system
- Protection: Cannot delete your own account
- Confirmation prompt before deletion

### 5. Role-Based Access
- **OWNER**: Full access - can see all users from all sites, create/edit/delete
- **SITE_MANAGER**: Can only see users from their own site, cannot manage
- **GUEST**: Can only see users from their own site, cannot manage

### 6. Site Assignment Logic
- **OWNER** role: `siteId = null` (can access all sites)
- **SITE_MANAGER** / **GUEST**: Must be assigned to a specific site

## Files Created/Modified

### New Files:
1. `web/app/users/page.tsx` - User management UI
2. `web/app/api/users/route.ts` - List and create users
3. `web/app/api/users/[id]/route.ts` - Update and delete users
4. `web/app/api/sites/route.ts` - List sites for dropdown

### Modified Files:
1. `web/app/components/MobileNav.tsx` - Added Users menu item under Master (owner-only)

## API Endpoints

### GET /api/users
**Access**: All authenticated users
**Returns**: List of users (filtered by role)
- OWNER sees all users
- Others see only users from their site

### POST /api/users
**Access**: OWNER only
**Body**:
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "role": "SITE_MANAGER",
  "siteId": 1
}
```
**Returns**: Created user object

### PUT /api/users/:id
**Access**: OWNER only
**Body**:
```json
{
  "name": "Updated Name",
  "role": "SITE_MANAGER",
  "siteId": 2,
  "password": "newpassword" // optional
}
```
**Returns**: Updated user object

### DELETE /api/users/:id
**Access**: OWNER only
**Returns**: Success message
**Protection**: Cannot delete own account

### GET /api/sites
**Access**: All authenticated users
**Returns**: List of sites (OWNER sees all, others see their own)

## Security Features

1. **Authentication Required**: All endpoints check for valid user session
2. **Role-Based Access Control**:
   - Only OWNER can create/edit/delete users
   - Users can only see users from their scope (site)
3. **Password Security**: Passwords hashed with bcrypt before storage
4. **Self-Protection**: Cannot delete your own account
5. **Email Uniqueness**: Enforced at database and API level
6. **Site Validation**: Non-OWNER roles must have a site assigned

## Usage

### Access the Page:
1. Login as OWNER (owner@example.com / owner123)
2. Click **Master** menu
3. Click **Users** (only visible to OWNER)

### Create a User:
1. Click **+ Add User** button
2. Fill in:
   - Email
   - Name
   - Password
   - Role
   - Site (if not OWNER)
3. Click **Create**

### Edit a User:
1. Click **Edit** button next to user
2. Update fields (leave password blank to keep current)
3. Click **Update**

### Delete a User:
1. Click **Delete** button next to user
2. Confirm deletion

## Example Users

Current test users in database:
```
OWNER:
- Email: owner@example.com
- Password: owner123
- Site: All sites (null)

SITE_MANAGER (Site A):
- Email: manager.a@example.com
- Password: manager123
- Site: Site A (id=2)

SITE_MANAGER (Site B):
- Email: manager.b@example.com
- Password: manager123
- Site: Site B (id=3)
```

## Multi-Tenancy Integration

The user management system fully integrates with the multi-tenancy architecture:
- Users are assigned to specific sites
- OWNER role can manage users across all sites
- SITE_MANAGER can only view their site's users
- All user operations respect site boundaries

## Next Steps (Optional Enhancements)

1. **User Activity Log**: Track user login/logout times
2. **User Permissions**: Fine-grained permissions beyond roles
3. **Bulk Operations**: Create multiple users at once
4. **Password Reset**: Email-based password reset flow
5. **User Status**: Active/Inactive status with deactivation instead of deletion
6. **Audit Trail**: Track who created/modified users
7. **Export**: Export user list to CSV/Excel
