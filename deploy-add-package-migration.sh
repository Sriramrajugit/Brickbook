#!/bin/bash

# Production Database Migration: Add package column to company table
# This script adds the missing 'package' column to production database

echo "🔄 Starting migration: Add package column to companies table..."
echo "⚠️  Make sure you have a backup of your production database first!"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  echo "Please set DATABASE_URL before running this script"
  exit 1
fi

echo ""
echo "🔧 Running migration..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo "✅ package column added to companies table"
  echo "✅ All customers now default to FOUNDATION package"
  echo ""
  echo "Next steps:"
  echo "1. Run: npm run build"
  echo "2. Deploy the new code to production"
  echo "3. Users can now access Bills & Invoices based on their package level"
else
  echo ""
  echo "❌ Migration failed!"
  echo "Check the error above and try again"
  exit 1
fi
