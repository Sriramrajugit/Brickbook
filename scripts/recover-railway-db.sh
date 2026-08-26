#!/bin/bash

# Railway Database Recovery Script
echo "🔧 Attempting to recover Railway PostgreSQL database..."

# Wait for database recovery
echo "Waiting 30 seconds for automatic recovery..."
sleep 30

# Check database status
echo "Checking database status..."
pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER

# If database is ready, run migrations
if [ $? -eq 0 ]; then
  echo "✅ Database is ready, running Prisma migrations..."
  npx prisma migrate deploy
  npx prisma db push
  echo "✅ Database recovered and updated!"
else
  echo "❌ Database still unavailable, please reset in Railway console"
fi
