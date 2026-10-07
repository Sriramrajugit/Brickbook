import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CustomerPackage } from '@prisma/client'

/**
 * POST /api/admin/companies/[id]/upgrade
 * Admin-only operation to upgrade a demo company to a paid plan
 * Atomically updates all demo-related fields
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    // Verify user is admin
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Only admins can upgrade companies' },
        { status: 403 }
      )
    }
    
    const companyId = parseInt(id)
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'INVALID_ID', message: 'Invalid company ID' },
        { status: 400 }
      )
    }
    
    // Get request body
    const body = await request.json()
    const { accessLevel } = body
    
    // Validate access level
    const validLevels = ['FOUNDATION', 'STRUCTURE', 'LANDMARK']
    if (!validLevels.includes(accessLevel)) {
      return NextResponse.json(
        {
          error: 'INVALID_ACCESS_LEVEL',
          message: `Access level must be one of: ${validLevels.join(', ')}`,
        },
        { status: 400 }
      )
    }
    
    // Get current company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'COMPANY_NOT_FOUND', message: 'Company not found' },
        { status: 404 }
      )
    }
    
    // Perform atomic upgrade transaction
    const upgradedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        // Convert string to enum
        package: accessLevel as CustomerPackage,
        isDemoAccount: false,
        demoStartedAt: null,
        demoExpiryDate: null,
        upgradeStatus: null,
      },
    })
    
    return NextResponse.json({
      message: 'Company upgraded successfully',
      company: {
        id: upgradedCompany.id,
        name: upgradedCompany.name,
        accessLevel: upgradedCompany.package,
        isDemoAccount: upgradedCompany.isDemoAccount,
        demoExpiryDate: upgradedCompany.demoExpiryDate,
      },
    })
  } catch (error) {
    console.error('Error upgrading company:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to upgrade company' },
      { status: 500 }
    )
  }
}
