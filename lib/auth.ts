
import { cookies, headers } from 'next/headers';
import { verify, JwtPayload } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Type for UserRole (matches Prisma schema)
type UserRole = 'OWNER' | 'SITE_MANAGER' | 'GUEST';

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
    let token: string | undefined;
    
    // Try to get token from cookies (web browsers)
    const cookieStore = await cookies();
    token = cookieStore.get('auth-token')?.value;
    
    // If no cookie, try to get Bearer token from Authorization header (mobile/API clients)
    if (!token) {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
        console.log('🔐 Token found in Authorization header');
      }
    } else {
      console.log('🔐 Token found in cookie');
    }

    if (!token) {
      console.log('❌ No token found in cookie or Authorization header');
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