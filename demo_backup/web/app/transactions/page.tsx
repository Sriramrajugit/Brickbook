'use client'

import { useState } from 'react'

interface Transaction {
  id: number
  amount: number
  description: string | null
  category: string
  type: string
  date: string
  account: { name: string }
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      amount: 50.00,
      description: 'Lunch',
      category: 'Food',
      type: 'Expense',
      date: '2025-12-24',
      account: { name: 'Main Account' }
    },
    {
      id: 2,
      amount: 100.00,
      description: 'Salary',
      category: 'Income',
      type: 'Income',
      date: '2025-12-24',
      account: { name: 'Main Account' }
    }
  ])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)
    const newTransaction: Transaction = {
      id: transactions.length + 1,
      amount: parseFloat(data.amount as string),
      description: data.description as string || null,
      category: data.category as string,
      type: data.type as string,
      date: data.date as string,
      account: { name: 'Main Account' }
    }
    setTransactions([...transactions, newTransaction])
    e.currentTarget.reset()
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Expense Tracker</h2>
        </div>
        <nav className="mt-6">
          <a href="/" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Dashboard</a>
          <a href="/transactions" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">Transactions</a>
          <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Accounts</a>
          <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Reports</a>
          <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Employees</a>
          <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Attendance</a>
          <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Payroll</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Transaction</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input name="amount" type="number" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input name="description" type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select name="category" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                      <option>Food</option>
                      <option>Transport</option>
                      <option>Utilities</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select name="type" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                      <option>Income</option>
                      <option>Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input name="date" type="date" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account</label>
                    <select name="accountId" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                      <option value="1">Main Account</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Transaction</button>
                  </div>
                </form>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${t.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}