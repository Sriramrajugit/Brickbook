# Production Deployment Guide - Ledger Application
**Last Updated:** April 18, 2026  
**Version:** 1.0  
**Status:** Ready for Deployment

---

## OVERVIEW

This guide covers deploying the Ledger application to production while maintaining all security features and the 15-minute auto-logout functionality.

---

## PRE-DEPLOYMENT CHECKLIST

### Security Verification ✅
- [x] Authentication bypass fixed (AuthProvider blocks rendering)
- [x] API endpoints require authentication (401 without token)
- [x] Session timeout configured (15 minutes idle)
- [x] Multi-tenancy enforced (companyId filtering)
- [x] Sensitive data not exposed (no salary in APIs)
- [x] Security headers configured
- [x] Error messages don't expose technical details

### Code Review ✅
- [x] All critical fixes applied
- [x] No console.log of sensitive data in production
- [x] Environment variables properly configured
- [x] Database migrations tested
- [x] Error handling functional
- [x] Performance acceptable

### Testing ✅
- [x] Automated API tests pass
- [x] Manual QA testing completed
- [x] Authentication flow verified
- [x] Session timeout tested
- [x] Multi-user scenarios tested
- [x] Error scenarios handled

### Stakeholder Approvals ✅
- [ ] Security team sign-off
- [ ] Product team sign-off
- [ ] Operations team readiness
- [ ] Compliance check (if applicable)

---

## DEPLOYMENT OPTIONS

### Option 1: Traditional Server Deployment (Recommended for Learning)
- Self-managed Node.js server
- PostgreSQL database
- Nginx reverse proxy
- SSL certificate

**Time to Deploy:** 30-60 minutes

### Option 2: Cloud Platform (Recommended for Production)
- **Vercel** (if staying with Next.js)
- **Railway** (Node.js + PostgreSQL)
- **Heroku** (Node.js + Postgres add-on)
- **AWS EC2** (self-managed)
- **DigitalOcean** (App Platform or Droplet)

**Time to Deploy:** 15-30 minutes

### Option 3: Docker Container
- Containerized application
- Container registry (Docker Hub, GitHub Container Registry)
- Orchestration (Docker Compose, Kubernetes)

**Time to Deploy:** 20-40 minutes

---

## DEPLOYMENT WALKTHROUGH

### STEP 1: Prepare Production Environment Variables

Create `.env.production` file (DO NOT COMMIT TO GIT):

```bash
# Database Configuration
DATABASE_URL=postgresql://ledger_user:STRONG_PASSWORD@prod-db.example.com:5432/ledger_db

# JWT Configuration
JWT_SECRET=<generate-random-string-min-32-chars>
# Generate: openssl rand -base64 32

# Session Configuration
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=15

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
ENABLE_ERROR_TRACKING=true
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional: Email for notifications
SUPPORT_EMAIL=support@example.com
```

**CRITICAL SECURITY NOTES:**
- ⚠️ Never commit `.env.production` to Git
- ⚠️ Store in secure vault or deployment platform's secret manager
- ⚠️ Rotate `JWT_SECRET` periodically
- ⚠️ Use strong database password (min 20 chars, random)
- ⚠️ Use HTTPS only in production

---

### STEP 2: Prepare Database for Production

#### 2a. Create Production Database

```sql
-- On production PostgreSQL server

-- Create user with restricted permissions
CREATE USER ledger_user WITH PASSWORD 'STRONG_PASSWORD_HERE';

-- Create database
CREATE DATABASE ledger_db OWNER ledger_user;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE ledger_db TO ledger_user;
GRANT USAGE ON SCHEMA public TO ledger_user;
GRANT CREATE ON SCHEMA public TO ledger_user;

-- Connect as ledger_user
\c ledger_db ledger_user;

-- Initialize with Prisma
-- See STEP 3 below
```

#### 2b. Migrate the Database Schema

```bash
# On local machine or deployment pipeline:
npx prisma migrate deploy

# OR if using push (less recommended for production):
npx prisma db push
```

This creates all tables required by the application:
- users
- companies
- accounts
- categories
- transactions
- employees
- attendance
- payroll
- advances

#### 2c. Create Initial Data

```bash
# Seed database with initial admin user and data
npx prisma db seed

# If no seed script exists, manually create:
# - Create default company
# - Create admin user (email: admin, password: admin)
# - Create default categories
# - Create sample accounts
```

---

### STEP 3: Build Application for Production

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Build Next.js application
npm run build

# Verify build succeeded
ls -la .next/

# Expected output: .next directory with standalone, static, etc.
```

**Build Output:**
- `.next/standalone/` - Optimized production application
- `.next/static/` - CSS, JavaScript bundles
- `public/` - Static files (images, icons, etc.)

---

### STEP 4: Configure Web Server & SSL

#### Option A: Nginx + Node.js + SSL

```nginx
# /etc/nginx/sites-available/ledger

upstream ledger_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://ledger_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /_next/static {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint (optional)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### Option B: Apache + Node.js + SSL

```apache
# /etc/apache2/sites-available/ledger.conf

<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    
    SSLEngine On
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    
    # Proxy to Node.js
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # Enable compression
    SetOutputFilter DEFLATE
</VirtualHost>
```

#### Obtain SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx    # Nginx
sudo apt-get install certbot python3-certbot-apache    # Apache

# Obtain certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot certonly --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (typically automatic, verify with):
sudo certbot renew --dry-run
```

---

### STEP 5: Start Application in Production

#### Option A: Using PM2 (Node.js Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name ledger -- run start

# Save PM2 configuration for restart
pm2 save

# Enable startup on system reboot
pm2 startup
pm2 save

# Monitor application
pm2 monit

# View logs
pm2 logs ledger
```

#### Option B: Using systemd Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/ledger.service
```

```ini
[Unit]
Description=Ledger Application
After=network.target
Wants=postgresql.service

[Service]
Type=simple
User=ledger
WorkingDirectory=/opt/ledger
EnvironmentFile=/opt/ledger/.env.production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ledger.service
sudo systemctl start ledger.service

# View status
sudo systemctl status ledger.service

# View logs
sudo journalctl -u ledger.service -f
```

#### Option C: Using Docker

```bash
# Build Docker image
docker build -t ledger:latest .

# Run container
docker run -d \
  --name ledger \
  --restart always \
  -p 3000:3000 \
  --env-file .env.production \
  ledger:latest

# View logs
docker logs -f ledger

# Stop/start
docker stop ledger
docker start ledger
```

---

### STEP 6: Configure Monitoring & Alerts

#### Health Check Endpoint

The application includes a simple health check at `/health`:

```bash
# Test health endpoint
curl https://yourdomain.com/health
# Expected response: HTTP 200

# Monitor with uptime service
# Add to cron job or monitoring service
```

#### Error Tracking (Sentry)

```javascript
// Already configured in app/layout.tsx via SENTRY_DSN
// Errors automatically captured and reported
```

#### Log Aggregation

```bash
# Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)
# Option 2: Datadog, New Relic, or CloudWatch
# Option 3: Simple file-based logging with log rotation

# Configure log rotation
sudo apt-get install logrotate

# Create logrotate config
sudo nano /etc/logrotate.d/ledger
```

```
/var/log/ledger/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 ledger ledger
    sharedscripts
    postrotate
        systemctl reload ledger > /dev/null 2>&1 || true
    endscript
}
```

#### Performance Monitoring

```bash
# Monitor with tools like:
# - New Relic APM
# - Datadog
# - Prometheus + Grafana
# - PM2 Plus (paid)

# Basic system monitoring
top -u ledger      # CPU and memory usage
netstat -an | grep 3000  # Check port listening
```

---

### STEP 7: Backup & Recovery Strategy

#### Daily Database Backups

```bash
# Create backup script
nano /opt/ledger/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/backups/ledger"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="ledger_db"
DB_USER="ledger_user"
BACKUP_FILE="$BACKUP_DIR/ledger_db_$DATE.sql"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "ledger_db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

```bash
# Make executable
chmod +x /opt/ledger/backup.sh

# Add to cron (daily at 2 AM)
crontab -e
0 2 * * * /opt/ledger/backup.sh >> /var/log/ledger_backup.log 2>&1

# Verify cron
crontab -l
```

#### Restore from Backup

```bash
# List available backups
ls -lh /backups/ledger/

# Restore specific backup
gunzip -c /backups/ledger/ledger_db_20260418_020000.sql.gz | psql -U ledger_user -d ledger_db

# Verify restore
psql -U ledger_user -d ledger_db -c "SELECT COUNT(*) FROM transactions;"
```

---

### STEP 8: Session Timeout Configuration

The 15-minute auto-logout is **already configured** and will work in production.

#### How Session Timeout Works

```
Request received
    ↓
User idle for 15 minutes (no mouse movement, key press, scroll, touch)
    ↓
Frontend countdown shows "X minutes remaining"
    ↓
When timer reaches 0:
    ↓
Automatic logout (POST /api/logout)
    ↓
Redirect to /login with message "Session expired"
```

#### Configuration in Production

```bash
# Environment variable (already in .env.production)
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=15

# This is configurable - change to different values:
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30   # 30 minutes
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=60   # 1 hour
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=5    # 5 minutes
```

#### Session Activity Detection

Supported user activities that reset the 15-minute timer:
- ✅ Mouse movement (mousedown, click)
- ✅ Keyboard input (keydown)
- ✅ Page scroll
- ✅ Touch events (touchstart)

User stays logged in as long as they're actively using the application.

---

### STEP 9: Post-Deployment Verification

#### 1. Test Authentication Flow
```bash
# Login works
curl -X POST https://yourdomain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}'
# Should return: User data with token

# API requires auth
curl https://yourdomain.com/api/accounts/full
# Should return: 401 Unauthorized

# API works with auth
curl -H "Cookie: auth-token=YOUR_TOKEN" \
  https://yourdomain.com/api/accounts/full
# Should return: Account data
```

#### 2. Test Session Timeout
```
1. Login to application
2. Watch profile menu for countdown timer
3. Don't move mouse or touch keyboard for 15 minutes
4. After 15 minutes, should auto-logout
5. Redirected to login page with "Session expired" message
```

#### 3. Test Multi-User Isolation
```
1. Create two test users (different companies)
2. Login as User A - verify they see Company A data
3. Logout, login as User B - verify they see Company B data
4. User A should NOT see User B's data
```

#### 4. Performance Check
```bash
# Check page load times (should be < 2 seconds)
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/

# Monitor CPU and memory
top -u ledger
# Should see: Node.js process using < 5% CPU at idle

# Check database connections
psql -U ledger_user -d ledger_db -c "SELECT datname, usename, COUNT(*) FROM pg_stat_activity GROUP BY datname, usename;"
```

#### 5. Security Verification
```bash
# Check SSL certificate
curl -vI https://yourdomain.com/ 2>&1 | grep "SSL"
# Should show: TLSv1.2 or TLSv1.3

# Check security headers
curl -I https://yourdomain.com/ | grep -i "strict\|frame\|content\|xss"
# Should see all security headers present

# Test API without auth (should fail)
curl https://yourdomain.com/api/accounts/full 2>&1
# Should return: 401 Unauthorized
```

---

## DEPLOYMENT TROUBLESHOOTING

### Issue: "Cannot find module"
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Issue: "Database connection refused"
```bash
# Solution: Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials
psql -U ledger_user -d ledger_db -h localhost
# Should connect successfully

# Check connection string
echo $DATABASE_URL
# Should be: postgresql://ledger_user:PASSWORD@host:5432/ledger_db
```

### Issue: "Port 3000 already in use"
```bash
# Find process using port
lsof -i :3000
# Or
netstat -tlnp | grep 3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start
```

### Issue: "Session timeout not working"
```bash
# Verify environment variable is set
echo $NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES
# Should output: 15

# Check browser console for errors
# Open DevTools → Console → Check for JavaScript errors

# Verify AuthProvider is loaded
# Open DevTools → Application → Cookies
# Should see: auth-token cookie present when logged in
```

### Issue: "Cannot access from other machines"
```bash
# Make sure application listens on 0.0.0.0
PORT=3000 HOST=0.0.0.0 npm run start

# Check firewall allows port 3000 (or 443 for HTTPS)
sudo ufw allow 3000
sudo ufw allow 443
sudo ufw allow 80
```

---

## ROLLBACK PROCEDURE

### If Something Goes Wrong

```bash
# 1. Stop current application
sudo systemctl stop ledger
# OR
pm2 stop ledger
# OR
docker stop ledger

# 2. Restore database from backup (if data corrupted)
gunzip -c /backups/ledger/ledger_db_PREVIOUS_DATE.sql.gz | \
  psql -U ledger_user -d ledger_db

# 3. Revert to previous application version
git checkout v1.0  # or previous tag
npm install --legacy-peer-deps
npm run build

# 4. Start application
sudo systemctl start ledger
# OR
pm2 start ledger
# OR
docker start ledger

# 5. Verify
curl https://yourdomain.com/health
# Should return: HTTP 200
```

---

## PRODUCTION CHECKLIST - FINAL

- [ ] `.env.production` created with strong JWT_SECRET
- [ ] Database created and migrated
- [ ] SSL certificate installed
- [ ] Web server configured (Nginx/Apache)
- [ ] Application started and running
- [ ] Health check endpoint responding
- [ ] Authentication flow tested
- [ ] Session timeout tested (15 min)
- [ ] API endpoints require auth (401 without token)
- [ ] Multi-user isolation verified
- [ ] Performance acceptable
- [ ] Backup strategy configured
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Logs being collected
- [ ] Firewall configured correctly
- [ ] Can access from network
- [ ] Auto-logout works after 15 min idle
- [ ] Dashboard shows correct data
- [ ] Transactions can be added
- [ ] Partner field works for Salary transactions
- [ ] All manual tests pass

---

## MONITORING IN PRODUCTION

### Daily Checks
```bash
# Application running?
curl -I https://yourdomain.com/health

# Any errors in logs?
tail -f /var/log/ledger/app.log

# Database accessible?
psql -U ledger_user -d ledger_db -c "SELECT NOW();"

# Disk space available?
df -h /
```

### Weekly Checks
```bash
# Backup working?
ls -lh /backups/ledger/ | head -5

# Performance acceptable?
# Check response times in monitoring dashboard

# Any unresolved errors?
# Check error tracking service (Sentry, etc.)
```

### Monthly Reviews
```bash
# Review application logs for patterns
# Check backup retention policy
# Review security logs for suspicious activity
# Update dependencies (npm audit)
# Rotate JWT_SECRET (optional but recommended)
```

---

## SUPPORT & MAINTENANCE

**After deployment, you'll want to:**

1. **Monitor Performance** - Use tools like:
   - New Relic APM
   - Datadog
   - Prometheus + Grafana
   - Built-in Node.js monitoring

2. **Track Errors** - Use:
   - Sentry
   - Rollbar
   - ErrorTracking service

3. **Backup Management** - Ensure:
   - Daily backups running
   - Backup verification scheduled
   - Recovery tested monthly

4. **Security Updates** - Keep updated:
   - Node.js patches
   - Dependencies (npm audit)
   - OS security patches
   - SSL certificate renewal

---

## QUICK DEPLOYMENT SUMMARY

```
1. Prepare .env.production with strong JWT_SECRET
2. Create PostgreSQL database and run migrations
3. npm install --legacy-peer-deps && npm run build
4. Install SSL certificate (Let's Encrypt)
5. Configure Nginx/Apache to proxy to Node.js:3000
6. Start with PM2 or systemd service
7. Test health endpoint and verify auth required
8. Confirm 15-minute session timeout works
9. Set up monitoring and backups
10. Done! ✅
```

**Estimated deployment time:** 1-2 hours (first time)

---

**Next Steps:** Execute the steps above, monitor for any issues, and keep documentation updated as your deployment evolves.

Good luck with your production deployment! 🚀
