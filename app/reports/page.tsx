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
        const accountsRes = await fetch('/api/accounts')
        if (accountsRes.ok) {
          setAccounts(await accountsRes.json())
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

    const excelData = filteredTransactions.map(t => ({
      'Date': new Date(t.date).toLocaleDateString('en-IN'),
      'Account': t.account?.name || '-',
      'Description': t.description || '-',
      'Category': t.category,
      'Type': t.type,
      'Amount': t.amount
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction Report')
    XLSX.writeFile(wb, `transaction_report_${transStartDate}_to_${transEndDate}.xlsx`)
  }

  // Download Attendance CSV
  const downloadAttendanceExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export')
      return
    }

    let csv = 'Employee Attendance Report\n'
    csv += `Period: ${summary?.startDate} to ${summary?.endDate}\n\n`
    csv += 'Employee Name,Employee Type,Salary Type,Days Worked,OT Hours\n'

    reportData.forEach((row) => {
      csv += `"${row.employeeName}","${row.employeeType}","${row.salaryFrequency}",${row.totalDays},${row.otHours.toFixed(2)}\n`
    })

    csv += `\nTotal Employees,${summary?.totalEmployees || 0}\n`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const filename = `attendance_report_${summary?.startDate}_to_${summary?.endDate}.csv`

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
                  <div className="overflow-x-auto mt-6 border rounded-lg">
                    <table className="w-full min-w-max">
                      <thead className="bg-gray-100 border-b sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Employee Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Employee Type</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Salary Type</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">Days Worked</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">OT Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportData.map((row, idx) => {
                          const prevRow = idx > 0 ? reportData[idx - 1] : null
                          const isGroupChange = !prevRow || row.salaryFrequency !== prevRow.salaryFrequency
                          
                          return (
                            <Fragment key={`row-${idx}`}>
                              {isGroupChange && (
                                <tr className="bg-blue-50 border-t-2 border-gray-300">
                                  <td colSpan={5} className="px-4 py-2 font-bold text-blue-700">
                                    {row.salaryFrequency === 'Monthly' ? '📅 Monthly Wage Employees' : '📆 Daily Wage Employees'}
                                  </td>
                                </tr>
                              )}
                              <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">{row.employeeName}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{row.employeeType}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap inline-block ${row.salaryFrequency === 'Monthly' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {row.salaryFrequency}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{row.totalDays}</td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">{row.otHours.toFixed(2)}</td>
                              </tr>
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
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
