# Local HTTPS Setup Guide

## Overview
Your Ledger app is now configured to run with HTTPS locally for testing before production deployment.

## What Was Done ✅

1. **Updated Login Route** (`app/api/login/route.ts`)
   - Cookie now uses `secure: true` when HTTPS is detected
   - Auto-detects HTTPS via `NEXTAUTH_URL` environment variable

2. **Updated Environment Variables** (`.env`)
   - Added `NEXTAUTH_URL="https://localhost:3001"`
   - This tells the app to expect HTTPS connections

3. **Installed local-ssl-proxy**
   - Package installed to handle HTTPS locally
   - Available as dev dependency

## How to Run Local HTTPS

### Option 1: Using Next.js Experimental HTTPS (Recommended)
```powershell
npm run dev:https
```
- Simplest approach
- Next.js 16+ has built-in HTTPS support
- Access: https://localhost:3001

### Option 2: Using PowerShell Script
```powershell
.\scripts\start-https-dev.ps1
```
- Same as above but with helpful messages

### Option 3: Traditional HTTP (still works)
```powershell
npm run dev
```
- Runs on http://localhost:3000 (no HTTPS)
- No certificate needed

## Testing HTTPS Locally

### Step 1: Start the HTTPS Dev Server
```powershell
npm run dev:https
```

### Step 2: Accept Browser Certificate Warning
When you visit `https://localhost:3001`:
- **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- This is normal for local self-signed certificates

### Step 3: Test Login
- The cookies are now marked as `Secure`
- They will only be sent over HTTPS connections
- Login should work normally

### Step 4: Check Browser Console
Open DevTools (F12) → Console/Network tabs to verify:
- No mixed content warnings ✅
- Cookies marked as Secure ✅
- All requests are HTTPS ✅

## Environment Variable Handling

### Development (Local)
- `NEXTAUTH_URL=https://localhost:3001` - Uses HTTPS
- `NODE_ENV=development`

### Production (Railway)
- `NEXTAUTH_URL=https://yourdomain.com` - Your production domain
- `NODE_ENV=production`
- Railway automatically provides SSL certificate

## Cookie Security Logic

The secure flag in login route now works like this:

```typescript
secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https')
```

- **Local Dev (HTTPS)**: `true` → Secure cookies
- **Local Dev (HTTP)**: `false` → Non-secure cookies
- **Production**: `true` → Secure cookies (always)

## Troubleshooting

### Issue: "Cannot find module 'local-ssl-proxy'"
**Solution**: Run `npm install --save-dev local-ssl-proxy` again

### Issue: Certificate Error in Browser
**Solution**: This is expected. Accept the self-signed certificate warning.

### Issue: Cookies Not Saving in HTTPS
**Solution**: Make sure `.env` has `NEXTAUTH_URL="https://localhost:3001"`

### Issue: HTTPS Port Already in Use
**Solution**: Kill the process or change port in `npm run dev:https`

## Next Steps

1. ✅ Test locally with HTTPS
2. ✅ Verify login/logout works
3. ✅ Check all features work over HTTPS
4. ✅ Commit these changes to git
5. ✅ Deploy to Railway (auto-gets Let's Encrypt SSL)

## Important Notes

- Self-signed certificates are **ONLY for local development**
- Production will use **Let's Encrypt certificates** (free, via Railway)
- Users won't see certificate warnings in production
- All security is working the same way locally and in production

## Files Modified

- `app/api/login/route.ts` - Updated secure cookie flag
- `.env` - Added NEXTAUTH_URL for HTTPS
- `package.json` - Already has dev:https script (no changes needed)
- `scripts/start-https-dev.ps1` - Created convenience script

---

Happy testing! 🚀
