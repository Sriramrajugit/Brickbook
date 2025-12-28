import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export interface AuthUser {
  id: number
  email: string | null
  name: string | null
  role: UserRole
  siteId: number | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, siteId: true }
    })
    
    return user
  } catch (error) {
    return null
  }
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number }
    return decoded
  } catch (error) {
    return null
  }
}

export function canEdit(role: UserRole): boolean {
  return role === UserRole.OWNER || role === UserRole.SITE_MANAGER
}

export function canViewAll(role: UserRole): boolean {
  return role === UserRole.OWNER
}

export function isGuest(role: UserRole): boolean {
  return role === UserRole.GUEST
}

export function isSiteManager(role: UserRole): boolean {
  return role === UserRole.SITE_MANAGER
}
