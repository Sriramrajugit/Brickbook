'use client'

import { useState } from 'react'

export default function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Sample transaction data for filtering
  const allTransactions = [
    { id: 1, amount: 50.00, description: 'Lunch', category: 'Food', type: 'Expense', date: '2025-12-20' },
    { id: 2, amount: 100.00, description: 'Salary', category: 'Income', type: 'Income', date: '2025-12-20' },
    { id: 3, amount: 25.00, description: 'Bus fare', category: 'Transport', type: 'Expense', date: '2025-12-21' },
    { id: 4, amount: 75.00, description: 'Freelance work', category: 'Income', type: 'Income', date: '2025-12-22' },
    { id: 5, amount: 30.00, description: 'Groceries', category: 'Food', type: 'Expense', date: '2025-12-23' }
  ]

  // Filter transactions based on date and category
  const filteredTransactions = allTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    const dateMatch = (!start || transactionDate >= start) && (!end || transactionDate <= end)
    const categoryMatch = selectedCategory === 'All' || transaction.category === selectedCategory

    return dateMatch && categoryMatch
  })

  // Calculate totals from filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = totalIncome - totalExpenses

  // Get category breakdown
  const categoryBreakdown = filteredTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { income: 0, expense: 0 }
    }
    if (transaction.type === 'Income') {
      acc[transaction.category].income += transaction.amount
    } else {
      acc[transaction.category].expense += transaction.amount
    }
    return acc
  }, {} as Record<string, { income: number, expense: number }>)

  const categories = ['All', 'Food', 'Transport', 'Income', 'Other']

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Expense Tracker</h2>
        </div>
        <nav className="mt-6">
          <a href="/" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Dashboard</a>
          <a href="/transactions" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Transactions</a>
          <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Accounts</a>
          <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">Reports</a>
          <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Employees</a>
          <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Attendance</a>
          <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Payroll</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Filters */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                      setSelectedCategory('All')
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                  <span className="text-sm text-gray-600 self-center">
                    Showing {filteredTransactions.length} transactions
                  </span>
                </div>
              </div>

              {/* Report Summary */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Balance</p>
                    <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ${netBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(categoryBreakdown).map(([category, amounts]) => (
                    <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="font-medium">{category}</span>
                      <div className="flex gap-4">
                        {amounts.income > 0 && (
                          <span className="text-green-600">+${amounts.income.toFixed(2)}</span>
                        )}
                        {amounts.expense > 0 && (
                          <span className="text-red-600">-${amounts.expense.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {Object.keys(categoryBreakdown).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No transactions found for the selected filters.</p>
                  )}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
                <div className="overflow-x-auto">
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
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No transactions found for the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${transaction.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}