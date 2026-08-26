#!/bin/bash
# Safe Railway Database Migration Script
# Export → Reset → Deploy → Restore

set -e

echo "🔒 SAFE DATABASE MIGRATION SCRIPT"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backup
echo -e "${YELLOW}STEP 1: BACKUP PRODUCTION DATA${NC}"
echo "=================================="
echo ""
echo "Do you have your Railway DATABASE_URL? (y/n)"
read -r has_url

if [ "$has_url" = "y" ]; then
  echo "Paste your Railway DATABASE_URL:"
  read -r RAILWAY_URL
  
  echo ""
  echo "Backing up data from Railway..."
  pg_dump "$RAILWAY_URL" > "backup_production_$(date +%Y%m%d_%H%M%S).sql"
  
  if [ -f "backup_production_*.sql" ]; then
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    BACKUP_FILE=$(ls -t backup_production_*.sql | head -1)
    echo "   File: $BACKUP_FILE"
    echo "   Size: $(du -h $BACKUP_FILE | cut -f1)"
  else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Cannot proceed without DATABASE_URL${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}STEP 2: RESET RAILWAY DATABASE${NC}"
echo "=================================="
echo ""
echo "Go to railway.app and:"
echo "  1. Select PostgreSQL service"
echo "  2. Go to Settings"
echo "  3. Click 'Delete Service'"
echo "  4. Click 'Add Service' → PostgreSQL"
echo "  5. Copy the NEW DATABASE_URL"
echo "  6. Update .env file with new URL"
echo ""
echo "After reset, press Enter to continue..."
read -r

echo ""
echo -e "${YELLOW}STEP 3: DEPLOY NEW SCHEMA${NC}"
echo "=================================="
echo ""
echo "Push to GitHub and Railway will auto-deploy:"
echo "  git add -A"
echo "  git commit -m 'Deploy with new database'"
echo "  git push origin main"
echo ""
echo "Wait 5-10 minutes for Railway deployment to complete..."
echo "Press Enter when deployment is done..."
read -r

echo ""
echo -e "${YELLOW}STEP 4: RESTORE PRODUCTION DATA${NC}"
echo "=================================="
echo ""
echo "Ready to restore data? Enter NEW Railway DATABASE_URL:"
read -r NEW_RAILWAY_URL

echo "Restoring data from backup..."
psql "$NEW_RAILWAY_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Data restored successfully!${NC}"
  echo ""
  echo "Your production database is now:"
  echo "  ✅ Fresh schema with all new tables"
  echo "  ✅ Production data restored"
  echo "  ✅ Ready for Bills & Partners modules"
else
  echo -e "${RED}❌ Data restore failed!${NC}"
  echo "Backup file: $BACKUP_FILE"
  echo "Try manual restore: psql NEW_DATABASE_URL < $BACKUP_FILE"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 MIGRATION COMPLETE!${NC}"
echo ""
