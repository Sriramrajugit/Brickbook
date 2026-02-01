# Production Deployment Guide - Brickbook Ledger

**Date:** February 1, 2026  
**Build Status:** ✅ Successfully compiled  
**Production Bundle:** Ready in `.next/` directory

---

## 🚨 CRITICAL: Production Data Protection

### ⚠️ WARNING - DO NOT DELETE ANYTHING FROM PRODUCTION DATABASE
The production database contains **REAL, LIVE DATA**. Be extremely careful when performing deployments.

**Protected Data Includes:**
- ✅ All company and organization records
- ✅ All user accounts and role assignments
- ✅ Complete transaction history
- ✅ Employee records and salary data
- ✅ Attendance tracking
- ✅ Payroll records
- ✅ Inventory and supplier information

**Safe Operations:**
- ✅ Deploying code updates
- ✅ Running migrations (backward compatible)
- ✅ Adding new features
- ✅ Updating UI/styling

**FORBIDDEN Operations:**
- ❌ `npm run seed` or any seeding script (will truncate/reset data)
- ❌ `prisma db push` with `--skip-generate` on production
- ❌ Manual SQL DELETE/TRUNCATE commands
- ❌ Database resets or migrations that drop tables
- ❌ Changing schema without backup

---

## 📋 Pre-Deployment Checklist

- [ ] Backup production database
  ```bash
  # PostgreSQL backup
  pg_dump -U postgres -h prod-db-host ledger_db > ledger_backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Verify all changes are committed to git
  ```bash
  git status  # Should show "nothing to commit, working tree clean"
  ```

- [ ] Review changed files
  ```bash
  git log --oneline -10
  ```

- [ ] Ensure `.env.production` or production environment variables are set:
  ```
  DATABASE_URL=postgresql://user:pass@prod-host:5432/ledger_db
  JWT_SECRET=your-production-secret-key
  NODE_ENV=production
  ```

---

## 🚀 Deployment Steps

### Step 1: Build Verification
The production build has been created successfully:
```
✓ Compiled successfully in 9.8s
✓ TypeScript checking passed
✓ All routes optimized and pre-rendered
```

### Step 2: Transfer Build Artifacts
Deploy only the compiled `.next/` directory along with:
- `package.json` (for dependencies reference)
- `prisma/` directory (for database schema)
- `.env.production` (production environment variables)
- `public/` directory (static assets)

**Do NOT deploy:**
- ❌ `node_modules/` (reinstall on server)
- ❌ `.env` or `.env.local` (use `.env.production` instead)
- ❌ Development files (`.git`, `temp/`, etc.)

### Step 3: Server Setup
```bash
# On production server
cd /var/www/brickbook

# Install dependencies (production only)
npm install --production

# Verify Prisma client is generated
npx prisma generate

# DO NOT run seed or migrations that delete data
# Only run migrations if you have schema changes:
# npx prisma migrate deploy  # Only if new migrations exist

# Start production server
npm start
```

### Step 4: Verify Deployment
```bash
# Check server is running
curl http://localhost:3000/login

# Verify API endpoints
curl http://localhost:3000/api/auth/me

# Check logs for errors
tail -f logs/app.log
```

---

## 📦 Today's Changes Summary

### New Features Added:
1. ✅ **Password Management System**
   - Password strength validation (8+ chars, uppercase, number, special char)
   - Change password functionality with real-time validation

2. ✅ **User Profile Page**
   - View user details (name, email, company, role, site assignment)
   - Change password form with strength indicator
   - Auto-logout after successful password change

3. ✅ **Profile Menu Component**
   - Top-right dropdown with blue circular icon button
   - Shows company name, user info, and role badge
   - Quick access to profile, change password, logout

4. ✅ **Role-Based Access Control Enhancements**
   - Master menu (Accounts, Categories, Users, Inventory) only visible to OWNER role
   - SITE_MANAGER and GUEST users cannot see Master menu

5. ✅ **Transaction SiteId Bug Fix**
   - Transactions now correctly inherit siteId from their associated account
   - Fallback to user.siteId if account has no site assignment

### Modified Files:
- `lib/formatters.ts` - Added password validation function
- `app/api/auth/change-password/route.ts` - New endpoint
- `app/profile/page.tsx` - New profile page
- `app/components/ProfileMenu.tsx` - New dropdown component
- `app/page.tsx` - Updated with ProfileMenu
- `app/transactions/page.tsx` - Updated with ProfileMenu + siteId fix
- `app/attendance/page.tsx` - Updated with ProfileMenu
- `app/payroll/page.tsx` - Updated with ProfileMenu
- `app/components/MobileNav.tsx` - Added role-based menu visibility
- `app/api/transactions/route.ts` - Fixed siteId handling in POST/PUT

### No Database Schema Changes
- ✅ All features added without schema modifications
- ✅ No migrations needed
- ✅ Fully backward compatible

---

## 🔄 Rollback Procedure (If Needed)

If deployment has issues, revert to previous version:

```bash
# On production server
cd /var/www/brickbook

# Stop current server
pm2 stop brickbook  # or: systemctl stop brickbook

# Revert code to previous commit
git revert HEAD

# Rebuild
npm run build

# Restart
pm2 start brickbook  # or: systemctl start brickbook
```

**Database remains untouched** - No rollback needed for data.

---

## 📊 Performance Optimizations

The production build includes:
- ✅ TypeScript compilation to optimized JavaScript
- ✅ Code splitting for faster page loads
- ✅ Pre-rendered static pages
- ✅ Dynamic routes optimized for server rendering
- ✅ API routes streamlined

**Bundle Size:** Optimized for production (~5-8MB including node_modules)

---

## 🔒 Security Recommendations

1. **HTTPS/TLS Required**
   - All production traffic must be encrypted
   - Use reverse proxy (nginx/Apache) with SSL certificates

2. **Environment Variables**
   - Keep JWT_SECRET secure and unique
   - Rotate JWT_SECRET periodically
   - Use strong PostgreSQL passwords

3. **Database Access**
   - Restrict database to internal network only
   - Use connection pooling (pgBouncer recommended)
   - Enable PostgreSQL query logging for audit trails

4. **API Rate Limiting**
   - Implement rate limiting on login endpoint
   - Monitor for suspicious activity

5. **Password Policy**
   - Enforce minimum password requirements (already implemented)
   - Require periodic password changes for sensitive roles
   - Implement account lockout after failed login attempts

---

## 📞 Support & Troubleshooting

### Common Issues:

**Issue: "Cannot find module '@prisma/client'"**
```bash
# Fix:
npx prisma generate
npm install
```

**Issue: "Database connection refused"**
```bash
# Check PostgreSQL is running
psql -h prod-db-host -U postgres -d ledger_db -c "SELECT 1"
# Verify DATABASE_URL in .env.production
```

**Issue: "JWT authentication failing"**
```bash
# Verify JWT_SECRET matches between servers
# Check token expiration (24 hours by default)
# Clear browser cookies and login again
```

**Issue: "Permission denied for Master menu"**
```bash
# Verify user role in database
SELECT id, name, role FROM "public"."users" WHERE id = <user_id>;
# Role must be 'OWNER' to see Master menu
```

---

## ✅ Verification Checklist After Deployment

- [ ] Application loads at production URL
- [ ] Login page displays correctly
- [ ] Can login with valid credentials
- [ ] Profile menu shows in top-right
- [ ] Password change form works
- [ ] Transactions display siteId correctly
- [ ] OWNER users see Master menu
- [ ] SITE_MANAGER users do NOT see Master menu
- [ ] GUEST users do NOT see Master menu
- [ ] All API endpoints respond correctly
- [ ] Database queries execute without errors
- [ ] No critical errors in application logs

---

## 📝 Deployment Log Template

When deploying, record:

```
Date: ___________
Time: ___________
Deployed By: ___________
Previous Version: ___________
New Version: ___________
Database Backup: ___________
Pre-Deployment Tests: ✓ / ✗
Post-Deployment Tests: ✓ / ✗
Issues Encountered: ___________
Resolution: ___________
Status: ✓ SUCCESS / ✗ ROLLBACK
```

---

## 🎯 Next Steps

1. **Immediate:**
   - Backup production database
   - Stage deployment on test environment
   - Run smoke tests

2. **Deployment:**
   - Transfer `.next/` build artifacts
   - Update environment variables
   - Restart application server

3. **Post-Deployment:**
   - Verify all features working
   - Monitor application logs for errors
   - Check database performance

4. **Monitoring:**
   - Set up error tracking (Sentry/similar)
   - Monitor API response times
   - Track user login patterns

---

**Build Status:** ✅ READY FOR PRODUCTION  
**Last Updated:** February 1, 2026  
**Build Hash:** Next.js 16.1.1 (Turbopack)
