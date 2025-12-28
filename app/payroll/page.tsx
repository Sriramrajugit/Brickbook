'use client'

import { useState, useEffect } from 'react'
import MobileNav from '../components/MobileNav'
import { useAuth } from '../components/AuthProvider'
import { formatINR } from '@/lib/formatters'

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

interface Advance {
  id: number
  employeeId: number
  amount: number
  reason: string | null
  date: string
  employee: {
    id: number
    name: string
    status: string
  }
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
  const [advances, setAdvances] = useState<Advance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [remarks, setRemarks] = useState('')
  
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
        
        // Fetch advances
        const advRes = await fetch('/api/advances')
        if (advRes.ok) {
          const advData = await advRes.json()
          setAdvances(advData)
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
    
    // Calculate advances by employee for the selected period
    const advancesByEmployee = new Map<number, number>()
    
    advances.forEach(adv => {
      const advDate = new Date(adv.date)
      if (advDate >= start && advDate <= end) {
        advancesByEmployee.set(
          adv.employeeId,
          (advancesByEmployee.get(adv.employeeId) || 0) + adv.amount
        )
      }
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
      
      // Use per-day salary directly from employee record
      const dailyRate = employee.salary || 0
      const grossPay = dailyRate * daysWorked
      
      // Get advances for this employee in the period
      const employeeAdvances = advancesByEmployee.get(employee.id) || 0
      const netPay = grossPay - employeeAdvances
      
      // Use first account as default (can be changed later if needed)
      const defaultAccount = accounts[0]
      
      records.push({
        employeeId: employee.id,
        employeeName: employee.name,
        accountId: defaultAccount?.id || 0,
        accountName: defaultAccount?.name || 'No Account',
        daysWorked,
        dailyRate,
        grossPay,
        advances: employeeAdvances,
        netPay
      })
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

  // Save payroll records to database
  const handleSavePayroll = async () => {
    if (!startDate || !endDate) {
      setError('Please select a payroll period')
      return
    }

    if (payrollRecords.length === 0) {
      setError('No payroll records to save')
      return
    }

    try {
      setError('')
      setSaveSuccess(false)
      
      // Save each record
      const savePromises = payrollRecords.map(record => 
        fetch('/api/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: record.employeeId,
            accountId: record.accountId,
            fromDate: startDate,
            toDate: endDate,
            amount: record.netPay,
            remarks: remarks || `${record.employeeName} - ${record.accountName}`
          })
        })
      )

      await Promise.all(savePromises)
      setSaveSuccess(true)
      setRemarks('')
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving payroll:', err)
      setError('Failed to save payroll records')
    }
  }

  const formatPeriod = () => {
    if (!startDate || !endDate) return ''
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/payroll" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
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
                  <p className="text-2xl font-bold text-green-600">Rs {totals.grossPay.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Advances</p>
                  <p className="text-2xl font-bold text-orange-600">Rs {totals.advances.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Net Pay</p>
                  <p className="text-2xl font-bold text-blue-600">Rs {totals.netPay.toFixed(2)}</p>
                </div>
              </div>

              {/* Save Payroll Section */}
              {payrollRecords.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Save Payroll</h3>
                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-700">Payroll records saved successfully!</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g., Weekly payroll for week ending 26/12/2025"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleSavePayroll}
                        className="w-full bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-semibold"
                      >
                        Save Payroll Records
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatINR(record.dailyRate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatINR(record.grossPay)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{formatINR(record.advances)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{formatINR(record.netPay)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" colSpan={2}>TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{totals.daysWorked}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatINR(totals.grossPay)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">{formatINR(totals.advances)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{formatINR(totals.netPay)}</td>
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