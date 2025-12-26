import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()
    console.log('Login attempt:', { userId, password: '***' }) // Debug log

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId }
    })
    console.log('Query result:', user) // Debug
    
    if (!user) {
      console.log('User not found:', userId)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log('User found, checking password...') // Debug
    const isValidPassword = await compare(password, user.password)
    console.log('Password valid:', isValidPassword) // Debug

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({
      where: { user_id: userId },
      data: { lastlogin_dt: new Date() }
    })
    
    const token = sign({ userId: user.user_id }, process.env.JWT_SECRET!)
    const response = NextResponse.json({ success: true, userId: user.user_id })
    response.cookies.set('auth-token', token, { httpOnly: true, maxAge: 24*60*60 })
    return response

  } catch (error) {
    console.error('Login ERROR:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
