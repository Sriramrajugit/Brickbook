'use client'

import { useState, useEffect } from 'react'
import MobileNav from './components/MobileNav'
import ProfileMenu from './components/ProfileMenu'
import { useAuth } from './components/AuthProvider'
import { formatINR } from '@/lib/formatters'
import Link from 'next/link'

interface Account {
  id: number
  name: string
  type: string
  budget: number
  totalSpent: number
  balance: number
}

interface Transaction {
  id: number
  amount: number
  description: string | null
  category: string
  type: string
  date: string
  accountId: number
}

interface PartnerBill {
  id: number
  amount: number
  paidAmount: number
  status: string
}

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<PartnerBill[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [stats, setStats] = useState({ totalBudget: 0, totalCashIn: 0, totalCashOut: 0 })

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const res = await fetch('/api/accounts/summary')
      if (res.ok) {
        const result = await res.json()
        setStats(result.data || { totalBudget: 0, totalCashIn: 0, totalCashOut: 0 })
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true)
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const result = await res.json()
        setAccounts(result.data || result)
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
    } finally {
      setAccountsLoading(false)
    }
  }

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/bills?limit=100')
      if (res.ok) {
        const result = await res.json()
        setBills(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching bills:', err)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setAccounts([])
      setTransactions([])
      setBills([])
      setStats({ totalBudget: 0, totalCashIn: 0, totalCashOut: 0 })
      return
    }

    // Priority: Fetch stats immediately
    fetchStats()
    fetchBills()

    // Deferred: Fetch full accounts table after 500ms
    const timer = setTimeout(() => {
      fetchAccounts()
    }, 500)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user?.companyId])

  if (!isAuthenticated) {
    return null // Will redirect via AuthProvider
  }

  // Use lightweight stats from /api/accounts/summary
  const totalBudget = stats.totalBudget
  const totalIncome = stats.totalCashIn
  const totalExpenses = stats.totalCashOut

  // Calculate pending bills summary
  const totalBillAmount = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const totalBillPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0)
  const totalBillPending = totalBillAmount - totalBillPaid
  const pendingBillsCount = bills.filter(bill => bill.amount - bill.paidAmount > 0).length
  const billsPaidPercentage = totalBillAmount > 0 ? Math.round((totalBillPaid / totalBillAmount) * 100) : 0

  // Skeleton loader component
  const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-gray-200 p-3 rounded-full ml-3 flex-shrink-0 w-12 h-12"></div>
      </div>
      <div className="h-3 w-40 bg-gray-200 rounded"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
              {user?.role === 'SITE_MANAGER' && user?.siteId && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    Site Manager View - Viewing allocated site data only
                  </span>
                </p>
              )}
            </div>
            <div className="hidden lg:block">
              <ProfileMenu />
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="sm:px-0">
              {/* Overall Summary - Show skeletons while loading stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
                {statsLoading ? (
                  <>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </>
                ) : (
                  <>
                    {/* Project Budget Card */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Budget</h3>
                          <p className="text-3xl font-bold text-green-600 mt-2">{formatINR(totalBudget)}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full ml-3 flex-shrink-0">
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">Total budget allocation</p>
                    </div>

                    {/* Cash Available Card */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Cash Available</h3>
                          <p className="text-3xl font-bold text-green-600 mt-2">{formatINR(totalIncome)}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full ml-3 flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-2">
                        <span>↑ ₹1,25,000</span> this month
                      </p>
                    </div>

                    {/* Total Spent Card */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spent</h3>
                          <p className="text-3xl font-bold text-red-600 mt-2">{formatINR(totalExpenses)}</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full ml-3 flex-shrink-0">
                          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {totalBudget > 0 ? `${Math.round((totalExpenses / totalBudget) * 100)}% of budget` : '0% of budget'}
                      </p>
                    </div>

                    {/* Bills Pending Card */}
                    <Link href="/bills" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Bills Pending</h3>
                          <p className="text-3xl font-bold text-orange-600 mt-2">{formatINR(totalBillPending)}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full ml-3 flex-shrink-0">
                          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{pendingBillsCount} supplier bills</p>
                    </Link>
                  </>
                )}
              </div>

              {/* Project Financial Summary Table */}
              {accounts.length > 0 && (
              <div className="mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">Project Financial Summary</h2>
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Project</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Budget</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Received</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Spend</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Balance</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {accounts.map(account => {
                        const status = account.balance >= 0 ? 'On Track' : 'Over Budget'
                        return (
                          <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{account.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{account.type}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status === 'Over Budget' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {status === 'Over Budget' ? '● Over Budget' : '● On Track'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-gray-900">{formatINR(account.budget)}</td>
                            <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">{formatINR(account.totalSpent || 0)}</td>
                            <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">{formatINR(account.totalSpent || 0)}</td>
                            <td className={`px-6 py-4 text-sm text-right font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatINR(account.balance)}
                            </td>
                            <td className="px-6 py-4 text-sm text-center">
                              <a href="/accounts" className="text-blue-600 hover:text-blue-800 font-medium">Manage →</a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
