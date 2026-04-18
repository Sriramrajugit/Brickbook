'use client'

import { useState, useEffect } from 'react'
import MobileNav from '@/app/components/MobileNav'
import { useAuth } from '@/app/components/AuthProvider'
import { formatINR } from '@/lib/formatters'

export default function SupplierPaymentRemindersPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [reminders, setReminders] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!user) return
    fetchPaymentReminders()
  }, [user, filterStatus])

  const fetchPaymentReminders = async () => {
    try {
      setLoading(true)
      // TODO: Add API endpoint to fetch supplier payment reminders
      setReminders([])
    } catch (error) {
      console.error('Error fetching payment reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (reminderId: string) => {
    try {
      // TODO: Add API endpoint to record payment
      console.log('Recording payment for reminder:', reminderId)
      fetchPaymentReminders()
    } catch (error) {
      console.error('Error recording payment:', error)
    }
  }

  if (!user) {
    return <div className="p-4">Please log in</div>
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'due-soon':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileNav currentPage="/inventory/supplier-payments" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Supplier Payment Reminders</h1>
          <p className="text-gray-600">Track and manage supplier payment due dates</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Pending</p>
            <p className="text-3xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-500 mt-2">Payment amount due</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Overdue</p>
            <p className="text-3xl font-bold text-red-600">-</p>
            <p className="text-xs text-gray-500 mt-2">Requires immediate attention</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Due Soon</p>
            <p className="text-3xl font-bold text-yellow-600">-</p>
            <p className="text-xs text-gray-500 mt-2">Due within 7 days</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Suppliers</p>
            <p className="text-3xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-500 mt-2">Active suppliers</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'overdue', 'due-soon', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded capitalize font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'due-soon' ? 'Due Soon' : status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No payment reminders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Supplier</p>
                    <p className="text-lg font-semibold text-gray-900">{reminder.supplier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Amount Due</p>
                    <p className="text-lg font-semibold text-gray-900">{formatINR(reminder.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Due Date</p>
                    <p className="text-lg font-semibold text-gray-900">{reminder.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${statusColor(reminder.status)}`}>
                      {reminder.status === 'due-soon' ? 'Due Soon' : reminder.status}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => handlePayment(reminder.id)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium text-sm"
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
