'use client'

import { useState, useEffect } from 'react'
import MobileNav from '@/app/components/MobileNav'
import { useAuth } from '@/app/components/AuthProvider'
import { formatINR } from '@/lib/formatters'

export default function DayWiseUsagePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [usageData, setUsageData] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!user) return
    fetchDayWiseUsage()
  }, [user, selectedDate])

  const fetchDayWiseUsage = async () => {
    try {
      setLoading(true)
      // TODO: Add API endpoint to fetch day-wise usage
      setUsageData([])
    } catch (error) {
      console.error('Error fetching day-wise usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="p-4">Please log in</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileNav currentPage="/inventory/daywise-usage" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Day-wise Usage</h1>
          <p className="text-gray-600">Track inventory usage by day</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Category</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option>All Categories</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option>All Items</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
                Filter
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        ) : usageData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No usage data found for {selectedDate}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Item Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Quantity Used</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                </tr>
              </thead>
              <tbody>
                {usageData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">{item.name}</td>
                    <td className="px-6 py-3 text-sm">{item.category}</td>
                    <td className="px-6 py-3 text-sm">{item.quantity}</td>
                    <td className="px-6 py-3 text-sm">{item.unit}</td>
                    <td className="px-6 py-3 text-sm">{formatINR(item.cost)}</td>
                    <td className="px-6 py-3 text-sm">{item.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {usageData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Total Items Used</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Departments Involved</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
