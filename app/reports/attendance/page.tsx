'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import MobileNav from '@/app/components/MobileNav'
import { formatINR } from '@/lib/formatters'

interface ReportRow {
  employeeId: number
  employeeName: string
  employeeType: string
  salaryFrequency: string
  totalDays: number
  otHours: number
  dailyAttendance: { [day: number]: number }
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

  const getDaysInMonth = (startDate: string, endDate: string) => {
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
    if (status >= 1) return '✓'
    if (status > 0 && status < 1) return '◐'
    return '✗'
  }

  const getAttendanceColor = (status: number | undefined) => {
    if (status === undefined) return 'bg-gray-50'
    if (status >= 1) return 'bg-green-100'
    if (status > 0 && status < 1) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const monthDays = getDaysInMonth(startDate, endDate)

  const exportToExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export')
      return
    }

    // Create CSV content with calendar format
    let csv = 'ATTENDANCE REPORT - CALENDAR FORMAT\n'
    csv += `Period: ${summary?.startDate} to ${summary?.endDate}\n`
    csv += `Total Employees: ${summary?.totalEmployees}\n\n`

    // Header row with days
    csv += 'Employee Name,Employee Type,Salary Type,' + monthDays.map(day => day).join(',') + ',Days Worked,OT Hours\n'

    // Data rows
    reportData.forEach((row) => {
      const dayStatuses = monthDays.map(day => {
        const status = row.dailyAttendance[day]
        if (status === undefined) return '-'
        if (status >= 1) return '✓'
        if (status > 0 && status < 1) return '◐'
        return '✗'
      }).join(',')

      csv += `"${row.employeeName}","${row.employeeType}","${row.salaryFrequency}",${dayStatuses},${row.totalDays},${row.otHours}\n`
    })

    // Footer with totals
    csv += '\n,,,TOTALS,'
    csv += monthDays.map(() => '').join(',')
    csv += `${reportData.reduce((sum, row) => sum + row.totalDays, 0).toFixed(1)},${reportData.reduce((sum, row) => sum + row.otHours, 0).toFixed(1)}\n`

    csv += '\nLegend: ✓ = Present, ◐ = Half Day, ✗ = Absent, - = No Record\n'

    // Create blob and download
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
    <div className="min-h-screen bg-gray-50">
      <MobileNav currentPage="reports" />
      <div className="lg:ml-64 w-full">
        <div className="max-w-7xl mx-auto p-4 pt-4">
          <h1 className="text-3xl font-bold mb-2">📊 Attendance Report - Calendar View</h1>
          <p className="text-gray-600 mb-6">View employee attendance in calendar format with daily breakdown and totals</p>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            </div>
          )}

          {/* Report Calendar - NEW FORMAT */}
          {reportData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="border border-gray-300 px-3 py-2 text-left font-bold sticky left-0 bg-gray-100 z-10" style={{ minWidth: '150px' }}>
                      Employee Name
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-bold" style={{ minWidth: '90px' }}>
                      Employee Type
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-bold" style={{ minWidth: '80px' }}>
                      Salary Type
                    </th>
                    {/* Day headers */}
                    {monthDays.map((day) => (
                      <th
                        key={`header-${day}`}
                        className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs bg-blue-50"
                        style={{ minWidth: '30px' }}
                      >
                        {day}
                      </th>
                    ))}
                    <th className="border border-gray-300 px-2 py-2 text-center font-bold sticky right-[60px] bg-gray-100 z-10" style={{ minWidth: '80px' }}>
                      Days Worked
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-bold sticky right-0 bg-gray-100 z-10" style={{ minWidth: '60px' }}>
                      OT Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2 font-semibold sticky left-0 z-10" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                        {row.employeeName}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        {row.employeeType}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        {row.salaryFrequency === 'Monthly' ? '📅 Monthly' : '📆 Daily'}
                      </td>
                      {/* Day cells */}
                      {monthDays.map((day) => (
                        <td
                          key={`${row.employeeId}-${day}`}
                          className={`border border-gray-300 px-1 py-2 text-center font-bold text-lg ${getAttendanceColor(row.dailyAttendance[day])}`}
                        >
                          {getAttendanceStatus(row.dailyAttendance[day])}
                        </td>
                      ))}
                      <td className="border border-gray-300 px-2 py-2 text-center font-bold sticky right-[60px] z-10" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                        {row.totalDays}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-bold sticky right-0 z-10" style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                        {row.otHours.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="border border-gray-300 px-3 py-2 font-bold text-right">
                      TOTAL:
                    </td>
                    {monthDays.map((day) => (
                      <td key={`total-${day}`} className="border border-gray-300 px-1 py-2 text-center bg-blue-50" />
                    ))}
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold sticky right-[60px] z-10 bg-blue-50">
                      {reportData.reduce((sum, row) => sum + row.totalDays, 0).toFixed(1)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold sticky right-0 z-10 bg-blue-50">
                      {reportData.reduce((sum, row) => sum + row.otHours, 0).toFixed(1)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm">
                <p className="text-gray-700">
                  <strong>Legend:</strong> ✓ = Present, ◐ = Half Day, ✗ = Absent, - = No Record
                </p>
              </div>
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
