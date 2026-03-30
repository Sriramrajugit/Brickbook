# Production Deployment Guide
# Reports + Payroll Fixes Release
# Generated: 2026-03-30

## Prerequisites
- Root/sudo access to production server
- PostgreSQL admin access
- Node.js 20+ installed
- Git access with pull permissions
- Backup of current database

## Deployment Package Contents
- PRODUCTION_DEPLOYMENT.patch - All code changes
- DEPLOY_WINDOWS.bat - Windows deployment script
- DEPLOY_LINUX.sh - Linux deployment script
- PRODUCTION_SAFETY_CHECKLIST.md - Safety procedures
- PRODUCTION_DEPLOYMENT_MANIFEST.md - Complete manifest

## Quick Deploy Commands

### Linux/Mac
```bash
# 1. Backup database
pg_dump -U postgres -d ledger_prod > backup_$(date +%Y%m%d_%H%M%S).sql 2>&1

# 2. Navigate to project
cd /path/to/ledger

# 3. Apply patch
git apply --check PRODUCTION_DEPLOYMENT.patch  # Dry-run first
git apply PRODUCTION_DEPLOYMENT.patch

# 4. Build and deploy
npm install
npm run build
npm start
```

### Windows PowerShell
```powershell
# 1. Backup database
pg_dump -U postgres -d ledger_prod > "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# 2. Navigate and deploy
cd C:\path\to\ledger
git apply PRODUCTION_DEPLOYMENT.patch
npm install
npm run build
npm start
```

## Testing the Deployment

### 1. Verify API Endpoints
```bash
# Test authentication
curl http://localhost:3000/api/auth/me

# Test payroll overlap detection (should work now)
curl http://localhost:3000/api/payroll

# Test reports
curl http://localhost:3000/api/reports/attendance
```

### 2. Test Reports Page
1. Navigate to `http://your-server/reports`
2. Click on "Attendance" tab
3. Select date range
4. Click "Export to CSV" - should download CSV file
5. Switch to "Transactions" tab
6. Click "Export to Excel" - should download XLSX file

### 3. Test Payroll Fixes
1. Go to Payroll page
2. Try creating overlapping payroll dates → should show error
3. Try creating duplicate for monthly employee → should prevent with clear message

## Rollback Plan

If critical issues occur:

### Immediate Rollback
```bash
# Revert code changes
git revert HEAD

# Restore database from backup
psql -U postgres -d ledger_prod < backup_YYYYMMDD_HHMMSS.sql

# Rebuild and restart
npm run build
npm start
```

### Verify Rollback
```bash
curl http://localhost:3000/api/auth/me  # Should work
```

## Troubleshooting

### "Patch apply failed"
- Ensure you're on the correct git branch: `git branch`
- Check for uncommitted changes: `git status`
- Apply with more verbosity: `git apply -v PRODUCTION_DEPLOYMENT.patch`

### "Module not found after npm install"
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

### "Database connection error"
- Check DATABASE_URL is set correctly
- Verify PostgreSQL is running
- Check credentials: `psql -U postgres -c "SELECT 1"`

### "Payroll overlap still allows duplicates"
- Clear Prisma cache: `rm -rf node_modules/.prisma`
- Regenerate client: `npx prisma generate`
- Restart application: `npm start`

## Monitoring Post-Deployment

### Check Logs
```bash
# Last 50 lines
tail -n 50 /var/log/ledger/app.log

# Watch logs in real-time (if using PM2)
pm2 logs ledger
```

### Database Health Check
```sql
-- Check payroll table structure
\d payrolls

-- Verify records can be created
SELECT COUNT(*) FROM payrolls;

-- Check for errors
SELECT * FROM payrolls WHERE id = (SELECT MAX(id) FROM payrolls);
```

### Application Health Check
```bash
# Check if app is responding
curl -s http://localhost:3000/api/auth/me | jq .

# Check process status (if using PM2)
pm2 status
```

## Success Indicators

✅ All endpoints responding without errors
✅ Payroll overlap detection working (409 on duplicate)
✅ Reports page loads data correctly
✅ CSV/XLSX exports working
✅ No database errors in logs
✅ Users can access all features without authentication issues
✅ Performance metrics similar to pre-deployment

## Post-Deployment Checklist

- [ ] Database backup created and verified
- [ ] Patch applied successfully
- [ ] npm install completed without errors
- [ ] npm run build succeeded
- [ ] Application started (npm start or pm2)
- [ ] All API endpoints tested
- [ ] Reports page tested with date ranges
- [ ] CSV/XLSX exports tested
- [ ] Payroll overlap detection tested
- [ ] Users notified of new features
- [ ] Monitoring/alerts configured
- [ ] Rollback backup location documented

## Support

If issues occur:
1. Check logs first: application error log
2. Test with: `curl http://localhost:3000/api/auth/me`
3. Rollback if critical: Follow "Rollback Plan" section above
4. Contact development team with logs and error details

## Summary of Changes

**Files Modified**: 13
- API routes: 4 files (payroll, attendance, employees, auth)
- Pages: 7 files (reports, payroll, attendance, employees, etc.)
- Configuration: 2 files (package.json, tsconfig.json)

**New Features**: 
- Reports with attendance analytics
- Payroll overlap detection (critical fix)
- Enhanced error handling

**Database Changes**: NONE (backward compatible)

**Deployment Time**: ~5 minutes (including build)
**Estimated Downtime**: ~1-2 minutes (during rebuild)
**Risk Level**: LOW (all changes additive/filtering only)

---
**Deployment Ready!** 🚀
