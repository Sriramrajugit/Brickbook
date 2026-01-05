'use client'

import { useState, useEffect } from 'react'
import MobileNav from './components/MobileNav'
import { useAuth } from './components/AuthProvider'
import { formatINR } from '@/lib/formatters'

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

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      // Fetch all transactions for dashboard calculations (limit=1000)
      const res = await fetch('/api/transactions?limit=1000')
      if (res.ok) {
        const result = await res.json()
        // API now returns { data: [...], pagination: {...} }
        setTransactions(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all data on logout
      setAccounts([])
      setTransactions([])
      return
    }

    fetchAccounts()
    fetchTransactions()
  }, [isAuthenticated, user?.companyId])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Will redirect via AuthProvider
  }

  // Calculate total budget across all accounts
  const totalBudget = accounts.reduce((sum, acc) => sum + acc.budget, 0)

  // Calculate overall income and expenses from ALL transactions
  const totalIncome = transactions
    .filter(t => t.type === 'Cash-in' || t.type === 'Cash-In')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'Cash-out' || t.type === 'Cash-Out')
    .reduce((sum, t) => sum + t.amount, 0)

  // Get account-level summary (overall, not just this month)
  const getAccountSummary = (accountId: number) => {
    const accountTransactions = transactions.filter(t => t.accountId === accountId)

    const income = accountTransactions
      .filter(t => t.type === 'Cash-in' || t.type === 'Cash-In')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = accountTransactions
      .filter(t => t.type === 'Cash-out' || t.type === 'Cash-Out')
      .reduce((sum, t) => sum + t.amount, 0)

    return { income, expenses }
  }

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(-5).reverse()

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="sm:px-0">
              {/* Overall Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Total Budget</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">{formatINR(totalBudget)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Total Cash in</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{formatINR(totalIncome)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Total Cash-out</h3>
                  <p className="text-3xl font-bold text-red-600 mt-2">{formatINR(totalExpenses)}</p>
                </div>
              </div>

              {/* Account-Level Summary Table - Only show if accounts exist */}
              {accounts.length > 0 && (
              <div className="mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">Account Summary</h2>
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Account Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Budget</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Cash In</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Cash Out</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Net Total</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {accounts.map(account => {
                        const summary = getAccountSummary(account.id)
                        return (
                          <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{account.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{account.type}</td>
                            <td className="px-6 py-4 text-sm text-right text-gray-900">{formatINR(account.budget)}</td>
                            <td className="px-6 py-4 text-sm text-right text-blue-600 font-medium">{formatINR(summary.income)}</td>
                            <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">{formatINR(summary.expenses)}</td>
                            <td className={`px-6 py-4 text-sm text-right font-semibold ${summary.income - summary.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatINR(summary.income - summary.expenses)}
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

              {/* Recent Transactions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentTransactions.map(t => {
                        const account = accounts.find(a => a.id === t.accountId)
                        return (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(t.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{account?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{t.description || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{t.category}</td>
                            <td className={`px-4 py-3 text-sm font-medium text-right whitespace-nowrap ${(t.type === 'Cash-in' || t.type === 'Cash-In') ? 'text-green-600' : 'text-red-600'}`}>
                              {(t.type === 'Cash-in' || t.type === 'Cash-In') ? '+' : '-'}{formatINR(t.amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <a href="/transactions" className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium">
                  View All Transactions →
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
