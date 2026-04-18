'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import SessionTimer from './SessionTimer'
import MobileNav from './MobileNav'

export default function Navigation() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [companyName, setCompanyName] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)

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
          const company = await res.json()
          // /api/companies now returns a single company object (not an array)
          if (company && company.name) {
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
    { href: '/import', label: 'Import Data' },
    { href: '/accounts', label: 'Accounts' },
    { href: '/categories', label: 'Categories' },
    { href: '/employees', label: 'Employees' },
    { href: '/attendance', label: 'Attendance' },
    { href: '/payroll', label: 'Payroll' },
    { href: '/reports', label: 'Reports' },
    { href: '/users', label: 'Users' },
  ]

  const inventoryMenuItems = [
    { href: '/inventory/master', label: 'Inventory Master' },
    { href: '/inventory/purchase-orders', label: 'Purchase Orders' },
    { href: '/inventory/grn', label: 'Goods Received Notes' },
    { href: '/inventory/daywise-usage', label: 'Day-wise Usage' },
    { href: '/inventory/supplier-payments', label: 'Supplier Payments' },
  ]

  return (
    <nav className="bg-white shadow-md relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
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
              
              {/* Inventory Dropdown Menu */}
              <div className="relative flex items-center" onMouseLeave={() => setInventoryOpen(false)}>
                <button
                  onMouseEnter={() => setInventoryOpen(true)}
                  onClick={() => setInventoryOpen(!inventoryOpen)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    inventoryMenuItems.some(item => pathname === item.href)
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Inventory
                  <svg className={`ml-1 w-4 h-4 transform transition-transform ${inventoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown content */}
                {inventoryOpen && (
                  <div className="absolute top-12 left-0 w-56 rounded-md shadow-xl bg-white border border-gray-200 ring-1 ring-black ring-opacity-5 z-50 py-1">
                    {inventoryMenuItems.map((item, idx) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setInventoryOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          pathname === item.href
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${idx === 0 ? 'rounded-t-md' : ''} ${idx === inventoryMenuItems.length - 1 ? 'rounded-b-md' : ''}`}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isHydrated && user && companyName && (
              <div className="flex flex-col items-end gap-2">
                <div>
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
                <SessionTimer />
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
