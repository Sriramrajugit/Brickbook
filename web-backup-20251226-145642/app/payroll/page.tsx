'use client'

import { useState, useEffect } from 'react'

interface Account {
  id: number
  name: string
}

interface Employee {
  id: number
  name: string
  salary: number | null
  status: string
}

interface Attendance {
  id: number
  employeeId: number
  date: string
  status: string
}

interface Transaction {
  id: number
  amount: number
  description: string | null
  category: string
  type: string
  date: string
  accountId?: number
}

interface PayrollRecord {
  employeeId: number
  employeeName: string
  accountId: number
  accountName: string
  daysWorked: number
  dailyRate: number
  grossPay: number
  advances: number
  netPay: number
}

export default function Payroll() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('All')
  
  // Set default to current week (Monday to Saturday)
  useEffect(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate Monday of current week
    const monday = new Date(today)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days
    monday.setDate(today.getDate() + diff)
    
    // Calculate Saturday of current week
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)
    
    setStartDate(monday.toISOString().split('T')[0])
    setEndDate(saturday.toISOString().split('T')[0])
  }, [])

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch accounts
        const accRes = await fetch('/api/accounts')
        if (accRes.ok) {
          const accData = await accRes.json()
          setAccounts(accData)
        }
        
        // Fetch employees
        const empRes = await fetch('/api/employees')
        if (empRes.ok) {
          const empData = await empRes.json()
          setEmployees(empData.filter((e: Employee) => e.status === 'Active'))
        }
        
        // Fetch attendance
        const attRes = await fetch('/api/attendance')
        if (attRes.ok) {
          const attData = await attRes.json()
          setAttendance(attData)
        }
        
        // Fetch transactions (for advances)
        const txnRes = await fetch('/api/transactions')
        if (txnRes.ok) {
          const txnData = await txnRes.json()
          setTransactions(txnData)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate payroll for the selected period
  const calculatePayroll = (): PayrollRecord[] => {
    if (!startDate || !endDate) return []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Group transactions by employee and account
    const advancesByEmployeeAccount = new Map<string, number>()
    
    transactions.forEach(txn => {
      if (txn.category === 'Salary Advance' &&
          new Date(txn.date) >= start &&
          new Date(txn.date) <= end) {
        
        employees.forEach(emp => {
          if (txn.description?.toLowerCase().includes(emp.name.toLowerCase())) {
            const key = `${emp.id}-${txn.accountId || 0}`
            advancesByEmployeeAccount.set(key, (advancesByEmployeeAccount.get(key) || 0) + txn.amount)
          }
        })
      }
    })
    
    // Get unique accounts from transactions
    const accountsInTransactions = new Set<number>()
    transactions.forEach(txn => {
      if (txn.accountId) accountsInTransactions.add(txn.accountId)
    })
    
    // Create payroll records for each employee-account combination
    const records: PayrollRecord[] = []
    
    employees.forEach(employee => {
      // Count days worked (Present status) in the period
      const daysWorked = attendance.filter(att => {
        const attDate = new Date(att.date)
        return att.employeeId === employee.id && 
               att.status === 'Present' &&
               attDate >= start && 
               attDate <= end
      }).length
      
      // Calculate daily rate from monthly salary (assuming 26 working days per month)
      const dailyRate = employee.salary ? employee.salary / 26 : 0
      const grossPay = dailyRate * daysWorked
      
      // If employee has transactions, create records per account
      const employeeAccounts = Array.from(accountsInTransactions).filter(accId => {
        const key = `${employee.id}-${accId}`
        return advancesByEmployeeAccount.has(key)
      })
      
      if (employeeAccounts.length > 0) {
        employeeAccounts.forEach(accId => {
          const account = accounts.find(a => a.id === accId)
          const key = `${employee.id}-${accId}`
          const advances = advancesByEmployeeAccount.get(key) || 0
          const netPay = grossPay - advances
          
          records.push({
            employeeId: employee.id,
            employeeName: employee.name,
            accountId: accId,
            accountName: account?.name || 'Unknown',
            daysWorked,
            dailyRate,
            grossPay,
            advances,
            netPay
          })
        })
      } else {
        // If no transactions, show with first account or "No Account"
        const defaultAccount = accounts[0]
        records.push({
          employeeId: employee.id,
          employeeName: employee.name,
          accountId: defaultAccount?.id || 0,
          accountName: defaultAccount?.name || 'No Account',
          daysWorked,
          dailyRate,
          grossPay,
          advances: 0,
          netPay: grossPay
        })
      }
    })
    
    // Filter by selected account if not "All"
    if (selectedAccount !== 'All') {
      return records.filter(r => r.accountId === Number(selectedAccount))
    }
    
    return records
  }

  const payrollRecords = calculatePayroll()
  
  // Calculate totals
  const totals = payrollRecords.reduce((acc, record) => ({
    daysWorked: acc.daysWorked + record.daysWorked,
    grossPay: acc.grossPay + record.grossPay,
    advances: acc.advances + record.advances,
    netPay: acc.netPay + record.netPay
  }), { daysWorked: 0, grossPay: 0, advances: 0, netPay: 0 })

  const formatPeriod = () => {
    if (!startDate || !endDate) return ''
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
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
          <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Accounts</a>
          <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Employees</a>
          <a href="/transactions" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Transactions</a>
          <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Attendance</a>
          <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">Payroll</a>
          <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Reports</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {loading && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <p className="text-gray-600 text-center">Loading payroll data...</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg shadow mb-6">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Date Filter */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Period (Monday - Saturday)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account/Project</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date (Monday)</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date (Saturday)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const today = new Date()
                        const dayOfWeek = today.getDay()
                        const monday = new Date(today)
                        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
                        monday.setDate(today.getDate() + diff)
                        const saturday = new Date(monday)
                        saturday.setDate(monday.getDate() + 5)
                        setStartDate(monday.toISOString().split('T')[0])
                        setEndDate(saturday.toISOString().split('T')[0])
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Current Week
                    </button>
                  </div>
                </div>
                {startDate && endDate && (
                  <p className="mt-4 text-sm text-gray-600">
                    Period: <span className="font-semibold">{formatPeriod()}</span> ({Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                  </p>
                )}
              </div>

              {/* Payroll Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Days Worked</p>
                  <p className="text-2xl font-bold text-gray-900">{totals.daysWorked}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Gross Pay</p>
                  <p className="text-2xl font-bold text-green-600">${totals.grossPay.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Advances</p>
                  <p className="text-2xl font-bold text-orange-600">${totals.advances.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Net Pay</p>
                  <p className="text-2xl font-bold text-blue-600">${totals.netPay.toFixed(2)}</p>
                </div>
              </div>

              {/* Payroll Records */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Records</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account/Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advances</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payrollRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            No payroll records found. Please select a date range.
                          </td>
                        </tr>
                      ) : (
                        payrollRecords.map((record, index) => (
                          <tr key={`${record.employeeId}-${record.accountId}-${index}`} className={record.daysWorked === 0 ? 'bg-gray-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.employeeName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.accountName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.daysWorked}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.dailyRate.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.grossPay.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">${record.advances.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">${record.netPay.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" colSpan={2}>TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{totals.daysWorked}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${totals.grossPay.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">${totals.advances.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">${totals.netPay.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}