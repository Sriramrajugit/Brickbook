import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// GET /api/admin/companies - List all companies (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Only OWNER role can access admin functions
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Only Brickbook.in company owner can access Admin Panel
    if (user.company?.name !== 'Brickbook.in') {
      return NextResponse.json({ error: 'Unauthorized - Only Brickbook.in Admin can access' }, { status: 403 })
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get all companies with statistics
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          package: true,
          _count: {
            select: {
              users: true,
              employees: true,
              accounts: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.company.count(),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: companies,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// POST /api/admin/companies - Onboard new customer
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Only OWNER role can access admin functions
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Only Brickbook.in company owner can access Admin Panel
    if (user.company?.name !== 'Brickbook.in') {
      return NextResponse.json({ error: 'Unauthorized - Only Brickbook.in Admin can access' }, { status: 403 })
    }

    const { companyName, ownerEmail, ownerName, ownerPassword, mainAccountBudget, selectedPackage } = await request.json()

    // Validate input
    if (!companyName || !ownerEmail || !ownerName || !ownerPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, ownerEmail, ownerName, ownerPassword' },
        { status: 400 }
      )
    }

    // Validate package selection
    const validPackages = ['FOUNDATION', 'STRUCTURE', 'LANDMARK']
    const packageToUse = selectedPackage && validPackages.includes(selectedPackage) ? selectedPackage : 'FOUNDATION'

    // Check if company name already exists
    const existingCompany = await prisma.company.findUnique({
      where: { name: companyName },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company name already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: { 
          name: companyName,
          package: packageToUse as any,
        },
      })

      // 2. Create Main Site
      const site = await tx.site.create({
        data: {
          name: 'Main Office',
          location: 'Headquarters',
          companyId: company.id,
        },
      })

      // 3. Create Owner User
      const hashedPassword = await bcrypt.hash(ownerPassword, 10)
      const owner = await tx.user.create({
        data: {
          email: ownerEmail,
          name: ownerName,
          password: hashedPassword,
          role: 'OWNER',
          companyId: company.id,
          siteId: null,
        },
      })

      // 4. Create Main Account
      const account = await tx.account.create({
        data: {
          name: 'Main Account',
          type: 'General',
          budget: mainAccountBudget || 100000,
          companyId: company.id,
          siteId: site.id,
        },
      })

      // 5. Create Default Categories
      const categories = [
        { name: 'Capital', description: 'Initial capital and investments' },
        { name: 'Salary', description: 'Employee salary payments' },
        { name: 'Salary Advance', description: 'Salary advance to employees' },
        { name: 'Rent', description: 'Rent and lease payments' },
        { name: 'Utilities', description: 'Electricity, water, internet' },
        { name: 'Transport', description: 'Transportation and fuel costs' },
        { name: 'Food & Tea', description: 'Office food and beverages' },
        { name: 'Repairs', description: 'Maintenance and repairs' },
        { name: 'Supplies', description: 'Office and supply purchases' },
        { name: 'Other', description: 'Miscellaneous expenses' },
      ]

      for (const cat of categories) {
        await tx.category.upsert({
          where: {
            name_companyId: { name: cat.name, companyId: company.id },
          },
          update: {},
          create: {
            name: cat.name,
            description: cat.description,
            companyId: company.id,
          },
        })
      }

      return { company, site, owner, account }
    })

    return NextResponse.json(
      {
        message: 'Customer onboarded successfully',
        data: {
          companyId: result.company.id,
          companyName: result.company.name,
          ownerId: result.owner.id,
          ownerEmail: result.owner.email,
          siteId: result.site.id,
          accountId: result.account.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error onboarding customer:', error)
    return NextResponse.json(
      { error: 'Failed to onboard customer' },
      { status: 500 }
    )
  }
}
