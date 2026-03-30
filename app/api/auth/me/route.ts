import { NextResponse } from 'next/server';
import { getCurrentUserWithFeatures } from '@/lib/auth';

export async function GET() {
  const userWithFeatures = await getCurrentUserWithFeatures();
  if (!userWithFeatures) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  return NextResponse.json({
    user: {
      id: userWithFeatures.id,
      email: userWithFeatures.email,
      name: userWithFeatures.name,
      role: userWithFeatures.role,
      companyId: userWithFeatures.companyId,
      siteId: userWithFeatures.siteId,
    },
    features: userWithFeatures.features,
    plan: userWithFeatures.plan,
  });
}