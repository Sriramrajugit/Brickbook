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
  startDate?: string | null
  endDate?: string | null
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
  const [validationErrors, setValidationErrors] = useState<string[]>([])

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

  // Validate date range against selected account
  useEffect(() => {
    const errors: string[] = []

    if (selectedAccount !== 'All' && (startDate || endDate)) {
      const selectedAcctData = accounts.find(a => a.id === Number(selectedAccount))
      
      if (selectedAcctData) {
        // Check if report start date is before account start date
        if (selectedAcctData.startDate && startDate) {
          const reportStart = new Date(startDate)
          const accountStart = new Date(selectedAcctData.startDate)
          if (reportStart < accountStart) {
            errors.push(`Report start date (${startDate}) cannot be before account start date (${selectedAcctData.startDate.split('T')[0]})`)
          }
        }

        // Check if report end date is after account end date
        if (selectedAcctData.endDate && endDate) {
          const reportEnd = new Date(endDate)
          const accountEnd = new Date(selectedAcctData.endDate)
          if (reportEnd > accountEnd) {
            errors.push(`Report end date (${endDate}) cannot be after account end date (${selectedAcctData.endDate.split('T')[0]})`)
          }
        }
      }
    }

    setValidationErrors(errors)
  }, [startDate, endDate, selectedAccount, accounts])

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
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let currentY = 10
    
    // Get account name
    const selectedAccountName = selectedAccount !== 'All' 
      ? accounts.find(a => a.id === Number(selectedAccount))?.name 
      : 'All Accounts'
    
    // Header (BrickBook - Financial Management) - top right, small
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 0, 0) // Red color
    const headerText = 'BrickBook - Financial Management'
    doc.text(headerText, pageWidth - 30, currentY, { align: 'right' })
    doc.setTextColor(0, 0, 0) // Back to black
    
    currentY += 8
    
    // Title: "AccountName - Transaction Summary Report" (centered)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const titleText = `${selectedAccountName} - Transaction Summary Report`
    const titleWidth = doc.getTextWidth(titleText)
    doc.text(titleText, (pageWidth - titleWidth) / 2, currentY)
    currentY += 8
    
    // Date Range and Generated On (centered)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    let dateRangeText = ''
    if (startDate && endDate) {
      dateRangeText = `From Date: ${startDate} | To Date: ${endDate}`
    } else if (startDate) {
      dateRangeText = `From Date: ${startDate}`
    } else if (endDate) {
      dateRangeText = `To Date: ${endDate}`
    }
    
    if (dateRangeText) {
      const dateWidth = doc.getTextWidth(dateRangeText)
      doc.text(dateRangeText, (pageWidth - dateWidth) / 2, currentY)
      currentY += 5
    }
    
    const generatedText = `Generated On: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`
    const generatedWidth = doc.getTextWidth(generatedText)
    doc.text(generatedText, (pageWidth - generatedWidth) / 2, currentY)
    currentY += 5
    
    // Horizontal line
    doc.setDrawColor(0, 0, 0)
    doc.line(10, currentY, pageWidth - 10, currentY)
    currentY += 6
    
    // Transaction Summary header
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction Summary', 14, currentY)
    currentY += 6
    
    // Summary Table with Total Cash In, Total Cash Out, Net Balance
    const summaryTableData = [
      ['Total Cash In', 'Total Cash Out', 'Net Balance'],
      [`Rs ${totalIncome.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
           `Rs ${totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
           `Rs ${netBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
    ]
    
    autoTable(doc, {
      head: summaryTableData.slice(0, 1),
      body: summaryTableData.slice(1),
      startY: currentY,
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        halign: 'center'
      },
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        fillColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 }
      },
      margin: { left: 14, right: 14 }
    })
    
    currentY = (doc as any).lastAutoTable.finalY + 3
    
    // Horizontal line
    doc.setDrawColor(0, 0, 0)
    doc.line(10, currentY, pageWidth - 10, currentY)
    currentY += 6
    
    // Transactions table
    if (filteredTransactions.length > 0) {
      const tableData = filteredTransactions.map((t, index) => [
        (index + 1).toString(), // #
        new Date(t.date).toLocaleDateString('en-IN'),
        t.category,
        t.description || '-',
        t.type,
        t.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ])

      autoTable(doc, {
        head: [['#', 'Date', 'Category', 'Description', 'Transaction Type', 'Amount']],
        body: tableData,
        startY: currentY,
        styles: { 
          fontSize: 9, 
          cellPadding: 3,
          halign: 'left'
        },
        headStyles: { 
          fillColor: [100, 149, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fillColor: [255, 255, 255]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 22 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30 },
          5: { cellWidth: 25, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      })
    }
    
    // Footer with page numbers (left aligned)
    const totalPages = (doc as any).internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(9)
      doc.text(
        `Page ${i}/${totalPages}`,
        14,
        pageHeight - 8
      )
    }
    
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

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      {validationErrors.map((err, idx) => (
                        <p key={idx} className="text-sm text-red-700 mb-1">
                          ⚠️ {err}
                        </p>
                      ))}
                    </div>
                  </div>
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

              {/* Category Breakdown & Bar Chart - 50/50 Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Category Breakdown Table */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(categoryBreakdown).map(([category, amounts]) => (
                      <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="font-medium text-sm">{category}</span>
                        <div className="flex gap-4">
                          {amounts.income > 0 && (
                            <span className="text-green-600 text-sm">+{formatINR(amounts.income)}</span>
                          )}
                          {amounts.expense > 0 && (
                            <span className="text-red-600 text-sm">-{formatINR(amounts.expense)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {Object.keys(categoryBreakdown).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No transactions found for the selected filters.</p>
                    )}
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Amount by Category</h3>
                  <div className="flex flex-col justify-center h-80">
                    {Object.keys(categoryBreakdown).length > 0 ? (
                      <div className="flex items-end justify-around h-full gap-2">
                        {Object.entries(categoryBreakdown)
                          .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
                          .slice(0, 8)
                          .map(([category, amounts], index) => {
                          // Calculate max amount across all categories
                          const maxAmount = Math.max(
                            ...Object.entries(categoryBreakdown).map(([_, a]) => a.income + a.expense)
                          );
                          const totalAmount = amounts.income + amounts.expense;
                          const barHeight = (totalAmount / maxAmount) * 100;
                          
                          // Color varies based on whether income or expense
                          const colors = [
                            'from-blue-500 to-blue-400',
                            'from-green-500 to-green-400',
                            'from-purple-500 to-purple-400',
                            'from-orange-500 to-orange-400',
                            'from-pink-500 to-pink-400',
                            'from-indigo-500 to-indigo-400',
                            'from-cyan-500 to-cyan-400',
                            'from-teal-500 to-teal-400'
                          ];
                          const colorClass = colors[index % colors.length];
                          
                          return (
                            <div key={category} className="flex flex-col items-center gap-2 flex-1">
                              <div className={`w-full bg-gradient-to-t ${colorClass} rounded-t transition-all duration-300`} style={{ height: `${Math.max(barHeight, 2)}px`, minHeight: '2px' }}></div>
                              <span className="text-xs text-gray-600 text-center truncate w-full" title={category}>
                                {category.slice(0, 8)}
                              </span>
                              <span className="text-xs font-medium text-gray-700">{formatINR(totalAmount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No data available</p>
                    )}
                  </div>
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