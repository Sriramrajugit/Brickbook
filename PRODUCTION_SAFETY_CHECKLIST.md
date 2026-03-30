# 🔒 Production Database Safety Checklist

## Pre-Deployment Database Protection

### ✅ What's Protected
- **seed.ts**: Now blocks execution if `NODE_ENV=production` 
- **postinstall script**: Only runs `prisma generate` (no data operations)
- **Upsert Operations**: Never delete existing records

### ❌ What's NOT Protected (Manual Prevention Required)

#### **NEVER RUN in Production:**
```bash
# 🚫 DESTRUCTIVE - Wipes entire schema
prisma migrate reset --force

# 🚫 DESTRUCTIVE - Seeds test data (blocked by NODE_ENV check)
prisma db seed
```

#### **SAFE TO RUN in Production:**
```bash
# ✅ SAFE - Only generates client
npm install
prisma generate

# ✅ SAFE - Forward-only migrations
prisma migrate deploy

# ✅ SAFE - Read-only
prisma studio
```

---

## Safe Deployment Steps

### 1. Pre-Deployment Backup
```bash
# Always backup first
pg_dump -U postgres DATABASE_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Deploy Code
```bash
# On production server
git pull origin main
npm install              # postinstall runs, safe ✅
npm run build
npm start
```

### 3. Verify No Data Loss
```sql
-- Check records still exist
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM payrolls;
SELECT COUNT(*) FROM transactions;
```

---

## Emergency Recovery

### If Data Was Accidentally Deleted

```bash
# 1. Stop the application
# 2. Restore from backup
psql DATABASE_NAME < backup_YYYYMMDD_HHMMSS.sql
# 3. Restart application
npm start
```

---

## Environment Variables (Critical)

### Production (.env.production)
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-server/ledger_prod
```

**⚠️ Ensure `NODE_ENV=production` is set on production server**

This enables the safety guard in seed.ts.

---

## Backup Recommendations

- ✅ Daily automated backups
- ✅ Weekly off-site backups
- ✅ Test restore procedure quarterly
- ✅ Keep last 30 days of backups
- ✅ Document backup locations

---

## Post-Deployment Verification

```sql
-- Verify database integrity
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM payrolls;
```

If counts match pre-deployment, you're good!

---

**Your database is protected!** 🔒
