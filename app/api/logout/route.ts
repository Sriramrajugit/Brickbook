import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAudit, getClientIP, getUserAgent } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        // Update logout time in database
        const user = await prisma.user.update({
          where: { id: decoded.userId },
          data: { logoutTime: new Date() }
        })

        // Create audit log for logout
        await createAudit({
          companyId: user.companyId,
          module: 'LOGIN',
          action: 'LOGOUT',
          userId: user.id,
          description: `User ${user.email || `ID: ${user.id}`} logged out`,
          ipAddress: getClientIP(request.headers),
          userAgent: getUserAgent(request.headers),
        });
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
