import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Login attempt started')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
    
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    })
    
    const token = sign({ userId: user.id }, process.env.JWT_SECRET!)
    
    const response = NextResponse.json({ success: true, userId: user.id })
    response.cookies.set('auth-token', token, { 
      httpOnly: true, 
      maxAge: 24*60*60,
      path: '/',
      sameSite: 'lax',
      secure: false // Set to false for localhost
    })
    
    return response

  } catch (error) {
    console.error('❌ Login ERROR:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    return NextResponse.json({ error: 'Server error: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
