import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? '✓ SET' : '✗ NOT SET',
    DIRECT_URL: process.env.DIRECT_URL ? '✓ SET' : '✗ NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? '✓ SET' : '✗ NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
    DATABASE_URL_FIRST_CHARS: process.env.DATABASE_URL?.substring(0, 50) || 'NOT SET',
  })
}
