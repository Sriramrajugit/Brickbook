import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, password, companyId } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password required' }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company selection required' }, { status: 400 })
    }

    // Try to find user by ID (if numeric) or by email AND verify company membership
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
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify user belongs to selected company
    if (user.companyId !== companyId) {
      return NextResponse.json({ error: 'User does not belong to selected company' }, { status: 401 })
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
    console.error('Login ERROR:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
