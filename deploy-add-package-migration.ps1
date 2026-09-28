# Production Database Migration: Add package column to company table
# This script adds the missing 'package' column to production database

Write-Host "🔄 Starting migration: Add package column to companies table..." -ForegroundColor Cyan
Write-Host "⚠️  Make sure you have a backup of your production database first!" -ForegroundColor Yellow
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL before running this script" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Running migration..." -ForegroundColor Cyan
Write-Host ""

npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "✅ package column added to companies table" -ForegroundColor Green
    Write-Host "✅ All customers now default to FOUNDATION package" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run build"
    Write-Host "2. Deploy the new code to production"
    Write-Host "3. Users can now access Bills & Invoices based on their package level"
} else {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Check the error above and try again" -ForegroundColor Red
    exit 1
}
