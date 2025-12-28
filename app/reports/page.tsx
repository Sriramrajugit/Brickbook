'use client'

import { useState, useEffect } from 'react'
import MobileNav from '../components/MobileNav'
import { useAuth } from '../components/AuthProvider'
import { formatINR } from '@/lib/formatters'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  accountId?: number
  account?: { name: string }
}

export default function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedAccount, setSelectedAccount] = useState('All')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch accounts and transactions from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch accounts
        const accountsRes = await fetch('/api/accounts')
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json()
          setAccounts(accountsData)
        } else {
          setAccounts([
            { id: 1, name: 'Main Account', balance: 50.00, type: 'Checking' },
            { id: 2, name: 'Savings', balance: 1000.00, type: 'Savings' }
          ])
        }

        // Fetch transactions
        const transactionsRes = await fetch('/api/transactions?limit=1000')
        if (transactionsRes.ok) {
          const transactionsResult = await transactionsRes.json()
          // API now returns { data: [...], pagination: {...} }
          setTransactions(transactionsResult.data || [])
        } else {
          // Fallback to sample data if API fails
          setTransactions([
            { id: 1, amount: 50.00, description: 'Lunch', category: 'Food', type: 'Expense', date: '2025-12-20', accountId: 1, account: { name: 'Main Account' } },
            { id: 2, amount: 100.00, description: 'Salary', category: 'Income', type: 'Income', date: '2025-12-20', accountId: 1, account: { name: 'Main Account' } },
            { id: 3, amount: 25.00, description: 'Bus fare', category: 'Transport', type: 'Expense', date: '2025-12-21', accountId: 1, account: { name: 'Main Account' } },
            { id: 4, amount: 75.00, description: 'Freelance work', category: 'Income', type: 'Income', date: '2025-12-22', accountId: 2, account: { name: 'Savings' } },
            { id: 5, amount: 30.00, description: 'Groceries', category: 'Food', type: 'Expense', date: '2025-12-23', accountId: 1, account: { name: 'Main Account' } }
          ])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
        // Use fallback data
        setAccounts([
          { id: 1, name: 'Main Account', balance: 50.00, type: 'Checking' },
          { id: 2, name: 'Savings', balance: 1000.00, type: 'Savings' }
        ])
        setTransactions([
          { id: 1, amount: 50.00, description: 'Lunch', category: 'Food', type: 'Expense', date: '2025-12-20', accountId: 1, account: { name: 'Main Account' } },
          { id: 2, amount: 100.00, description: 'Salary', category: 'Income', type: 'Income', date: '2025-12-20', accountId: 1, account: { name: 'Main Account' } },
          { id: 3, amount: 25.00, description: 'Bus fare', category: 'Transport', type: 'Expense', date: '2025-12-21', accountId: 1, account: { name: 'Main Account' } },
          { id: 4, amount: 75.00, description: 'Freelance work', category: 'Income', type: 'Income', date: '2025-12-22', accountId: 2, account: { name: 'Savings' } },
          { id: 5, amount: 30.00, description: 'Groceries', category: 'Food', type: 'Expense', date: '2025-12-23', accountId: 1, account: { name: 'Main Account' } }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter transactions based on date, category, and account
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    const dateMatch = (!start || transactionDate >= start) && (!end || transactionDate <= end)
    const categoryMatch = selectedCategory === 'All' || transaction.category === selectedCategory
    const accountMatch = selectedAccount === 'All' || transaction.accountId === Number(selectedAccount)

    return dateMatch && categoryMatch && accountMatch
  })

  // Calculate totals from filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Cash-in' || t.type === 'Cash-In')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'Cash-out' || t.type === 'Cash-Out')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = totalIncome - totalExpenses

  // Get category breakdown
  const categoryBreakdown = filteredTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { income: 0, expense: 0 }
    }
    if (transaction.type === 'Cash-in' || transaction.type === 'Cash-In') {
      acc[transaction.category].income += transaction.amount
    } else if (transaction.type === 'Cash-out' || transaction.type === 'Cash-Out') {
      acc[transaction.category].expense += transaction.amount
    }
    return acc
  }, {} as Record<string, { income: number, expense: number }>)

  // Get unique categories from actual data
  const categories = ['All', ...new Set(transactions.map(t => t.category))]

  // Download as Excel
  const downloadExcel = () => {
    // Prepare data for Excel
    const excelData = filteredTransactions.map(t => ({
      'Date': new Date(t.date).toLocaleDateString('en-IN'),
      'Account': t.account?.name || (accounts.find(a => a.id === t.accountId)?.name || '-'),
      'Description': t.description || '-',
      'Category': t.category,
      'Type': t.type,
      'Amount': t.amount
    }))

    // Add summary rows
    const summaryData = [
      {},
      { 'Date': 'SUMMARY', 'Account': '', 'Description': '', 'Category': '', 'Type': '', 'Amount': '' },
      { 'Date': 'Total Income', 'Account': '', 'Description': '', 'Category': '', 'Type': '', 'Amount': totalIncome },
      { 'Date': 'Total Expenses', 'Account': '', 'Description': '', 'Category': '', 'Type': '', 'Amount': totalExpenses },
      { 'Date': 'Net Balance', 'Account': '', 'Description': '', 'Category': '', 'Type': '', 'Amount': netBalance }
    ]

    const finalData = [...excelData, ...summaryData]

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(finalData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions Report')

    // Generate filename with date range
    const filename = `Transactions_Report_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`
    
    // Download
    XLSX.writeFile(wb, filename)
  }

  // Download as PDF
  const downloadPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(18)
    doc.text('Transactions Report', 14, 20)
    
    // Report info
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30)
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 36)
    }
    if (selectedCategory !== 'All') {
      doc.text(`Category: ${selectedCategory}`, 14, 42)
    }
    if (selectedAccount !== 'All') {
      const account = accounts.find(a => a.id === Number(selectedAccount))
      doc.text(`Account: ${account?.name || '-'}`, 14, 48)
    }

    // Summary section
    const summaryY = (selectedCategory !== 'All' || selectedAccount !== 'All') ? 56 : 50
    doc.setFontSize(12)
    doc.text('Summary', 14, summaryY)
    
    doc.setFontSize(10)
    doc.text(`Total Income: ${formatINR(totalIncome)}`, 14, summaryY + 6)
    doc.text(`Total Expenses: ${formatINR(totalExpenses)}`, 14, summaryY + 12)
    doc.text(`Net Balance: ${formatINR(netBalance)}`, 14, summaryY + 18)

    // Transactions table
    const tableData = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('en-IN'),
      t.account?.name || (accounts.find(a => a.id === t.accountId)?.name || '-'),
      t.description || '-',
      t.category,
      t.type,
      formatINR(t.amount)
    ])

    autoTable(doc, {
      head: [['Date', 'Account', 'Description', 'Category', 'Type', 'Amount']],
      body: tableData,
      startY: summaryY + 26,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { top: 10 }
    })

    // Save PDF
    const filename = `Transactions_Report_${startDate || 'all'}_to_${endDate || 'all'}.pdf`
    doc.save(filename)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/reports" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {loading && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <p className="text-gray-600 text-center">Loading transaction data...</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg shadow mb-6">
                  <p className="text-red-700">{error} (Using sample data)</p>
                </div>
              )}

              {/* Filters */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Accounts</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {['All', ...new Set(transactions.map(t => t.category))].map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                      setSelectedCategory('All')
                      setSelectedAccount('All')
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={downloadExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Excel
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Download PDF
                  </button>
                  <span className="text-sm text-gray-600 self-center ml-auto">
                    Showing {filteredTransactions.length} transactions
                  </span>
                </div>
              </div>

              {/* Report Summary */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Cash in</p>
                    <p className="text-2xl font-bold text-green-600">{formatINR(totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cash-out</p>
                    <p className="text-2xl font-bold text-red-600">{formatINR(totalExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Balance</p>
                    <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatINR(netBalance)}
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
                          <span className="text-green-600">+{formatINR(amounts.income)}</span>
                        )}
                        {amounts.expense > 0 && (
                          <span className="text-red-600">-{formatINR(amounts.expense)}</span>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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
                              {transaction.account?.name || (accounts.find(a => a.id === transaction.accountId)?.name || '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatINR(transaction.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                (transaction.type === 'Cash-in' || transaction.type === 'Cash-In') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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