import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Login attempt started')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
    
    const { userId, password } = await request.json()

    if (!userId || !password) {
      const errorResponse = NextResponse.json({ error: 'User ID and password required' }, { status: 400 })
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    console.log('🔍 Checking credentials for userId:', userId)

    // Try to find user by ID (if numeric) or by email
    let user
    const numericId = parseInt(userId)
    if (!isNaN(numericId)) {
      console.log('🔎 Looking up user by ID:', numericId)
      user = await prisma.user.findUnique({
        where: { id: numericId }
      })
    } else {
      console.log('🔎 Looking up user by email:', userId)
      user = await prisma.user.findUnique({
        where: { email: userId }
      })
    }
    console.log('✅ User lookup complete, user found:', !!user)
    
    if (!user) {
      const errorResponse = NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    if (!user.password) {
      const errorResponse = NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      const errorResponse = NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        loginTime: new Date(),
        updatedAt: new Date() 
      }
    })
    
    const token = sign({ userId: user.id }, process.env.JWT_SECRET!)
    
    const response = NextResponse.json({ 
      success: true, 
      userId: user.id,
      token: token  // Return token in JSON for mobile clients
    })
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    response.cookies.set('auth-token', token, { 
      httpOnly: true, 
      maxAge: 24*60*60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https')
    })
    
    return response

  } catch (error) {
    console.error('❌ Login ERROR:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    const errorResponse = NextResponse.json({ error: 'Server error: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    return errorResponse
  }
}
