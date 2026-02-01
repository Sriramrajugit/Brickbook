'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from './AuthProvider'

interface MobileNavProps {
  currentPage: string
}

export default function MobileNav({ currentPage }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [masterExpanded, setMasterExpanded] = useState(false)
  const [companyName, setCompanyName] = useState<string>('')
  const { logout, user } = useAuth()

  console.log('MobileNav rendering, companyName:', companyName, 'user:', user?.name)

  useEffect(() => {
    if (!user?.companyId) return

    const fetchCompanyName = async () => {
      try {
        const res = await fetch('/api/companies')
        if (res.ok) {
          const companies = await res.json()
          const company = companies.find((c: any) => c.id === user.companyId)
          if (company) {
            console.log('Setting company name:', company.name)
            setCompanyName(company.name)
          }
        }
      } catch (err) {
        console.error('Error fetching company:', err)
      }
    }
    
    console.log('Fetching company for user:', user.companyId)
    fetchCompanyName()
  }, [user?.companyId])

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
  }

  const getRoleBadge = () => {
    if (!user) return null
    
    const roleColors = {
      OWNER: 'bg-purple-100 text-purple-800',
      SITE_MANAGER: 'bg-blue-100 text-blue-800',
      GUEST: 'bg-gray-100 text-gray-800',
    }
    
    const roleLabels = {
      OWNER: '👑 Owner',
      SITE_MANAGER: '🔧 Manager',
      GUEST: '👤 Guest',
    }
    
    return (
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
        {roleLabels[user.role]}
      </div>
    )
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/transactions', label: 'Transactions', icon: '💰' },
    { href: '/attendance', label: 'Attendance', icon: '📅' },
    { href: '/payroll', label: 'Payroll', icon: '💵' },
    { href: '/reports', label: 'Reports', icon: '📈' },
  ]

  const masterItems = [
    { href: '/accounts', label: 'Accounts', icon: '💼' },
    { href: '/categories', label: 'Categories', icon: '🏷️' },
    { href: '/employees', label: 'Partners', icon: '👥' },
    { href: '/users', label: 'Users', icon: '🔐' },
  ]

  const isMasterActive = masterItems.some(item => item.href === currentPage)

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex items-center justify-between p-4">
          <Image 
            src="/brickbook-logo.png" 
            alt="BrickBook" 
            width={200} 
            height={50}
            priority
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:transition-none lg:transform-none`}
      >
        <div className="p-6">
          <Image 
            src="/brickbook-logo.png" 
            alt="BrickBook" 
            width={220} 
            height={70}
          />
          {/* User Info */}
          {user && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-700 mb-2">{companyName || `Company ${user.companyId}`}</div>
              {getRoleBadge()}
            </div>
          )}
        </div>
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`block px-6 py-3 text-gray-700 hover:bg-gray-200 ${
                currentPage === item.href ? 'bg-gray-100' : ''
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          {/* Master Menu - Only for OWNER */}
          {user?.role === 'OWNER' && (
          <div>
            <button
              onClick={() => setMasterExpanded(!masterExpanded)}
              className={`w-full flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-200 ${
                isMasterActive ? 'bg-gray-100' : ''
              }`}
            >
              <span>
                <span className="mr-2">⚙️</span>
                Master
              </span>
              <svg
                className={`w-4 h-4 transform transition-transform ${masterExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {masterExpanded && (
              <div className="bg-gray-50">
                {masterItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-12 py-2 text-sm text-gray-700 hover:bg-gray-200 ${
                      currentPage === item.href ? 'bg-gray-200 font-medium' : ''
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 mt-4 text-red-600 hover:bg-red-50 border-t border-gray-200"
          >
            <span className="mr-2">🚪</span>
            Logout
          </button>
        </nav>
      </div>
    </>
  )
}
