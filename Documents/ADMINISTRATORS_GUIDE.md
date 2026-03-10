# Ledger Application - Administrator's Guide

**Version:** 1.0  
**Last Updated:** March 2026

Complete guide for system administrators covering setup, maintenance, troubleshooting, and best practices.

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [User Administration](#user-administration)
3. [Database Administration](#database-administration)
4. [Maintenance & Operations](#maintenance--operations)
5. [Monitoring & Performance](#monitoring--performance)
6. [Backup & Disaster Recovery](#backup--disaster-recovery)
7. [Security & Access Control](#security--access-control)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Initial Setup

### System Requirements

**Minimum Requirements:**
- **OS:** Windows 10+, Ubuntu 18+, macOS 10.15+
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 5GB for application, 10GB for database
- **Processor:** Dual-core 2.0 GHz or higher
- **Network:** Stable internet connection

**Recommended Configuration:**
- **OS:** Windows Server 2019+, Ubuntu Server 20.04+
- **RAM:** 8GB
- **Storage:** SSD with 20GB+ free space
- **Processor:** Quad-core 2.4 GHz

### Installation Checklist

- [ ] Install Node.js ≥ 20.9.0
- [ ] Install PostgreSQL database
- [ ] Install npm ≥ 9.0.0  
- [ ] Download/Clone application code
- [ ] Configure .env file
- [ ] Initialize database
- [ ] Start application
- [ ] Create admin account
- [ ] Test login functionality

### Step-by-Step Setup

**1. Install Node.js & npm**
```powershell
# Download from https://nodejs.org
# Or use package manager (Chocolatey on Windows)
choco install nodejs npm

# Verify installation
node --version  # Should be ≥ 20.9.0
npm --version   # Should be ≥ 9.0.0
```

**2. Install PostgreSQL**
```powershell
# Windows: Use official installer or Chocolatey
choco install postgresql

# Linux: Use apt
sudo apt-get install postgresql postgresql-contrib

# macOS: Use Homebrew
brew install postgresql
```

**3. Create Database**
```sql
-- Connect to PostgreSQL as admin
CREATE DATABASE ledger OWNER postgres;

-- Optional: Create dedicated user
CREATE USER ledger_user WITH PASSWORD 'secure_password';
ALTER DATABASE ledger OWNER TO ledger_user;
GRANT ALL PRIVILEGES ON DATABASE ledger TO ledger_user;
```

**4. Clone Application**
```bash
cd "c:\My Data\Workspace"
# Or download as ZIP file
# Extract to desired location
cd Ledger
```

**5. Configure Environment**
```bash
# Create .env file
copy .env.example .env  # If template exists
# Or create manually
cat > .env << EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/ledger"
DIRECT_URL="postgresql://postgres:password@localhost:5432/ledger"
JWT_SECRET="your-secret-key-min-32-characters-long"
NODE_ENV="production"
EOF
```

**6. Initialize Application**
```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

**7. Create Admin User**

Option A: Via Database
```sql
-- Use Prisma Studio
npx prisma studio
-- Click "Users" table → Add Record
-- Email: admin@ledger.local
-- Password: (bcrypt hash) - see next section
-- Role: OWNER
-- Status: Active
```

Option B: Via Script (create if needed)

**8. Start Application**
```bash
npm run dev        # Development
npm run build && npm start  # Production
```

**9. Verify Installation**
- Visit `http://localhost:3000`
- Login with created admin account
- Check Dashboard
- Enable users to access

---

## User Administration

### Creating Users

**Automated User Creation (Preferred):**

Via admin interface:
1. Login as OWNER
2. Click **Users**
3. Click **Add User**
4. Fill form:
   - **Email:** Unique per company
   - **Name:** Full name
   - **Temporary Password:** Auto-generated (show to user)
   - **Role:** Select OWNER or SITE_MANAGER
   - **Site:** (If SITE_MANAGER)
5. Click **Create User**
6. Send credentials securely

**Manual Database Creation:**

```sql
-- Using Prisma Studio
npx prisma studio

-- Navigate to Users table
-- Click "Create"
-- Fill fields:
{
  "email": "user@company.com",
  "name": "User Name",
  "password": "[bcrypted_password]",
  "role": "OWNER",
  "status": "Active",
  "companyId": 1,
  "siteId": null
}
```

**Password Generation Script:**

Create `gen-user-password.mjs`:
```javascript
import bcryptjs from 'bcryptjs';

const password = process.argv[2] || 'TempPass123!';
const salt = await bcryptjs.genSalt(10);
const hashed = await bcryptjs.hash(password, salt);
console.log('Hashed password:', hashed);
```

Run:
```bash
node gen-user-password.mjs "YourPassword123"
```

### Managing Users

**View All Users:**
1. Click **Users** (OWNER only)
2. See list with status, role, company

**Edit User:**
1. Find user in list
2. Click **Edit**
3. Modify:
   - Name
   - Role
   - Site assignment
   - Status
4. Click **Save**

**Disable User:**
1. Click **Edit** on user
2. Set Status to "Inactive"
3. Click **Save**
4. User cannot login

**Re-enable User:**
1. Click **Edit** on user
2. Set Status to "Active"
3. Click **Save**

**Delete User:**
1. Click **Edit** on user
2. Click **Delete** button
3. Confirm deletion
⚠️ **Warning:** Cannot be undone. Consider deactivating instead.

### Password Management

**Reset User Password:**

Option 1: User Self-Service
- User clicks Profile → Change Password
- User must know current password

Option 2: Admin Reset (via Database)
```javascript
import bcryptjs from 'bcryptjs';

const newPassword = 'TempPassword123!';
const salt = await bcryptjs.genSalt(10);
const hashed = await bcryptjs.hash(newPassword, salt);

// Use Prisma Studio
// Find user, update password field with hashed value
```

**Force Password Change:**
- Currently: (Manual process)
- Recommended: Advise user to change via Profile
- Future: Implement password expiration policy

**Password Requirements:**
- Minimum 8 characters (enforced on UI)
- Mix of uppercase, lowercase recommended
- Numbers and special characters recommended
- No dictionary words

### Role Management

**Role Permissions Summary:**

**OWNER:**
- Full access to all data
- Create/edit/delete records
- Manage users
- Process payroll
- All reports accessible

**SITE_MANAGER:**
- Limited to assigned site
- View site data
- Record attendance, transactions
- Cannot create users
- Reports read-only

**GUEST:**
- Dashboard view (summary)
- Reports read-only  
- Cannot edit or create data
- Minimal permissions

**Assigning Roles:**
1. Create user with appropriate role
2. Edit user to change role (OWNER only)
3. Can change anytime without re-login required (next session)

### Managing Inactive Users

**Recommended Inactive User Policy:**
- Deactivate after 90 days of inactivity
- Archive employee records annually
- Maintain audit trail for compliance

**Finding Inactive Users:**
```sql
-- Check last login timestamp
SELECT email, last_login FROM users 
WHERE last_login < NOW() - INTERVAL '90 days'
ORDER BY last_login;
```

---

## Database Administration

### Database Backup

**PostgreSQL Backup Methods:**

**Method 1: pg_dump (SQL Text)**
```powershell
# Full database backup
pg_dump -h localhost -U postgres -d ledger > ledger_backup.sql

# Backup with compression
pg_dump -h localhost -U postgres -F c -d ledger > ledger_backup.dump

# Scheduled daily backup (Task Scheduler)
# Create script: backup_daily.ps1
$date = Get-Date -Format "yyyyMMdd"
$backuppath = "c:\backups\ledger_$date.sql"
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" `
  -h localhost -U postgres -d ledger -f $backuppath
```

**Method 2: Automated Backup Script**

Create `backup.ps1`:
```powershell
$PostgresPath = "C:\Program Files\PostgreSQL\15\bin"
$BackupPath = "c:\backups"
$Database = "ledger"
$User = "postgres"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupPath\ledger_$Date.sql"

# Create backup
& "$PostgresPath\pg_dump.exe" -h localhost -U $User -d $Database -f $BackupFile

# Compress backup
Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force

# Delete old backups (keep last 30 days)
Get-ChildItem "$BackupPath\*.sql.zip" | Where-Object {
    $_.CreationTime -lt (Get-Date).AddDays(-30)
} | Remove-Item
```

**Schedule with Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task: "Daily Ledger Backup"
3. Trigger: Daily at 2:00 AM
4. Action: "powershell.exe -File c:\scripts\backup.ps1"
5. Set to run with admin privileges

**Backup Strategy:**
- Frequency: Daily (minimum), hourly (recommended)
- Retention: 30 days (minimum), 90 days (recommended)
- Off-site: Store copies on network/cloud
- Test: Monthly restore test

### Database Restore

**Restore from SQL Backup:**
```bash
# Restore full database
psql -h localhost -U postgres -d ledger < ledger_backup.sql

# Restore from compressed backup
pg_restore -h localhost -U postgres -d ledger ledger_backup.dump
```

**Step-by-Step Restore:**
```bash
# 1. Drop existing database (WARNING!)
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS ledger;"

# 2. Create empty database
psql -h localhost -U postgres -c "CREATE DATABASE ledger;"

# 3. Restore data
psql -h localhost -U postgres -d ledger < backup.sql

# 4. Verify
psql -h localhost -U postgres -c "SELECT COUNT(*) FROM users;"
```

### Database Migrations

**View Migration Status:**
```bash
npx prisma migrate status
```

**Create New Migration:**
```bash
# Edit schema.prisma first
# Then run:
npx prisma migrate dev --name add_new_field

# Review generated migration file
# Apply to database
```

**Deploy Migrations to Production:**
```bash
# After backup!
npx prisma migrate deploy
```

**Rollback Migration (Dev Only):**
```bash
npx prisma migrate resolve --rolled-back create_users
```

### Database Optimization

**Check Database Size:**
```sql
SELECT pg_size_pretty(pg_database_size('ledger'));
```

**Analyze and Vacuum:**
```sql
-- Optimize database (do weekly)
VACUUM ANALYZE;
```

**Find Slow Queries:**
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 second
SELECT pg_reload_conf();

-- View logs (usually in /var/log/postgresql/)
```

**Create Indexes for Performance:**
```sql
-- Already in schema, but can add:
CREATE INDEX idx_transactions_companyid_date 
ON transactions(companyId, date);
```

---

## Maintenance & Operations

### Weekly Tasks

- [ ] Review error logs
- [ ] Check disk space availability
- [ ] Verify backup completion
- [ ] Check database size
- [ ] Monitor user activity

### Monthly Tasks

- [ ] Archive old transactions (archival script)
- [ ] Review access logs
- [ ] Test database restore
- [ ] Update dependencies (security patches)
- [ ] Review slow query logs

### Quarterly Tasks

- [ ] Database optimization (VACUUM)
- [ ] Performance analysis
- [ ] Capacity planning
- [ ] Security audit
- [ ] Disaster recovery test

### Starting/Stopping Services

**Development Mode:**
```bash
npm run dev
# Runs on http://0.0.0.0:3000
# Auto-restart on file changes
# Stop: Ctrl+C
```

**Production Mode:**
```bash
npm run build
npm start
# Runs on http://0.0.0.0:3000
# Manual restart when changes deploy
```

**Using PM2 (Process Manager):**
```bash
# Install globally
npm i -g pm2

# Start application
pm2 start "npm start" --name ledger

# View status
pm2 status

# Restart
pm2 restart ledger

# Stop
pm2 stop ledger

# View logs
pm2 logs ledger

# AutoStart on reboot
pm2 startup
pm2 save
```

---

## Monitoring & Performance

### Health Checks

**Application Health:**
```bash
# Check if running
curl http://localhost:3000

# Check API
curl http://localhost:3000/api/transactions
```

**Database Health:**
```bash
# PostgreSQL connection test
psql -h localhost -U postgres -d ledger -c "SELECT NOW();"
```

**Disk Space:**
```powershell
# Windows
Get-Volume | Select-Object DriveLetter, SizeRemaining, Size

# Linux
df -h
```

**RAM Usage:**
```powershell
# Windows
Get-Process node | Measure-Object WorkingSet -Sum

# Linux
ps aux | grep node
```

### Performance Monitoring

**Response Time Monitoring:**
```bash
# Check API response times
curl -w "\nTotal time: %{time_total}s\n" http://localhost:3000/api/transactions
```

**Database Query Performance:**
```bash
# Enable query logging
DATABASE_LOG=query npm start

# Review times in console output
```

**User Activity Monitoring:**
- Check user login frequency
- Monitor transaction creation rate
- Track report generation patterns

### Capacity Planning

**Disk Space Growth:**
- Typical transaction size: 500 bytes
- With 10,000 transactions/month: ~5MB/month
- Plan for 5+ years of data: ~300MB
- Allocate extra 50% for backups

**Database Size Growth:**
```sql
-- Check schema sizes
SELECT schemaname, SUM(pg_total_relation_size(tablename))
FROM pg_tables
GROUP BY schemaname;
```

**Archive Old Data (Future):**
When database exceeds certain size:
- Archive transactions older than 2 years
- Move to archive tables
- Run VACUUM after deletion

---

## Backup & Disaster Recovery

### Disaster Recovery Plan

**Recovery Point Objective (RPO):** 1 hour
**Recovery Time Objective (RTO):** 4 hours

**Recovery Steps:**
1. Restore latest backup to new environment
2. Verify data integrity
3. Restore from transaction logs if needed
4. Test all functionality
5. Switch to restored environment
6. Communicate with users

### Testing Backups

**Monthly Backup Test:**
```bash
# 1. Restore to test database
pg_restore -h localhost -U postgres -d ledger_test backup.dump

# 2. Run queries to verify
psql -h localhost -U postgres -d ledger_test -c "SELECT COUNT(*) FROM transactions;"

# 3. Check data completeness
psql -h localhost -U postgres -d ledger_test -c "SELECT MAX(date) FROM transactions;"

# 4. Drop test database
psql -h localhost -U postgres -c "DROP DATABASE ledger_test;"
```

### Backup Documentation

Keep record of:
- Backup location
- Backup schedule
- Retention policy
- Restore procedure
- Last successful restore test
- Contact persons responsibile

---

## Security & Access Control

### Password Policies

**Recommended Policy:**
- Minimum 8 characters (enforced)
- Expiration: Every 90 days (implement in future)
- History: Cannot reuse last 5 passwords (implement in future)
- Lockout: 5 failed attempts → 30 min lockout (implement in future)

**Enforce via Application:**
- Check password strength on creation
- Warn about expiration
- Force change when expired

### Access Control Review

**Quarterly Review Procedure:**
1. List all active users: `SELECT * FROM users WHERE status = 'Active';`
2. Verify role appropriateness
3. Check site assignments
4. Identify inactive accounts (90+ days)
5. Disable/archive inactive users

**Sample Review Query:**
```sql
SELECT 
  id, email, name, role, status, 
  EXTRACT(DAYS FROM (NOW() - logoutTime)) as days_inactive
FROM users
WHERE status = 'Active'
ORDER BY logoutTime DESC;
```

### Audit Logging (Future Implementation)

Create audit table:
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(100),
  table_name VARCHAR(100),
  record_id INT,
  old_values JSON,
  new_values JSON,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

Log all sensitive operations:
- Create/Update/Delete user
- Create/Delete transaction > ₹100,000
- Payroll processing
- Advance recording

### Environment Variables Security

**Best Practices:**
- Never commit .env to git
- Use `.env.example` as template
- Rotate JWT_SECRET annually
- Different secrets per environment (dev, staging, prod)
- Store in secure vault (prod)

**Secure Secret Management:**
```bash
# Use environment variable management tools
# For production, consider:
# - AWS Secrets Manager
# - Azure Key Vault
# - Hashicorp Vault
# - 1Password Business
```

### Network Security

**Firewall Rules:**
- Restrict database access to application server IP
- Allow only HTTPS (443) for public access
- Block port 3000 from internet (use reverse proxy)
- Enable WAF (Web Application Firewall)

**SSL/HTTPS Setup:**
```bash
# Generate self-signed certificate (dev)
npm run dev:https

# Production certificates from Let's Encrypt
# Use certbot with nginx/apache
```

---

## Troubleshooting

### Common Issues & Solutions

**Issue: Application won't start**

Symptom: Error on `npm start`

Solutions:
```bash
# 1. Check Node.js version
node --version

# 2. Clear cache
npm run clean:all

# 3. Reinstall dependencies
npm install

# 4. Check .env file
cat .env  # Verify exists and correct

# 5. Generate Prisma client
npx prisma generate

# 6. Check database connection
npx prisma studio  # Should open without error
```

**Issue: Database connection error**

Symptom: `P1000: Authentication failed`

Solutions:
```bash
# 1. Check PostgreSQL is running
# Windows Services: PostgreSQL
# Linux: sudo systemctl status postgresql

# 2. Verify DATABASE_URL format
# postgresql://user:password@host:port/database

# 3. Test connection
psql -h localhost -U postgres -d postgres

# 4. Check user credentials
psql -h localhost -U [username] -d ledger

# 5. Verify database exists
psql -h localhost -U postgres -l | grep ledger

# 6. Check network connectivity
ping localhost  # or hostname
```

**Issue: Slow API response**

Symptom: Requests taking > 500ms

Solutions:
```bash
# 1. Check database load
# Monitor with: EXPLAIN ANALYZE [QUERY]

# 2. Check server resources
# Windows: Task Manager → Process tab → node
# RAM usage should be < 500MB normal

# 3. Check active connections
SELECT COUNT(*) FROM pg_stat_activity;

# 4. Kill long-running queries
SELECT pid, query FROM pg_stat_activity 
WHERE query_start < NOW() - INTERVAL '5 minutes';

# 5. Analyze slow queries
DATABASE_LOG=query npm start
# Review console for slow queries

# 6. Add missing indexes
# See database optimization section
```

**Issue: High memory usage**

Symptom: Node process growing to > 1GB

Solutions:
```bash
# 1. Check for memory leaks
# Use: node --inspect and Chrome DevTools

# 2. Increase Node memory limit
node --max-old-space-size=2048 your_script.js

# 3. Restart application
pm2 restart ledger

# 4. Check for runaway connections
# Restart database connection pool
```

**Issue: Users locked out / Cannot login**

Symptom: "Invalid email or password" even with correct credentials

Solutions:
```bash
# 1. Check user status
npx prisma studio
# Navigate to Users, check status = "Active"

# 2. Reset password (if admin can access)
npx prisma studio
# Edit user, update password (must be bcrypted)

# 3. Check cookies cleared
# User: Clear browser cookies and try again

# 4. Check JWT_SECRET not changed
# If changed, all existing tokens invalid
```

### Accessing Server Logs

**Development:**
```bash
# Logs print to console where npm run dev running
# Check for [ERROR], [WARN] messages
```

**Production (PM2):**
```bash
pm2 logs ledger              # Real-time logs
pm2 logs ledger --lines 100  # Last 100 lines
pm2 logs ledger --err        # Error logs only
```

**Database Logs (PostgreSQL):**
```bash
# Linux: /var/log/postgresql/
# Windows: PostgreSQL logs directory

# Enable query logging:
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

---

## Best Practices

### System Administration Best Practices

1. **Regular Backups**
   - Daily automated backups
   - Test restore monthly
   - Keep 30+ days retention
   - Off-site backups

2. **Documentation**
   - Document configuration changes
   - Maintain server inventory
   - Keep contact list updated
   - Document disaster recovery procedures

   3. **User Management**
   - Regular access reviews (quarterly)
   - Deactivate unused accounts
   - Enforce strong passwords
   - Clear inappropriate access

4. **Monitoring**
   - Check logs daily
   - Monitor disk space
   - Review performance metrics
   - Alert on anomalies

5. **Security**
   - Keep system updated
   - Rotate secrets annually
   - Enable HTTPS always (prod)
   - Implement WAF
   - Regular security audits

6. **Performance**
   - Monitor response times
   - Optimize slow queries
   - Archive old data
   - Tune database settings
   - Scale resources as needed

7. **Communication**
   - Inform users of maintenance windows
   - Document known issues
   - Provide support contact
   - Share status updates

### High Availability Setup (Future)

For production deployments:
- Database replication (PostgreSQL)
- Load balancing (nginx, HAProxy)
- Failover mechanism
- Health checks
- Auto-scaling (cloud)
- CDN for static assets

### Compliance & Audit

**Recommended Logging:**
- User access logs
- Data modification logs
- Administrative actions
- Error logs
- Performance metrics

**Retention Policy:**
- Access logs: 3 months
- Error logs: 1 year
- Audit logs: 2+ years
- Backups: 1+ year

---

## Emergency Contacts Template

Keep updated contact list:

```
SYSTEM ADMINS
- Name: _______________ Phone: _________ Email: _____________
- Name: _______________ Phone: _________ Email: _____________

DATABASE ADMINS
- Name: _______________ Phone: _________ Email: _____________

DEVELOPERS
- Name: _______________ Phone: _________ Email: _____________

HOSTING PROVIDER
- Name: _______________ Phone: __________ Support: __________

BACKUP CONTACT
- Name: _______________ Phone: _________ Email: _____________
```

---

## Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Node.js Documentation:** https://nodejs.org/docs
- **Windows Task Scheduler:** https://docs.microsoft.com/windows/win32/taskschd/task-scheduler-start-page
- **PM2 Documentation:** https://pm2.keymetrics.io/docs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial administrator guide |

