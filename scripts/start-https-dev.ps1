# Start HTTPS Local Development Server
# This script runs the Next.js dev server with HTTPS enabled locally

Write-Host "🔒 Starting Brickbook with Local HTTPS..." -ForegroundColor Green
Write-Host "Access the app at: https://localhost:3001" -ForegroundColor Cyan
Write-Host "Note: You'll see a security warning - this is normal for local self-signed certs" -ForegroundColor Yellow
Write-Host ""

# Run the Next.js dev server with experimental HTTPS support
npm run dev:https -- -H 0.0.0.0
