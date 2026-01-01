# Deployment Guide - BigRock Hosting

## Prerequisites

Your BigRock hosting must have:
- ✅ VPS or Dedicated Server (Shared hosting won't work for Next.js + PostgreSQL)
- ✅ SSH access
- ✅ Root or sudo privileges
- ✅ Domain name configured

## Deployment Steps

### Step 1: Server Setup

**Connect to your server via SSH:**
```bash
ssh username@your-domain.com
# or
ssh username@your-server-ip
```

**Update system packages:**
```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE ledger_db;
CREATE USER ledger_user WITH ENCRYPTED PASSWORD 'your-secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE ledger_db TO ledger_user;
\q
```

### Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 5: Upload Your Application

**Option A: Using Git (Recommended)**
```bash
# Install git if not already installed
sudo apt install git -y

# Clone your repository (if you have it on GitHub)
cd /var/www
sudo git clone https://github.com/yourusername/ledger.git
cd ledger/web

# Or create directory and upload files
sudo mkdir -p /var/www/ledger
cd /var/www/ledger
```

**Option B: Using FTP/SCP**
```bash
# From your local machine, upload the web folder:
scp -r "c:\My Data\Workspace\Ledger\web" username@your-server:/var/www/ledger/
```

### Step 6: Configure Environment Variables

```bash
cd /var/www/ledger/web

# Create production .env file
sudo nano .env
```

**Add the following (replace with your actual values):**
```env
DATABASE_URL="postgresql://ledger_user:your-secure-password-here@localhost:5432/ledger_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random"
NODE_ENV="production"
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 7: Install Dependencies and Build

```bash
cd /var/www/ledger/web

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (sites, users, categories)
npx prisma db seed

# Build the application
npm run build
```

### Step 8: Start Application with PM2

```bash
cd /var/www/ledger/web

# Start the app with PM2
pm2 start npm --name "ledger-app" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup

# Check if app is running
pm2 status
pm2 logs ledger-app
```

### Step 9: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ledger
```

**Add this configuration (replace your-domain.com):**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ledger /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 10: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (choose 2 for redirect)

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 11: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

### Step 12: Domain Configuration in BigRock

1. **Login to BigRock control panel**
2. **Go to Domain Management**
3. **Update DNS Settings:**
   - **A Record**: Point to your server IP address
     - Host: `@` (root domain)
     - Points to: `Your-Server-IP`
     - TTL: 14400
   
   - **CNAME Record** (for www):
     - Host: `www`
     - Points to: `your-domain.com`
     - TTL: 14400

4. **Wait for DNS propagation** (can take 1-48 hours)

### Step 13: Verify Deployment

```bash
# Check if app is running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check logs if there are issues
pm2 logs ledger-app
sudo tail -f /var/log/nginx/error.log
```

**Test your website:**
- Visit: `https://your-domain.com`
- You should see the login page

## Common PM2 Commands

```bash
# View app status
pm2 status

# View logs
pm2 logs ledger-app

# Restart app
pm2 restart ledger-app

# Stop app
pm2 stop ledger-app

# Start app
pm2 start ledger-app

# View detailed info
pm2 info ledger-app
```

## Updating the Application

```bash
# Stop the app
pm2 stop ledger-app

# Pull latest changes (if using git)
cd /var/www/ledger/web
sudo git pull

# Or upload new files via SCP/FTP

# Install new dependencies
npm install

# Run new migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart ledger-app
```

## Database Backup

```bash
# Create backup script
sudo nano /home/backup-ledger.sh
```

**Add:**
```bash
#!/bin/bash
BACKUP_DIR="/home/backups/ledger"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='your-secure-password-here' pg_dump -U ledger_user -h localhost ledger_db > $BACKUP_DIR/ledger_db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Make executable and schedule:**
```bash
sudo chmod +x /home/backup-ledger.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/backup-ledger.sh
```

## Security Checklist

- [ ] PostgreSQL only listens on localhost
- [ ] Strong database password set
- [ ] JWT_SECRET is random and secure
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] Regular backups scheduled
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`

## Troubleshooting

### App won't start
```bash
pm2 logs ledger-app
# Check for errors in the logs
```

### Database connection error
```bash
# Test PostgreSQL connection
psql -U ledger_user -d ledger_db -h localhost
# If it fails, check DATABASE_URL in .env
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Can't access via domain
```bash
# Check DNS propagation
nslookup your-domain.com

# Check Nginx is running
sudo systemctl status nginx
```

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs ledger-app`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify database connection: `npx prisma db pull`
4. Restart services: `pm2 restart ledger-app && sudo systemctl restart nginx`
