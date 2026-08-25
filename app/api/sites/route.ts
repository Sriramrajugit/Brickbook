import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/sites - Get all sites for the current user's company
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sites = await prisma.site.findMany({
      where: {
        companyId: user.companyId,
      },
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(sites)
  } catch (err) {
    console.error('Error fetching sites:', err)
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    )
  }
}
