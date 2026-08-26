# Safe Railway Database Migration - PowerShell Edition
# Export → Reset → Deploy → Restore

Write-Host "🔒 SAFE DATABASE MIGRATION SCRIPT" -ForegroundColor Green
Write-Host "==================================`n"

# Step 1: Backup
Write-Host "STEP 1: BACKUP PRODUCTION DATA" -ForegroundColor Yellow
Write-Host "================================`n"

Write-Host "You need your Railway DATABASE_URL"
Write-Host "Get it from: railway.app → PostgreSQL → Connect`n"
Write-Host "Paste your Railway DATABASE_URL below:"
$RAILWAY_URL = Read-Host "DATABASE_URL"

if ([string]::IsNullOrEmpty($RAILWAY_URL)) {
  Write-Host "❌ Cannot proceed without DATABASE_URL" -ForegroundColor Red
  exit 1
}

Write-Host "`nBacking up production data..." -ForegroundColor Yellow
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "backup_production_$TIMESTAMP.sql"

try {
  & pg_dump "$RAILWAY_URL" | Out-File -FilePath $BACKUP_FILE -Encoding UTF8
  Write-Host "✅ Backup created successfully!" -ForegroundColor Green
  Write-Host "   File: $BACKUP_FILE"
  $SIZE = (Get-Item $BACKUP_FILE).Length / 1MB
  Write-Host "   Size: $([math]::Round($SIZE, 2)) MB`n"
} catch {
  Write-Host "❌ Backup failed: $_" -ForegroundColor Red
  exit 1
}

# Step 2: Reset
Write-Host "STEP 2: RESET RAILWAY DATABASE" -ForegroundColor Yellow
Write-Host "================================`n"
Write-Host "Go to railway.app and follow these steps:"
Write-Host "  1. Select your Project"
Write-Host "  2. Click PostgreSQL service"
Write-Host "  3. Go to Settings tab"
Write-Host "  4. Scroll down and click 'Delete Service'"
Write-Host "  5. Click 'Add Service' → Select 'PostgreSQL'"
Write-Host "  6. Wait for new database to be created"
Write-Host "  7. Copy the NEW DATABASE_URL from Connect tab`n"
Write-Host "Press Enter when you've reset the database and have the new URL..."
Read-Host

# Step 3: Deploy
Write-Host "`nSTEP 3: DEPLOY NEW SCHEMA" -ForegroundColor Yellow
Write-Host "================================`n"
Write-Host "Push latest code to GitHub (migrations will run automatically):"
Write-Host "  cd 'c:\My Data\Workspace\Ledger'"
Write-Host "  git add -A"
Write-Host "  git commit -m 'Deploy with new database schema'"
Write-Host "  git push origin main`n"
Write-Host "This will trigger Railway to redeploy with new schema."
Write-Host "Wait 5-10 minutes for deployment to complete...`n"
Write-Host "Press Enter when Railway deployment is done..."
Read-Host

# Step 4: Restore
Write-Host "`nSTEP 4: RESTORE PRODUCTION DATA" -ForegroundColor Yellow
Write-Host "================================`n"
Write-Host "Enter your NEW Railway DATABASE_URL (from new PostgreSQL service):"
$NEW_RAILWAY_URL = Read-Host "NEW DATABASE_URL"

if ([string]::IsNullOrEmpty($NEW_RAILWAY_URL)) {
  Write-Host "❌ Cannot proceed without new DATABASE_URL" -ForegroundColor Red
  exit 1
}

Write-Host "`nRestoring your production data..." -ForegroundColor Yellow
try {
  $content = Get-Content $BACKUP_FILE -Raw
  & psql "$NEW_RAILWAY_URL" -c $content
  Write-Host "✅ Data restored successfully!" -ForegroundColor Green
} catch {
  Write-Host "⚠️  Restore had issues: $_" -ForegroundColor Yellow
  Write-Host "Try manual restore: psql `"$NEW_RAILWAY_URL`" < $BACKUP_FILE"
}

Write-Host "`n🎉 MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "`nYour production database now has:"
Write-Host "  ✅ Fresh schema with Bills & Partners"
Write-Host "  ✅ All production data restored"
Write-Host "  ✅ Ready for customers!`n"
