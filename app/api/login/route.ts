import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()
    console.log('Login attempt:', { userId, password: '***' }) // Debug log

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password required' }, { status: 400 })
    }

    // Try to find user by ID (if numeric) or by email
    let user
    const numericId = parseInt(userId)
    if (!isNaN(numericId)) {
      user = await prisma.user.findUnique({
        where: { id: numericId }
      })
    } else {
      user = await prisma.user.findUnique({
        where: { email: userId }
      })
    }
    console.log('Query result:', user) // Debug
    
    if (!user) {
      console.log('User not found:', userId)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log('User found, checking password...') // Debug
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValidPassword) // Debug

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    })
    
    const token = sign({ userId: user.id }, process.env.JWT_SECRET!)
    console.log('Token generated:', token.substring(0, 20) + '...')
    
    const response = NextResponse.json({ success: true, userId: user.id })
    response.cookies.set('auth-token', token, { 
      httpOnly: true, 
      maxAge: 24*60*60,
      path: '/',
      sameSite: 'lax',
      secure: false // Set to false for localhost
    })
    
    console.log('Cookie set in response')
    return response

  } catch (error) {
    console.error('Login ERROR:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
