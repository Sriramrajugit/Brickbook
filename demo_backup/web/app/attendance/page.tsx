'use client'

import { useState } from 'react'

interface Employee {
  id: number
  name: string
  status: string
}

interface AttendanceRecord {
  employeeId: number
  employeeName: string
  date: string
  status: 'Present' | 'Absent' | 'Half Day'
}

export default function Attendance() {
  const employees: Employee[] = [
    { id: 1, name: 'John Doe', status: 'Active' },
    { id: 2, name: 'Jane Smith', status: 'Active' }
  ]

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    { employeeId: 1, employeeName: 'John Doe', date: '2025-12-24', status: 'Present' },
    { employeeId: 2, employeeName: 'Jane Smith', date: '2025-12-24', status: 'Present' }
  ])

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const markAttendance = (employeeId: number, employeeName: string, status: 'Present' | 'Absent' | 'Half Day') => {
    const existingRecord = attendanceRecords.find(
      record => record.employeeId === employeeId && record.date === selectedDate
    )

    if (existingRecord) {
      setAttendanceRecords(prev => prev.map(record =>
        record.employeeId === employeeId && record.date === selectedDate
          ? { ...record, status }
          : record
      ))
    } else {
      setAttendanceRecords(prev => [...prev, {
        employeeId,
        employeeName,
        date: selectedDate,
        status
      }])
    }
  }

  const getAttendanceStatus = (employeeId: number) => {
    const record = attendanceRecords.find(
      record => record.employeeId === employeeId && record.date === selectedDate
    )
    return record?.status || 'Not Marked'
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
          <a href="/transactions" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Transactions</a>
          <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Accounts</a>
          <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Reports</a>
          <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Employees</a>
          <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">Attendance</a>
          <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Payroll</a>
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
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Daily Attendance</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{employee.name}</h4>
                          <p className="text-sm text-gray-600">Status: {employee.status}</p>
                          <p className="text-sm text-gray-600">Today's Status: <span className={`font-medium ${
                            getAttendanceStatus(employee.id) === 'Present' ? 'text-green-600' :
                            getAttendanceStatus(employee.id) === 'Half Day' ? 'text-yellow-600' :
                            getAttendanceStatus(employee.id) === 'Absent' ? 'text-red-600' : 'text-gray-500'
                          }`}>{getAttendanceStatus(employee.id)}</span></p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAttendance(employee.id, employee.name, 'Present')}
                            className={`px-3 py-2 rounded-md text-sm ${
                              getAttendanceStatus(employee.id) === 'Present'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => markAttendance(employee.id, employee.name, 'Half Day')}
                            className={`px-3 py-2 rounded-md text-sm ${
                              getAttendanceStatus(employee.id) === 'Half Day'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-yellow-600 hover:text-white'
                            }`}
                          >
                            Half Day
                          </button>
                          <button
                            onClick={() => markAttendance(employee.id, employee.name, 'Absent')}
                            className={`px-3 py-2 rounded-md text-sm ${
                              getAttendanceStatus(employee.id) === 'Absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Attendance Records</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.employeeName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'Present' ? 'bg-green-100 text-green-800' :
                            record.status === 'Half Day' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}