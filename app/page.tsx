'use client'

import { useState, useEffect } from 'react'
import MobileNav from './components/MobileNav'

interface Account {
  id: number
  name: string
  balance: number
  type: string
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
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: 'Main Account', balance: 50.00, type: 'Checking' },
    { id: 2, name: 'Savings', balance: 1000.00, type: 'Savings' }
  ])

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      amount: 50.0,
      description: 'Lunch',
      category: 'Food',
      type: 'Expense',
      date: '2025-12-24',
      accountId: 1,
    },
    {
      id: 2,
      amount: 100.0,
      description: 'Salary',
      category: 'Income',
      type: 'Income',
      date: '2025-12-24',
      accountId: 1,
    },
    {
      id: 3,
      amount: 500.0,
      description: 'Savings Transfer',
      category: 'Transfer',
      type: 'Expense',
      date: '2025-12-23',
      accountId: 1,
    },
  ])

  useEffect(() => {
    // Fetch accounts if available
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
    fetchAccounts()
  }, [])

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  // Calculate income and expenses this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date)
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
  })

  const totalIncome = monthTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = monthTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // Get account-level summary
  const getAccountSummary = (accountId: number) => {
    const accountTransactions = transactions.filter(t => t.accountId === accountId)
    
    const monthAccountTransactions = accountTransactions.filter(t => {
      const tDate = new Date(t.date)
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
    })

    const income = monthAccountTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthAccountTransactions
      .filter(t => t.type === 'Expense')
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
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Total Balance</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">Rs {totalBalance.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Income This Month</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">Rs {totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Expenses This Month</h3>
                  <p className="text-3xl font-bold text-red-600 mt-2">Rs {totalExpenses.toFixed(2)}</p>
                </div>
              </div>

              {/* Account-Level Summary */}
              <div className="mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">Account Summary</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {accounts.map(account => {
                    const summary = getAccountSummary(account.id)
                    return (
                      <div key={account.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                            <p className="text-sm text-gray-500">{account.type}</p>
                          </div>
                          <a href="/accounts" className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details →</a>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Balance</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">Rs {account.balance.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Income</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">Rs {summary.income.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Expenses</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">Rs {summary.expenses.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-medium text-gray-500 uppercase">This Month Net</p>
                          <p className={`text-xl font-bold mt-1 ${summary.income - summary.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rs {(summary.income - summary.expenses).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

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
                            <td className={`px-4 py-3 text-sm font-medium text-right ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'Income' ? '+' : '-'}Rs {t.amount.toFixed(2)}
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
