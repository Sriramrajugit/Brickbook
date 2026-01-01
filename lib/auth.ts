
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
    return null;
  }
}

// Export verifyToken for JWT verification (used in logout route)
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, companyId: true, siteId: true }
      });

      return user;
    } catch (jwtErr) {
      return null;
    }
  } catch (error) {
    return null;
  }
}