import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const urlObj = dbUrl ? new URL(dbUrl) : null
  
  return NextResponse.json({
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_HOST: urlObj?.hostname || 'COULD NOT PARSE',
    DATABASE_URL_PORT: urlObj?.port || 'COULD NOT PARSE',
    DIRECT_URL_SET: !!process.env.DIRECT_URL,
    JWT_SECRET_SET: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENV: process.env.RAILWAY_ENVIRONMENT,
    FULL_DB_URL: dbUrl ? `${dbUrl.substring(0, 80)}...` : 'NOT SET'
  })
}
