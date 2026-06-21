'use client'

import { useState, useEffect, Fragment } from 'react'
import MobileNav from '../components/MobileNav'
import { useAuth } from '../components/AuthProvider'
import { formatINR } from '@/lib/formatters'
import * as XLSX from 'xlsx'

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

interface ReportRow {
  employeeId: number
  employeeName: string
  employeeType: string
  salaryFrequency: string
  totalDays: number
  otHours: number
  dailyAttendance?: { [day: number]: number }
}

interface ReportSummary {
  startDate: string
  endDate: string
  totalEmployees: number
}

export default function Reports() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'transactions' | 'attendance'>('transactions')
  
  // Transaction Report States
  const [transStartDate, setTransStartDate] = useState('')
  const [transEndDate, setTransEndDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedAccount, setSelectedAccount] = useState('All')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transLoading, setTransLoading] = useState(false)
  const [transError, setTransError] = useState('')

  // Attendance Report States
  const [attStartDate, setAttStartDate] = useState('')
  const [attEndDate, setAttEndDate] = useState('')
  const [reportData, setReportData] = useState<ReportRow[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [attLoading, setAttLoading] = useState(false)
  const [attError, setAttError] = useState('')

  // Initialize default dates (last 30 days)
  useEffect(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30)

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    
    setTransStartDate(startStr)
    setTransEndDate(endStr)
    setAttStartDate(startStr)
    setAttEndDate(endStr)
  }, [])

  // Fetch Transaction data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setTransLoading(true)
        const accountsRes = await fetch('/api/accounts/full')
        if (accountsRes.ok) {
          const response = await accountsRes.json()
          // /api/accounts/full returns { data: [...], pagination: {...} }
          setAccounts(response.data || response)
        }

        const transactionsRes = await fetch(`/api/transactions?limit=1000&startDate=${transStartDate}&endDate=${transEndDate}`)
        if (transactionsRes.ok) {
          const result = await transactionsRes.json()
          setTransactions(result.data || [])
        }
      } catch (err) {
        console.error('Error fetching transaction data:', err)
        setTransError('Failed to load transaction data')
      } finally {
        setTransLoading(false)
      }
    }

    if (transStartDate && transEndDate) {
      fetchData()
    }
  }, [transStartDate, transEndDate])

  // Fetch Attendance Report
  const fetchAttendanceReport = async () => {
    if (!attStartDate || !attEndDate) {
      setAttError('Please select both start and end dates')
      return
    }

    setAttLoading(true)
    setAttError('')
    try {
      const response = await fetch(`/api/reports/attendance?startDate=${attStartDate}&endDate=${attEndDate}`, {
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setReportData(data.data || [])
        setSummary(data.summary || null)
      } else {
        const errorMsg = data.error || 'Failed to fetch report'
        setAttError(errorMsg)
        console.error('API Error:', errorMsg)
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setAttError('Error fetching report. Please try again.')
    } finally {
      setAttLoading(false)
    }
  }

  // Helper functions for calendar view
  const getDaysInRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = []
    for (let i = start.getDate(); i <= end.getDate(); i++) {
      days.push(i)
    }
    return days
  }

  const getAttendanceStatus = (status: number | undefined) => {
    if (status === undefined) return '-'
    if (status > 1) return '⚡'
    if (status >= 0.5) return '✓'
    return '✗'
  }

  const getAttendanceColor = (status: number | undefined) => {
    if (status === undefined) return 'bg-gray-50'
    if (status > 1) return 'bg-blue-100'
    if (status >= 0.5) return 'bg-green-100'
    return 'bg-red-100'
  }

  const getOTDays = () => {
    const otDays = new Set<number>()
    reportData.forEach((row) => {
      monthDays.forEach((day) => {
        if (row.dailyAttendance?.[day] && row.dailyAttendance[day] > 1) {
          otDays.add(day)
        }
      })
    })
    return Array.from(otDays).sort((a, b) => a - b)
  }

  const monthDays = getDaysInRange(attStartDate, attEndDate)

  // Transaction Report Calculations
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const start = transStartDate ? new Date(transStartDate) : null
    const end = transEndDate ? new Date(transEndDate) : null

    const dateMatch = (!start || transactionDate >= start) && (!end || transactionDate <= end)
    const categoryMatch = selectedCategory === 'All' || transaction.category === selectedCategory
    const accountMatch = selectedAccount === 'All' || transaction.accountId === Number(selectedAccount)

    return dateMatch && categoryMatch && accountMatch
  })

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Cash-in' || t.type === 'Cash-In')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'Cash-out' || t.type === 'Cash-Out')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = totalIncome - totalExpenses

  const categories = ['All', ...new Set(transactions.map(t => t.category))]

  // Download Transaction Excel
  const downloadTransactionExcel = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export')
      return
    }

    // Calculate running balance for each transaction
    let runningBalance = 0
    const excelData = filteredTransactions.map(t => {
      // Credit for Cash-In, Debit for Cash-Out
      const credit = t.type === 'Cash-In' ? t.amount : 0
      const debit = t.type === 'Cash-Out' ? t.amount : 0
      
      // Update running balance
      runningBalance += credit - debit
      
      return {
        'Date': new Date(t.date).toLocaleDateString('en-IN'),
        'Account': t.account?.name || '-',
        'Description': t.description || '-',
        'Category': t.category,
        'Debit': debit > 0 ? debit : '',
        'Credit': credit > 0 ? credit : '',
        'Balance': runningBalance
      }
    })

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Create data with headers
    const wsData = [
      [user?.name || 'Transaction Report'],
      ['Report Generated: ' + new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN')],
      ['Period: ' + new Date(transStartDate).toLocaleDateString('en-IN') + ' to ' + new Date(transEndDate).toLocaleDateString('en-IN')],
      ['Total Transactions: ' + filteredTransactions.length],
      [], // Empty row for spacing
      // Column headers
      ['Date', 'Account', 'Description', 'Category', 'Debit', 'Credit', 'Balance'],
      // Data rows
      ...excelData.map(row => [
        row['Date'],
        row['Account'],
        row['Description'],
        row['Category'],
        row['Debit'],
        row['Credit'],
        row['Balance']
      ])
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 15 }, // Account
      { wch: 25 }, // Description
      { wch: 15 }, // Category
      { wch: 12 }, // Debit
      { wch: 12 }, // Credit
      { wch: 15 }  // Balance
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Transaction Report')
    XLSX.writeFile(wb, `transaction_report_${transStartDate}_to_${transEndDate}.xlsx`)
  }

  // Download Attendance CSV
  const downloadAttendanceExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export')
      return
    }

    let csv = 'ATTENDANCE REPORT - CALENDAR FORMAT\n'
    csv += `Period: ${summary?.startDate} to ${summary?.endDate}\n`
    csv += `Total Employees: ${summary?.totalEmployees}\n\n`

    // Header row with days
    csv += 'Employee Name,Employee Type,Salary Type,' + monthDays.map(day => day).join(',') + ',Days Worked,OT Hours\n'

    // Data rows
    reportData.forEach((row) => {
      const dayStatuses = monthDays.map(day => {
        const status = row.dailyAttendance?.[day]
        if (status === undefined) return '-'
        if (status >= 1) return '✓'
        if (status > 0 && status < 1) return '◐'
        return '✗'
      }).join(',')

      csv += `"${row.employeeName}","${row.employeeType}","${row.salaryFrequency}",${dayStatuses},${row.totalDays},${row.otHours.toFixed(1)}\n`
    })

    // Footer with totals
    csv += '\n,,,TOTALS,'
    csv += monthDays.map(() => '').join(',')
    csv += `${reportData.reduce((sum, row) => sum + row.totalDays, 0).toFixed(1)},${reportData.reduce((sum, row) => sum + row.otHours, 0).toFixed(1)}\n`

    csv += '\nLegend: ✓ = Present, ⚡ = OT Worked, ✗ = Absent, - = No Record\n'

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const filename = `attendance_report_calendar_${summary?.startDate}_to_${summary?.endDate}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) return <div className="p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <MobileNav currentPage="reports" />
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0 lg:ml-64 w-full">
        <div className="max-w-7xl mx-auto p-4 pt-4">
          <h1 className="text-3xl font-bold mb-2">📊 Reports Dashboard</h1>
          <p className="text-gray-600 mb-6">View and download financial and attendance reports</p>

          {/* Tab Navigation */}
          <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 flex gap-0">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
            >
              💰 Transaction Report
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
            >
              📊 Attendance Report
            </button>
          </div>

          {/* Transaction Report Tab */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-b-lg border border-gray-200">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input type="date" value={transStartDate} onChange={(e) => setTransStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input type="date" value={transEndDate} onChange={(e) => setTransEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2">
                      {categories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account</label>
                    <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2">
                      <option value="All">All Accounts</option>
                      {accounts.map((acc) => ( <option key={acc.id} value={acc.id}>{acc.name}</option> ))}
                    </select>
                  </div>
                </div>

                <button onClick={downloadTransactionExcel} disabled={transLoading || filteredTransactions.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition">
                  📥 Download as Excel
                </button>
                {transError && <p className="text-red-600 text-sm mt-2">{transError}</p>}

                {filteredTransactions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                      <p className="text-gray-600 text-sm">Total Cash In</p>
                      <p className="text-2xl font-bold text-blue-600">{formatINR(totalIncome)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                      <p className="text-gray-600 text-sm">Total Cash Out</p>
                      <p className="text-2xl font-bold text-red-600">{formatINR(totalExpenses)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                      <p className="text-gray-600 text-sm">Net Balance</p>
                      <p className="text-2xl font-bold text-green-600">{formatINR(netBalance)}</p>
                    </div>
                  </div>
                )}

                {filteredTransactions.length > 0 && (
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                          <th className="px-4 py-3 text-left font-semibold">Account</th>
                          <th className="px-4 py-3 text-left font-semibold">Description</th>
                          <th className="px-4 py-3 text-left font-semibold">Category</th>
                          <th className="px-4 py-3 text-center font-semibold">Type</th>
                          <th className="px-4 py-3 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((trans) => (
                          <tr key={trans.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">{new Date(trans.date).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3">{trans.account?.name || '-'}</td>
                            <td className="px-4 py-3">{trans.description || '-'}</td>
                            <td className="px-4 py-3">{trans.category}</td>
                            <td className="px-4 py-3 text-center text-sm font-medium">{trans.type}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatINR(trans.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!transLoading && filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No transactions found for the selected criteria</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Report Tab */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-b-lg border border-gray-200">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input type="date" value={attStartDate} onChange={(e) => setAttStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input type="date" value={attEndDate} onChange={(e) => setAttEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={fetchAttendanceReport} disabled={attLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:opacity-50 transition">
                    {attLoading ? '⏳ Loading...' : '🔍 Generate Report'}
                  </button>
                  <button onClick={downloadAttendanceExcel} disabled={!summary || attLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg disabled:opacity-50 transition">
                    📥 Download CSV
                  </button>
                </div>
                {attError && <p className="text-red-600 text-sm mt-3">{attError}</p>}

                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-gray-600 text-sm">Period</p>
                      <p className="text-xl font-bold">{summary.startDate} to {summary.endDate}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-gray-600 text-sm">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</p>
                    </div>
                  </div>
                )}

                {reportData.length > 0 && (
                  <div className="mt-6 border rounded-lg bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="border border-gray-300 px-2 py-1 text-left font-bold sticky left-0 bg-gray-100 z-10" style={{ minWidth: '100px' }}>
                              Employee
                            </th>
                            <th className="border border-gray-300 px-1 py-1 text-left font-bold" style={{ minWidth: '60px' }}>
                              Type
                            </th>
                            <th className="border border-gray-300 px-1 py-1 text-left font-bold" style={{ minWidth: '55px' }}>
                              Salary
                            </th>
                            {/* Day headers */}
                            {monthDays.map((day) => (
                              <th
                                key={`header-${day}`}
                                className="border border-gray-300 px-0.5 py-1 text-center font-semibold text-xs bg-blue-50"
                                style={{ minWidth: '24px', width: '24px' }}
                              >
                                {day}
                              </th>
                            ))}
                            <th className="border border-gray-300 px-1 py-1 text-center font-bold sticky right-[45px] bg-gray-100 z-10" style={{ minWidth: '50px' }}>
                              Days
                            </th>
                            <th className="border border-gray-300 px-1 py-1 text-center font-bold sticky right-0 bg-gray-100 z-10" style={{ minWidth: '45px' }}>
                              OT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-300 px-2 py-1 font-semibold text-xs sticky left-0 z-10" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                                {row.employeeName.substring(0, 12)}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-xs truncate">
                                {row.employeeType.substring(0, 8)}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-xs text-center font-bold text-blue-600">
                                {row.salaryFrequency === 'Monthly' ? 'M' : 'D'}
                              </td>
                              {/* Day cells */}
                              {monthDays.map((day) => (
                                <td
                                  key={`${row.employeeId}-${day}`}
                                  className={`border border-gray-300 px-0.5 py-0.5 text-center font-bold text-sm ${getAttendanceColor(row.dailyAttendance?.[day])}`}
                                  style={{ minWidth: '24px', width: '24px' }}
                                >
                                  {getAttendanceStatus(row.dailyAttendance?.[day])}
                                </td>
                              ))}
                              <td className="border border-gray-300 px-1 py-1 text-center font-bold text-xs sticky right-[45px] z-10" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                                {row.totalDays}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center font-bold text-xs sticky right-0 z-10" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                                {row.otHours.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-50 border-t-2 border-gray-300">
                          <tr>
                            <td colSpan={3} className="border border-gray-300 px-2 py-1 font-bold text-right text-xs">
                              TOTAL:
                            </td>
                            {monthDays.map((day) => (
                              <td key={`total-${day}`} className="border border-gray-300 px-0.5 py-1 text-center bg-blue-50" style={{ minWidth: '24px' }} />
                            ))}
                            <td className="border border-gray-300 px-1 py-1 text-center font-bold sticky right-[45px] z-10 bg-blue-50 text-xs">
                              {reportData.reduce((sum, row) => sum + row.totalDays, 0).toFixed(1)}
                            </td>
                            <td className="border border-gray-300 px-1 py-1 text-center font-bold sticky right-0 z-10 bg-blue-50 text-xs">
                              {reportData.reduce((sum, row) => sum + row.otHours, 0).toFixed(1)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs space-y-1">
                      <p className="text-gray-700">
                        <strong>Legend:</strong> ✓ = Present, ⚡ = OT Worked, ✗ = Absent, - = No Record | M = Monthly, D = Daily
                      </p>
                      {getOTDays().length > 0 && (
                        <p className="text-gray-700">
                          <strong>Days with OT:</strong> {getOTDays().join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!summary && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center mt-6">
                    <p className="text-gray-500 text-lg">📋 Select dates and click "Generate Report" to view data</p>
                  </div>
                )}

                {summary && reportData.length === 0 && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center mt-6">
                    <p className="text-gray-500 text-lg">No data found for the selected period</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
