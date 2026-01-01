
import { cookies } from 'next/headers';
import { verify, JwtPayload } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: number;
  email: string | null;
  name: string | null;
  role: UserRole;
  companyId: number | null;
  siteId: number | null;
}

// Export verifyToken for JWT verification (used in logout route)
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload | { userId: number };
    if (typeof decoded === 'object' && 'userId' in decoded) {
      return { userId: (decoded as any).userId };
    }
    return null;
  } catch (err) {
    console.log('verifyToken error:', err);
    return null;
  }
}

// Debug version with extra logging
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    console.log('Auth token from cookie:', token);

    if (!token) {
      console.log('No auth-token cookie found');
      return null;
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number };
      console.log('Decoded JWT:', decoded);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, companyId: true, siteId: true }
      });

      console.log('User from DB:', user);
      return user;
    } catch (jwtErr) {
      console.log('JWT verification failed:', jwtErr);
      return null;
    }
  } catch (error) {
    console.log('getCurrentUser error:', error);
    return null;
  }
}