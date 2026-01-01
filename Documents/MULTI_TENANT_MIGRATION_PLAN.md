# Multi-Tenant Architecture Migration Plan

## Current State
- Site-based organization (Site → Accounts, Employees, Categories)
- User linked to Site
- Roles: OWNER, SITE_MANAGER, GUEST
- No Company model (missing tenant isolation)

## Target State (Per Document)
- **Company** = Tenant (complete data isolation)
- Each User belongs to ONE Company
- Company → Sites/Accounts (multiple)
- Roles: OWNER, ADMIN, SITE_MANAGER
- JWT includes: user_id, company_id, role, account_id
- Row Level Security (RLS) enabled
- All business tables have companyId

## Migration Steps

### Phase 1: Schema Changes
1. Add Company model
2. Rename Site → Account (align with document terminology)
3. Add companyId to all business tables
4. Add ADMIN role to enum
5. Update User model with companyId
6. Add RLS policies

### Phase 2: Data Migration
1. Create default company for existing data
2. Link all existing sites to default company
3. Link all users to default company
4. Populate companyId in all business tables

### Phase 3: Auth Enhancement
1. Update JWT to include company_id, account_id
2. Update auth middleware to extract tenant context
3. Implement tenant filtering middleware

### Phase 4: API Hardening
1. Add company filtering to ALL queries
2. Remove hardcoded values
3. Fetch dropdown values from DB with tenant filter
4. Enforce least privilege

### Phase 5: Testing
1. Test cross-tenant isolation
2. Test role-based access
3. Test RLS policies
4. Security audit
