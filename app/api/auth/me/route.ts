import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      siteId: user.siteId,
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
