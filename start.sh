#!/bin/bash
# Run migrations before starting the app
echo "Running database migrations..."
npx prisma migrate deploy --skip-generate || true
echo "Starting Next.js server..."
exec next start
