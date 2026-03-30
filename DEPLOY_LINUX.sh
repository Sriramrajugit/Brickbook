#!/bin/bash
#
# Production Deployment Script for Linux/Mac
# Reports + Payroll Fixes Release
# Usage: ./DEPLOY_LINUX.sh [--dry-run] [--skip-backup]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
DRY_RUN=0
SKIP_BACKUP=0
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-ledger_prod}"
DB_HOST="${DB_HOST:-localhost}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=1
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "===================================="
echo "Ledger Production Deployment"
echo "===================================="
echo "Timestamp: $TIMESTAMP"
echo "Script Directory: $SCRIPT_DIR"
echo ""

# Check prerequisites
echo "[1/7] Checking prerequisites..."
if [[ ! -f "package.json" ]]; then
  echo -e "${RED}ERROR:${NC} package.json not found. Run from project root directory."
  exit 1
fi

if [[ ! -f "PRODUCTION_DEPLOYMENT.patch" ]]; then
  echo -e "${RED}ERROR:${NC} PRODUCTION_DEPLOYMENT.patch not found in $SCRIPT_DIR"
  exit 1
fi
echo -e "      ${GREEN}✓${NC} Files found"
echo ""

# Check Node.js
echo "[2/7] Verifying Node.js..."
if ! command -v node &> /dev/null; then
  echo -e "${RED}ERROR:${NC} Node.js not found. Please install Node.js 20+"
  exit 1
fi
NODE_VERSION=$(node --version)
echo -e "      ${GREEN}✓${NC} Node.js $NODE_VERSION found"
echo ""

# Check Git
echo "[3/7] Verifying Git..."
if ! command -v git &> /dev/null; then
  echo -e "${RED}ERROR:${NC} Git not found. Please install Git"
  exit 1
fi
echo -e "      ${GREEN}✓${NC} Git found"
echo ""

# Database Backup
if [[ $SKIP_BACKUP -eq 0 ]]; then
  echo "[4/7] Backing up database..."
  if command -v pg_dump &> /dev/null; then
    if pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
      BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
      echo -e "      ${GREEN}✓${NC} Database backed up: $BACKUP_FILE ($BACKUP_SIZE)"
    else
      echo -e "      ${YELLOW}⚠${NC} Backup failed. Check PostgreSQL credentials."
      echo "      ${YELLOW}ℹ${NC} Database may be running with different settings."
    fi
  else
    echo -e "      ${YELLOW}⚠${NC} pg_dump not found. Skipping automatic backup."
    echo "      ${YELLOW}ℹ${NC} Run manually: pg_dump $DB_USER -h $DB_HOST $DB_NAME > $BACKUP_FILE"
  fi
else
  echo "[4/7] Skipping database backup (--skip-backup flag set)"
fi
echo ""

# Apply Patch
echo "[5/7] Applying patch files..."
if [[ $DRY_RUN -eq 1 ]]; then
  echo "[DRY-RUN] Checking patch compatibility..."
  if git apply --check PRODUCTION_DEPLOYMENT.patch 2>&1 | tee /dev/null; then
    echo -e "[DRY-RUN] ${GREEN}✓${NC} Patch is compatible"
  else
    echo -e "${RED}ERROR:${NC} Patch check failed. Abort deployment."
    exit 1
  fi
else
  echo "Applying patch..."
  if git apply PRODUCTION_DEPLOYMENT.patch 2>&1 | tee /dev/null; then
    echo -e "      ${GREEN}✓${NC} Patch applied successfully"
  else
    echo -e "${RED}ERROR:${NC} Patch apply failed. Rollback needed."
    exit 1
  fi
fi
echo ""

# Install Dependencies
echo "[6/7] Installing dependencies..."
if [[ $DRY_RUN -eq 1 ]]; then
  echo "[DRY-RUN] Would run: npm install"
else
  if npm install 2>&1 | tail -20; then
    echo -e "      ${GREEN}✓${NC} Dependencies installed"
  else
    echo -e "${RED}ERROR:${NC} npm install failed"
    exit 1
  fi
fi
echo ""

# Build Application
echo "[7/7] Building application..."
if [[ $DRY_RUN -eq 1 ]]; then
  echo "[DRY-RUN] Would run: npm run build"
else
  if npm run build 2>&1 | tail -30; then
    echo -e "      ${GREEN}✓${NC} Build completed"
  else
    echo -e "${RED}ERROR:${NC} Build failed"
    exit 1
  fi
fi
echo ""

if [[ $DRY_RUN -eq 1 ]]; then
  echo ""
  echo "===================================="
  echo -e "${GREEN}DRY-RUN COMPLETED SUCCESSFULLY${NC}"
  echo "===================================="
  echo "All checks passed. Ready for deployment."
  echo ""
  echo "Next steps:"
  echo "  1. Run backup: pg_dump -U $DB_USER -h $DB_HOST $DB_NAME > $BACKUP_FILE"
  echo "  2. Run deployment: ./DEPLOY_LINUX.sh"
  echo "  3. Start app: npm start"
  echo ""
else
  echo ""
  echo "===================================="
  echo -e "${GREEN}DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
  echo "===================================="
  echo ""
  echo "Next steps:"
  echo "  1. Start application: npm start"
  echo "  2. Monitor logs for errors"
  echo "  3. Test endpoints: curl http://localhost:3000/api/auth/me"
  echo "  4. Verify reports page loads"
  echo ""
  if [[ -f "$BACKUP_FILE" ]]; then
    echo "Backup location: $BACKUP_FILE"
  fi
  echo ""
fi

echo -e "${GREEN}✓${NC} Deployment script completed"
