'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileNav from '../components/MobileNav'
import { useAuth } from '../components/AuthProvider'
import { formatINR } from '@/lib/formatters'
import { getAvailableStatuses, getStatusBadgeClass, getStatusDisplay } from '@/lib/accountConfig'

type Account = {
  id: number
  name: string
  type: string
  budget: number
  address?: string | null
  startDate?: string | null
  endDate?: string | null
  projectStatus?: string | null
  totalSpent?: number
  balance?: number
}

export default function Accounts() {
  const { canEdit, isGuest } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    budget: '',
    address: '',
    startDate: '',
    endDate: '',
    projectStatus: 'Yet to start'
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts/full')
      const result = await response.json()
      // API returns { data: [...], pagination: {...} }
      if (result.data && Array.isArray(result.data)) {
        setAccounts(result.data)
      } else {
        console.error('Invalid data format:', result)
        setAccounts([])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    // Validation 1: Account Name
    if (!formData.name.trim()) {
      setFormError('Account Name is required')
      return
    }
    if (formData.name.length > 100) {
      setFormError('Account Name must not exceed 100 characters')
      return
    }
    
    // Validation 2: Account Type
    if (!formData.type.trim()) {
      setFormError('Account Type is required')
      return
    }
    if (formData.type.length > 50) {
      setFormError('Account Type must not exceed 50 characters')
      return
    }
    
    // Validation 3: Budget
    if (!formData.budget) {
      setFormError('Budget Planned is required')
      return
    }
    const budgetValue = parseFloat(formData.budget)
    if (isNaN(budgetValue) || budgetValue < 0) {
      setFormError('Budget Planned must be a positive number')
      return
    }
    
    // Validate: End date cannot be earlier than start date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        setFormError('End date cannot be earlier than start date');
        return;
      }
    }
    
    try {
      const url = editingId ? `/api/accounts?id=${editingId}` : '/api/accounts'
      const method = editingId ? 'PUT' : 'POST'
      
      const bodyData = {
        name: formData.name,
        type: formData.type,
        budget: parseFloat(formData.budget),
        address: formData.address || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        projectStatus: formData.projectStatus || 'Yet to start'
      }
      
      console.log('📤 Form submitting:', bodyData, 'to', url, 'with method', method);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      })
      
      if (response.ok) {
        setFormData({ name: '', type: '', budget: '', address: '', startDate: '', endDate: '', projectStatus: 'Yet to start' })
        setShowForm(false)
        setEditingId(null)
        fetchAccounts()
      } else {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        alert(`Error saving account: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Error saving account:', error)
      alert(`Error: ${error}`)
    }
  }

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      type: account.type,
      budget: account.budget.toString(),
      address: account.address || '',
      startDate: account.startDate ? account.startDate.split('T')[0] : '',
      endDate: account.endDate ? account.endDate.split('T')[0] : '',
      projectStatus: account.projectStatus || 'Yet to start'
    })
    setEditingId(account.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setFormData({ name: '', type: '', budget: '', address: '', startDate: '', endDate: '', projectStatus: 'Yet to start' })
    setEditingId(null)
    setShowForm(false)
    setFormError('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    
    try {
      const response = await fetch(`/api/accounts?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/accounts" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">💼 Accounts</h1>
            {canEdit() && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {showForm ? '❌ Cancel' : '➕ New Account'}
              </button>
            )}
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0 space-y-6">
              
              {/* Guest View Notice */}
              {isGuest() && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        You are viewing in <strong>Guest Mode</strong>. You can view all data but cannot add or modify entries.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Edit Account Form */}
              {canEdit() && showForm && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingId ? '✏️ Edit Account' : '➕ Add New Account'}
                  </h3>
                  
                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
                      ❌ {formError}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📝 Account Name <span className="text-red-500">*</span>
                          <span className="text-xs text-gray-500 ml-1">({formData.name.length}/100)</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., Marketing Project"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          🏷️ Account Type <span className="text-red-500">*</span>
                          <span className="text-xs text-gray-500 ml-1">({formData.type.length}/50)</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., Project, Department, Campaign"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          💰 Budget Planned <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={formData.budget}
                          onChange={(e) => setFormData({...formData, budget: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          � Address
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., 123 Main St, City, State"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          �📅 Account Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📅 Account End Date
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📊 Account Status
                        </label>
                        <select
                          value={formData.projectStatus}
                          onChange={(e) => setFormData({...formData, projectStatus: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          {getAvailableStatuses().map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                      >
                        💾 {editingId ? 'Update' : 'Save'} Account
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Accounts Table */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Account Overview</h3>
                {loading ? (
                  <p className="text-gray-500">⏳ Loading accounts...</p>
                ) : accounts.length === 0 ? (
                  <p className="text-gray-500">📭 No accounts found. Create your first account above.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Account Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ Account Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">� Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">�💰 Budget Planned</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Start Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 End Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📊 Account Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💸 Expense So Far</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.map((account) => {
                          const expenseSoFar = account.totalSpent || 0
                          const formatDate = (date: string | null | undefined) => {
                            if (!date) return '-'
                            return new Date(date).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          }
                          return (
                            <tr key={account.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.type}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{account.address || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatINR(account.budget)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(account.startDate)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(account.endDate)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={getStatusBadgeClass(account.projectStatus)}>
                                  {getStatusDisplay(account.projectStatus).label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                                {formatINR(expenseSoFar)}
                              </td>
                              {canEdit() && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <button
                                    onClick={() => router.push(`/transactions?account=${account.id}`)}
                                    className="text-green-600 hover:text-green-800 mr-3"
                                    title="View Transactions"
                                  >
                                    📊
                                  </button>
                                  <button
                                    onClick={() => handleEdit(account)}
                                    className="text-blue-600 hover:text-blue-800 mr-3"
                                    title="Edit"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDelete(account.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}