# Production Deployment Package Contents

**Build Date:** February 1, 2026  
**Status:** ✅ Ready for Production Deployment

---

## 📦 What to Deploy to Production

### ✅ INCLUDE These Files/Directories

```
brickbook-deployment-package/
├── .next/                          # ← REQUIRED: Production build output
│   ├── static/
│   ├── server/
│   └── public/
├── prisma/                         # ← REQUIRED: Database schema
│   ├── schema.prisma
│   └── migrations/
├── public/                         # ← REQUIRED: Static assets
│   ├── brickbook-logo.png
│   └── [other static files]
├── package.json                    # ← REQUIRED: Dependencies list
├── package-lock.json               # ← REQUIRED: Locked versions
└── .env.production                 # ← REQUIRED: Production variables
```

### ❌ DO NOT INCLUDE These Files/Directories

```
❌ node_modules/                    # Reinstall with npm install --production
❌ .env                             # Use .env.production instead
❌ .env.local                       # Development only
❌ .git/                            # Not needed in deployment
❌ .github/                         # CI/CD config, not needed in runtime
❌ .vscode/                         # IDE settings, not needed
❌ app/                             # Optional if .next is present
❌ lib/                             # Optional if .next is present
❌ scripts/                         # Dev scripts only
❌ temp/                            # Temporary files
❌ Documents/                       # Documentation, not needed
❌ web/                             # Old files, not needed
❌ mobile_app/                      # Separate project
❌ backups/                         # Backup files
❌ temp.zip                         # Temporary
```

---

## 🔐 Required Environment Variables (.env.production)

```env
# Database Connection - UPDATE WITH PRODUCTION VALUES
DATABASE_URL="postgresql://user:password@prod-db-host:5432/ledger_db"
DIRECT_URL="postgresql://user:password@prod-db-host:5432/ledger_db"
SHADOW_DATABASE_URL="postgresql://user:password@prod-db-host:5432/ledger_db_shadow"

# Security - MUST USE SECURE PRODUCTION VALUES
JWT_SECRET="your-very-secure-random-secret-key-min-32-chars"

# Node Environment
NODE_ENV="production"

# Application Port
PORT=3000
```

⚠️ **NEVER commit `.env.production` to git - keep it secure on the server only**

---

## 📋 Deployment Checklist

### Pre-Deployment (Dev Server)
- [x] All changes committed to git
- [x] Code reviewed and tested
- [x] Build completed successfully: `npm run build`
- [x] TypeScript compilation passed
- [x] All routes verified
- [x] Profile features tested
- [x] Password change tested
- [x] Role-based access tested
- [x] Transaction siteId verified

### Production Server Preparation
- [ ] Production PostgreSQL database running
- [ ] Database backup created: `pg_dump ... > backup.sql`
- [ ] Server storage has >2GB free space
- [ ] Node.js 16+ installed
- [ ] npm 8+ installed
- [ ] .env.production file created with correct values
- [ ] SSL/TLS certificates configured
- [ ] Reverse proxy (nginx/Apache) configured
- [ ] Firewall rules allow port 3000 (or configured port)

### Deployment Steps
- [ ] Create deployment directory: `/var/www/brickbook`
- [ ] Transfer build files (see section below)
- [ ] Run: `npm install --production`
- [ ] Run: `npx prisma generate`
- [ ] Verify Prisma client generated
- [ ] Start application: `npm start` or via PM2
- [ ] Verify on `http://localhost:3000/login`

### Post-Deployment
- [ ] Application responds to health check
- [ ] Login page loads
- [ ] Can login with valid credentials
- [ ] Profile menu visible (top-right)
- [ ] Password change form works
- [ ] Password validation active
- [ ] Role-based menu access correct
- [ ] Transactions display correctly
- [ ] API endpoints responding
- [ ] No errors in application logs

---

## 📤 File Transfer Commands

### Option 1: Using rsync (Recommended)

```bash
# From development server to production
rsync -avz --delete .next/ user@prod-server:/var/www/brickbook/.next/
rsync -av package.json user@prod-server:/var/www/brickbook/
rsync -av package-lock.json user@prod-server:/var/www/brickbook/
rsync -avz prisma/ user@prod-server:/var/www/brickbook/prisma/
rsync -avz public/ user@prod-server:/var/www/brickbook/public/
```

### Option 2: Using SCP

```bash
scp -r .next user@prod-server:/var/www/brickbook/
scp package*.json user@prod-server:/var/www/brickbook/
scp -r prisma user@prod-server:/var/www/brickbook/
scp -r public user@prod-server:/var/www/brickbook/
```

### Option 3: Using Git Deploy (if configured)

```bash
# On production server
cd /var/www/brickbook
git pull origin main
npm install --production
npx prisma generate
npm start
```

---

## 🚀 Server Installation Commands

### 1. Initial Setup on Production Server

```bash
# Create application directory
mkdir -p /var/www/brickbook
cd /var/www/brickbook

# Set permissions
sudo chown -R appuser:appuser /var/www/brickbook
chmod 755 /var/www/brickbook

# Create .env.production (do NOT commit to git)
nano .env.production
# Enter production database URL and JWT_SECRET
# Save and exit
```

### 2. Install Dependencies

```bash
cd /var/www/brickbook

# Install only production dependencies
npm install --production

# Output should show:
# up to date, audited X packages
```

### 3. Generate Prisma Client

```bash
npx prisma generate

# Output should show:
# ✔ Generated Prisma Client
```

### 4. Start Application

#### Option A: Direct Start (Testing)
```bash
npm start

# Output should show:
# ▲ Next.js 16.1.1
# - Local: http://localhost:3000
```

#### Option B: PM2 (Production Recommended)
```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start application with PM2
pm2 start npm --name "brickbook" -- start

# View logs
pm2 logs brickbook

# Monitor
pm2 monit

# Restart on server reboot
pm2 startup
pm2 save
```

#### Option C: Systemd Service (Alternative)
```bash
# Create /etc/systemd/system/brickbook.service
[Unit]
Description=Brickbook Ledger Application
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/var/www/brickbook
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable brickbook
sudo systemctl start brickbook
sudo systemctl status brickbook
```

---

## 🔍 Verification Commands

### Test Application Startup
```bash
# Check if server is running
curl http://localhost:3000/login

# Expected: HTML response with login page
```

### Test API Endpoints
```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","password":"admin"}'

# Should return JWT token
```

### Check Database Connection
```bash
# In app logs, should see:
# ✅ Database connected
# OR
# prisma:query SELECT 1
```

### View Application Logs
```bash
# With PM2
pm2 logs brickbook

# With systemd
journalctl -u brickbook -f

# Docker logs (if containerized)
docker logs brickbook
```

---

## 🚨 Database Protection Measures

### Before Production Go-Live

```bash
# 1. Backup production database
pg_dump -U postgres -h localhost -d ledger_db > \
  /var/backups/ledger_db_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup
file /var/backups/ledger_db_*.sql

# 3. Test backup restore (on test server)
createdb ledger_db_test
psql -U postgres -d ledger_db_test < backup.sql
psql -U postgres -d ledger_db_test -c "SELECT COUNT(*) FROM users;"
```

### Daily Backup Schedule

```bash
# Create backup script: /var/backups/backup-ledger.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/var/backups/ledger_db_$DATE.sql"
pg_dump -U postgres -d ledger_db > "$BACKUP_FILE"
gzip "$BACKUP_FILE"
# Keep only last 30 days
find /var/backups -name "ledger_db_*.sql.gz" -mtime +30 -delete

# Add to crontab
crontab -e
# Add line: 0 2 * * * /var/backups/backup-ledger.sh
```

---

## 🔒 Security Checks

Before going live, verify:

### SSL/TLS Configuration
```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443

# Should show valid certificate chain
```

### Reverse Proxy Configuration (nginx example)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variable Security
```bash
# Verify .env.production is NOT readable by world
ls -l .env.production
# Should show: -rw------- (600)

# If wrong, fix permissions
chmod 600 .env.production
```

---

## 📊 Size Information

### Deployment Package Breakdown

| Component | Size | Notes |
|-----------|------|-------|
| .next/ | ~3-4MB | Compiled application |
| node_modules/ (after npm install) | ~300-400MB | Dependencies (not deployed) |
| prisma/ | ~2MB | Database schema |
| public/ | ~5MB | Static assets |
| **Total to Deploy** | **~10MB** | Code + schema + assets |
| **Total on Server** | **~350-400MB** | Including node_modules |

---

## ⚙️ Configuration Examples

### Production nginx Configuration
See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed examples

### Production PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'brickbook',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

// Run with: pm2 start ecosystem.config.js
```

---

## ⚡ Performance Optimization Tips

1. **Use CDN for static assets** (logo, images)
   - Configure nginx to serve `public/` via CDN
   - Reduces server load

2. **Enable gzip compression**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/javascript;
   ```

3. **Database connection pooling**
   - Consider pgBouncer for connection pool management
   - Recommended: 10-20 connections per server

4. **Monitor memory usage**
   ```bash
   free -h              # Check available memory
   pm2 monit            # Monitor Node.js process
   ```

---

## 🆘 Emergency Procedures

### If Application Crashes

```bash
# 1. Check status
pm2 status
systemctl status brickbook

# 2. View logs
pm2 logs brickbook | head -50

# 3. Restart
pm2 restart brickbook

# 4. Check if database is accessible
psql -U postgres -d ledger_db -c "SELECT 1;"

# 5. If database issue, restore from backup
# Restore from latest backup and restart
```

### If Database Crashes

```bash
# 1. Stop application
pm2 stop brickbook

# 2. Check PostgreSQL
systemctl status postgresql

# 3. Restore from backup
createdb ledger_db_restored
psql -U postgres -d ledger_db_restored < /path/to/backup.sql

# 4. Verify restore
psql -U postgres -d ledger_db_restored -c "SELECT COUNT(*) FROM users;"

# 5. Update DATABASE_URL to point to restored database
# 6. Restart application
pm2 start brickbook
```

---

## ✅ Final Deployment Sign-Off

Before marking deployment complete:

```bash
# Checklist
✓ Application starts without errors
✓ Can access login page
✓ Can login with valid credentials
✓ Profile page loads
✓ Password change works
✓ Role-based access correct
✓ All API endpoints responding
✓ Database backups created
✓ Monitoring/alerts configured
✓ Error logs being captured
✓ Performance metrics normal

# Approval
Date: ___________
Deployed By: ___________
Verified By: ___________
Status: PRODUCTION GO-LIVE ✅
```

---

**Deployment Package Ready:** February 1, 2026  
**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT  
**Support Doc:** PRODUCTION_DEPLOYMENT_GUIDE.md
