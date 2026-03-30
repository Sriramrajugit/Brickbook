'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import MobileNav from '@/app/components/MobileNav'
import { formatINR } from '@/lib/formatters'

interface ReportRow {
  employeeId: number
  employeeName: string
  salary: number
  salaryFrequency: string
  totalDays: number
  otHours: number
  totalSalary: number
}

interface ReportSummary {
  startDate: string
  endDate: string
  totalEmployees: number
  totalPayroll: number
}

export default function AttendanceReportPage() {
  const { user, isLoading } = useAuth()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportData, setReportData] = useState<ReportRow[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Set default dates (last 30 days)
  useEffect(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30)

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setReportData(data.data)
        setSummary(data.summary)
      } else {
        setError('Failed to fetch report')
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setError('Error fetching report')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export')
      return
    }

    // Create CSV content
    let csv = 'Employee Summary Report\n'
    csv += `Period: ${summary?.startDate} to ${summary?.endDate}\n\n`
    csv += 'Employee Name,Monthly Salary,Total Days Worked,OT Hours,Total Salary Paid\n'

    reportData.forEach((row) => {
      csv += `"${row.employeeName}",${row.salary},${row.totalDays},${row.otHours},${row.totalSalary}\n`
    })

    csv += `\nTotal Payroll,${summary?.totalPayroll || 0}\n`
    csv += `Total Employees,${summary?.totalEmployees || 0}\n`

    // Create blob and download
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
    <div className="min-h-screen bg-gray-50">
      <MobileNav />
      <div className="lg:ml-64 w-full">
        <div className="max-w-7xl mx-auto p-4 pt-4">
          <h1 className="text-3xl font-bold mb-2">📊 Attendance & Salary Report</h1>
          <p className="text-gray-600 mb-6">View and download employee attendance summary with salary information</p>

          {/* Filter Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:opacity-50 transition"
              >
                {loading ? '⏳ Loading...' : '🔍 Generate Report'}
              </button>
              <button
                onClick={exportToExcel}
                disabled={!summary || loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg disabled:opacity-50 transition"
              >
                📥 Download CSV
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-gray-600 text-sm">Period</p>
                <p className="text-xl font-bold">
                  {summary.startDate} to {summary.endDate}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-gray-600 text-sm">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-gray-600 text-sm">Total Payroll</p>
                <p className="text-2xl font-bold text-green-600">{formatINR(summary.totalPayroll)}</p>
              </div>
            </div>
          )}

          {/* Report Table */}
          {reportData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Employee Name</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Monthly Salary</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Days Worked</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">OT Hours</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Salary Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{row.employeeName}</td>
                      <td className="px-4 py-3 text-right">{formatINR(row.salary)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{row.totalDays}</td>
                      <td className="px-4 py-3 text-right">{row.otHours.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatINR(row.totalSalary)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold">
                      TOTAL PAYROLL:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">
                      {formatINR(summary?.totalPayroll || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {!summary && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-lg">📋 Select dates and click "Generate Report" to view data</p>
            </div>
          )}

          {summary && reportData.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-lg">No data found for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
