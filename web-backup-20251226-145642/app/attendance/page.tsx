'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: number
  name: string
  status: string
}

interface AttendanceRecord {
  id?: number
  employeeId: number
  employeeName: string
  date: string
  status: 'Present' | 'Absent' | 'Half Day' | 'Not Marked'
}

export default function Attendance() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<number, boolean>>({})

  // Load employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees')
        if (!res.ok) throw new Error('Failed to fetch employees')
        const data = await res.json()
        setEmployees(data)
      } catch (err) {
        console.error('Error fetching employees:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Load attendance for date once employees are loaded
  useEffect(() => {
    if (employees.length === 0) return

    const fetchAttendance = async () => {
      try {
        const res = await fetch(`/api/attendance?date=${selectedDate}`)
        if (!res.ok) throw new Error('Failed to fetch attendance')
        const data = await res.json()

        // AFTER
      const records: AttendanceRecord[] = data.map((record: any) => ({
        id: record.id,
        employeeId: record.employeeId,
        employeeName: record.employee.name,
        date: new Date(record.date).toISOString().split('T')[0],  // <-- changed
        status: record.status as AttendanceRecord['status'],
      }))


        setAttendanceRecords(records)
      } catch (err) {
        console.error('Error fetching attendance:', err)
        setAttendanceRecords([])
      }
    }

    fetchAttendance()
  }, [selectedDate, employees])

  const refreshAttendance = async () => {
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}`)
      if (!res.ok) return
      const data = await res.json()
      // AFTER
    const records: AttendanceRecord[] = data.map((record: any) => ({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employee.name,
      date: new Date(record.date).toISOString().split('T')[0],  // <-- changed
      status: record.status as AttendanceRecord['status'],
    }))
      setAttendanceRecords(records)
    } catch (err) {
      console.error('Error refreshing attendance:', err)
    }
  }

  const markAttendance = async (
    employeeId: number,
    employeeName: string,
    status: 'Present' | 'Absent' | 'Half Day'
  ) => {
    // Validate: No future dates allowed
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    
    if (selected > today) {
      alert('Future date attendance is not allowed')
      return
    }

    setSaving(prev => ({ ...prev, [employeeId]: true }))

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, date: selectedDate, status }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Save failed')
      }

      await refreshAttendance()
    } catch (err) {
      console.error('Error saving attendance:', err)
      alert(err instanceof Error ? err.message : 'Failed to save attendance')
    } finally {
      setSaving(prev => ({ ...prev, [employeeId]: false }))
    }
  }
  const normalize = (value: string) =>
  new Date(value).toISOString().split('T')[0];

  const getAttendanceStatus = (employeeId: number): AttendanceRecord['status'] => {
    const record = attendanceRecords.find(
      r => r.employeeId === employeeId && r.date === selectedDate
    )
    return record?.status || 'Not Marked'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div>Loading employees...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Expense Tracker</h2>
        </div>
        <nav className="mt-6">
            <a href="/" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
              Dashboard
            </a>
            <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
              Accounts
            </a>
            <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
              Employees
            </a>
            <a
              href="/transactions"
              className="block px-6 py-3 text-gray-700 hover:bg-gray-200"
            >
              Transactions
            </a>
            <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">
              Attendance
            </a>
            <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
              Payroll
            </a>
            <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
              Reports
            </a>
          </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Mark Attendance */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Mark Daily Attendance
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border border-gray-300 rounded-md shadow-sm px-3 py-2 w-full max-w-xs"
                  />
                </div>

                <div className="space-y-4">
                  {employees.map(employee => (
                    <div
                      key={employee.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {employee.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Today&apos;s Status:{' '}
                            <span
                              className={`font-medium ${
                                getAttendanceStatus(employee.id) === 'Present'
                                  ? 'text-green-600'
                                  : getAttendanceStatus(employee.id) === 'Half Day'
                                  ? 'text-yellow-600'
                                  : getAttendanceStatus(employee.id) === 'Absent'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {getAttendanceStatus(employee.id)}
                            </span>
                          </p>
                        </div>

                        {/* Radio-style options */}
                        <div className="flex items-center space-x-3">
                          <label className="inline-flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`status-${employee.id}`}
                              value="Present"
                              checked={
                                getAttendanceStatus(employee.id) === 'Present'
                              }
                              onChange={() =>
                                markAttendance(
                                  employee.id,
                                  employee.name,
                                  'Present'
                                )
                              }
                              className="h-4 w-4 text-green-600 border-gray-300"
                            />
                            <span className="text-xs text-gray-800">
                              Present
                            </span>
                          </label>

                          <label className="inline-flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`status-${employee.id}`}
                              value="Half Day"
                              checked={
                                getAttendanceStatus(employee.id) === 'Half Day'
                              }
                              onChange={() =>
                                markAttendance(
                                  employee.id,
                                  employee.name,
                                  'Half Day'
                                )
                              }
                              className="h-4 w-4 text-yellow-500 border-gray-300"
                            />
                            <span className="text-xs text-gray-800">Half</span>
                          </label>

                          <label className="inline-flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`status-${employee.id}`}
                              value="Absent"
                              checked={
                                getAttendanceStatus(employee.id) === 'Absent'
                              }
                              onChange={() =>
                                markAttendance(
                                  employee.id,
                                  employee.name,
                                  'Absent'
                                )
                              }
                              className="h-4 w-4 text-red-600 border-gray-300"
                            />
                            <span className="text-xs text-gray-800">
                              Absent
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Records */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Attendance Records
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.length > 0 ? (
                        attendanceRecords.map(record => (
                          <tr key={record.id || `${record.employeeId}-${record.date}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.employeeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-6 py-12 text-center text-gray-500 text-lg"
                          >
                            No attendance records for{' '}
                            {new Date(selectedDate).toLocaleDateString()}
                          </td>
                        </tr>
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
  )
}
