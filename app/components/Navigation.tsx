'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import MobileNav from './MobileNav'

export default function Navigation() {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/accounts', label: 'Accounts' },
    { href: '/categories', label: 'Categories' },
    { href: '/employees', label: 'Employees' },
    { href: '/attendance', label: 'Attendance' },
    { href: '/payroll', label: 'Payroll' },
    { href: '/reports', label: 'Reports' },
  ]

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Ledger</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navItems.map((item) => (
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
          <div className="flex items-center">
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
