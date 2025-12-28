import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        // Update logout time in database
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { logoutTime: new Date() }
        })
      }
    }
  } catch (error) {
    console.error('Error updating logout time:', error)
  }
  
  const response = NextResponse.json({ success: true })
  
  // Clear the auth token cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    maxAge: 0,
  })
  
  return response
}
