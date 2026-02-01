'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import MobileNav from './MobileNav'

export default function Navigation() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [companyName, setCompanyName] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    if (user?.companyId) {
      const cached = localStorage.getItem(`company_${user.companyId}`)
      if (cached) {
        setCompanyName(cached)
      }
    }
    setIsHydrated(true)
  }, [user?.companyId])

  useEffect(() => {
    if (!user?.companyId) return

    // Try to get from localStorage first
    const cached = localStorage.getItem(`company_${user.companyId}`)
    if (cached) {
      setCompanyName(cached)
      return
    }

    const fetchCompanyName = async () => {
      try {
        const res = await fetch('/api/companies')
        if (res.ok) {
          const companies = await res.json()
          const company = companies.find((c: any) => c.id === user.companyId)
          if (company) {
            setCompanyName(company.name)
            // Cache in localStorage
            localStorage.setItem(`company_${user.companyId}`, company.name)
          }
        }
      } catch (err) {
        console.error('Error fetching company:', err)
      }
    }
    
    fetchCompanyName()
  }, [user?.companyId])

  const handleLogout = async () => {
    await logout()
  }

  const mainNavItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/accounts', label: 'Accounts' },
    { href: '/categories', label: 'Categories' },
    { href: '/employees', label: 'Employees' },
    { href: '/attendance', label: 'Attendance' },
    { href: '/payroll', label: 'Payroll' },
    { href: '/reports', label: 'Reports' },
    { href: '/users', label: 'Users' },
  ]

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex flex-col items-start">
              <h1 className="text-xl font-bold text-gray-800">Brickbook</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
              {mainNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isHydrated && user && companyName && (
              <div className="flex flex-col items-end">
                <div className="text-xs text-gray-500 font-medium">Organization</div>
                <div className="text-sm font-semibold text-blue-700">{companyName}</div>
                <div className="text-xs text-gray-600 mt-1">
                  <a 
                    href="/profile" 
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    {user.name || user.email} →
                  </a>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <MobileNav currentPage={pathname} />
      </div>
    </nav>
  )
}
