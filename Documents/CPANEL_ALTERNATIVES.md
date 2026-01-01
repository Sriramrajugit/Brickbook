# Deployment Options for cPanel Hosting

## Problem
Your BigRock cPanel shared hosting **cannot run** this Next.js + PostgreSQL application because:
- ❌ No Node.js support
- ❌ No PostgreSQL (only MySQL)
- ❌ Can't run persistent Node.js processes
- ❌ No SSH access to install dependencies

## Solution Options

### Option 1: Upgrade to VPS at BigRock (Recommended if staying with BigRock)

**Cost:** Starting from ₹500-1000/month

**Steps:**
1. Login to BigRock account
2. Go to VPS/Cloud Hosting section
3. Purchase Linux VPS (minimum 1GB RAM, 20GB disk)
4. Get SSH access credentials
5. Follow the full deployment guide in DEPLOYMENT_GUIDE.md

**Pros:**
- Full control over server
- Can host multiple applications
- Professional setup with your own domain
- Better security and performance

**Cons:**
- Monthly cost
- Need to manage server yourself

---

### Option 2: Deploy on Vercel + Railway (FREE/Cheap)

**Cost:** FREE (Vercel) + $5/month (Railway for PostgreSQL)

This is the **easiest and cheapest** option!

#### Step 1: Deploy Database on Railway

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Provision PostgreSQL**
4. **Copy connection string** from Railway dashboard

#### Step 2: Deploy App on Vercel

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub
3. **Import your project:**
   - If code is on GitHub: Import from repository
   - If not: Upload the `web` folder

4. **Configure Environment Variables:**
   ```
   DATABASE_URL=postgresql://user:pass@railway-host:port/db?schema=public
   JWT_SECRET=your-super-secret-key-here
   NODE_ENV=production
   ```

5. **Deploy!**

6. **Run migrations:**
   ```bash
   # On Vercel, go to project settings
   # Add build command:
   npx prisma migrate deploy && npx prisma db seed && npm run build
   ```

7. **Add custom domain** in Vercel:
   - Go to Vercel project → Settings → Domains
   - Add your BigRock domain
   - Update DNS in BigRock (Vercel will show you what to add)

**Pros:**
- Very easy to deploy
- Automatic SSL (HTTPS)
- Free hosting for app
- Automatic scaling
- GitHub integration (auto-deploy on push)

**Cons:**
- Database costs $5/month on Railway
- Less control than VPS

---

### Option 3: Deploy on Render (All-in-One)

**Cost:** $7/month for database, FREE for web service (with limitations)

1. **Go to:** https://render.com
2. **Sign up** with GitHub
3. **Create PostgreSQL database** ($7/month)
4. **Create Web Service:**
   - Connect GitHub repository (or upload code)
   - Build command: `cd web && npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start command: `cd web && npm start`
   - Add environment variables

5. **Add custom domain** in Render settings

**Pros:**
- Everything in one place
- Easy to manage
- Good free tier

**Cons:**
- Free tier has cold starts (slow first load)
- Need paid plan for better performance

---

### Option 4: Convert to Static Site + MySQL (Works on cPanel)

**If you want to keep cPanel**, you'd need to:
1. Convert PostgreSQL to MySQL (rewrite schema)
2. Convert Next.js to static export (lose server-side features)
3. Use PHP backend for APIs (major rewrite)

**NOT RECOMMENDED** - Too much work, loses features

---

## Recommended Approach: Vercel + Railway

### Quick Setup Guide

#### A. Prepare Your Code

1. **Create GitHub account** if you don't have one
2. **Install Git** on your computer
3. **Initialize Git repository:**

```powershell
cd "c:\My Data\Workspace\Ledger\web"

# Initialize git
git init

# Create .gitignore (important!)
@"
node_modules
.next
.env
.env.local
*.log
.DS_Store
"@ | Out-File -FilePath .gitignore -Encoding UTF8

# Add files
git add .
git commit -m "Initial commit"
```

4. **Push to GitHub:**
   - Create new repository on GitHub.com
   - Follow instructions to push code

#### B. Setup Railway Database

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Provision PostgreSQL"
5. Click on PostgreSQL service
6. Go to "Connect" tab
7. Copy the connection string (looks like: `postgresql://user:pass@host:port/db`)

#### C. Deploy to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Set root directory to `web`
6. Add environment variables:
   - `DATABASE_URL`: Paste Railway connection string
   - `JWT_SECRET`: Use a long random string
   - `NODE_ENV`: `production`

7. Click "Deploy"

8. Wait for deployment (2-3 minutes)

9. Your app is live at: `your-project.vercel.app`

#### D. Connect Your Domain

**In Vercel:**
1. Go to Project Settings → Domains
2. Add your domain: `your-domain.com`
3. Vercel will show DNS records to add

**In BigRock cPanel:**
1. Login to BigRock
2. Go to Domain Management
3. Click DNS Management
4. Add records as shown by Vercel:
   - Type: `A` or `CNAME`
   - Host: `@` or `www`
   - Value: (as provided by Vercel)

5. Wait 1-24 hours for DNS propagation

#### E. Run Database Migrations

After first deployment:
1. Go to Vercel project
2. Open terminal (if available) or add to build command:
   ```
   npx prisma migrate deploy && npx prisma db seed && npm run build
   ```

---

## Cost Comparison

| Option | Monthly Cost | Difficulty | Best For |
|--------|-------------|-----------|----------|
| BigRock VPS | ₹500-1000 | Medium | Professional use, multiple apps |
| Vercel + Railway | $5 (₹400) | Easy | Getting started, low traffic |
| Render | $7-25 (₹600-2000) | Easy | All-in-one solution |
| cPanel Conversion | ₹0 but huge work | Very Hard | **NOT RECOMMENDED** |

---

## My Recommendation

**Use Vercel + Railway:**
- Total cost: $5/month (₹400)
- Setup time: 30 minutes
- Automatic SSL, scaling, backups
- Your domain from BigRock will work
- Professional grade hosting
- No server management needed

Would you like me to help you set this up?
