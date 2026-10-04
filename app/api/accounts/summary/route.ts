import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lightweight aggregation: fetch only 3 summary numbers in parallel
    const [budgetData, cashInData, cashOutData] = await Promise.all([
      prisma.account.aggregate({
        _sum: {
          budget: true,
        },
        where: {
          companyId: user.companyId,
        },
      }),
      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          companyId: user.companyId,
          type: { in: ['Cash-In', 'Cash-in'] }, // Handle both formats
        },
      }),
      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          companyId: user.companyId,
          type: { in: ['Cash-Out', 'Cash-out'] }, // Handle both formats
        },
      }),
    ])

    return NextResponse.json({
      data: {
        totalBudget: budgetData._sum.budget || 0,
        totalCashIn: cashInData._sum.amount || 0,
        totalCashOut: cashOutData._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Summary stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary statistics' },
      { status: 500 }
    )
  }
}
