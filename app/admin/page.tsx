'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import MobileNav from '../components/MobileNav'
import Link from 'next/link'
import { formatINR } from '@/lib/formatters'

interface CompanyStats {
  id: number
  name: string
  createdAt: string
  package: 'FOUNDATION' | 'STRUCTURE' | 'LANDMARK'
  _count: {
    users: number
    employees: number
    accounts: number
    transactions: number
  }
}

interface OnboardingFormData {
  companyName: string
  ownerEmail: string
  ownerName: string
  ownerPassword: string
  mainAccountBudget: string
  selectedPackage: 'FOUNDATION' | 'STRUCTURE' | 'LANDMARK'
  isDemo: boolean
}

export default function AdminPanel() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [companies, setCompanies] = useState<CompanyStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [showOnboardingForm, setShowOnboardingForm] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyStats | null>(null)
  const [formData, setFormData] = useState<OnboardingFormData>({
    companyName: '',
    ownerEmail: '',
    ownerName: '',
    ownerPassword: '',
    mainAccountBudget: '100000',
    selectedPackage: 'FOUNDATION',
    isDemo: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Check authorization - Only OWNER from Brickbook.in can access
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'OWNER' || user?.company?.name !== 'Brickbook.in')) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading, user])

  // Fetch companies
  const fetchCompanies = async (page: number = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/companies?page=${page}&limit=10`, { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        setCompanies(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
        setTotalCompanies(result.pagination?.total || 0)
        setCurrentPage(page)
      } else {
        const error = await res.json()
        setError(error.error || 'Failed to fetch companies')
      }
    } catch (err) {
      setError('Error fetching companies')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role === 'OWNER') {
      fetchCompanies()
    }
  }, [isAuthenticated, user])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          ownerEmail: formData.ownerEmail,
          ownerName: formData.ownerName,
          ownerPassword: formData.ownerPassword,
          mainAccountBudget: parseInt(formData.mainAccountBudget),
          selectedPackage: formData.selectedPackage,
          isDemo: formData.isDemo,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        const packageType = formData.isDemo ? 'Demo (30-day trial)' : formData.selectedPackage + ' package'
        setSuccessMessage(`Customer "${formData.companyName}" onboarded successfully with ${packageType}!`)
        setFormData({
          companyName: '',
          ownerEmail: '',
          ownerName: '',
          ownerPassword: '',
          mainAccountBudget: '100000',
          selectedPackage: 'FOUNDATION',
          isDemo: false,
        })
        setShowOnboardingForm(false)
        // Refresh company list
        fetchCompanies(1)
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const error = await res.json()
        setError(error.error || 'Failed to onboard customer')
      }
    } catch (err) {
      setError('Error onboarding customer')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCompany = async (companyId: number) => {
    if (deleteConfirm !== companyId) {
      setDeleteConfirm(companyId)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSuccessMessage('Company deleted successfully')
        setDeleteConfirm(null)
        fetchCompanies(currentPage)
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const error = await res.json()
        setError(error.error || 'Failed to delete company')
      }
    } catch (err) {
      setError('Error deleting company')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'OWNER') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <MobileNav currentPage={pathname} />
      
      {/* Main Content */}
      <div className="flex-1 w-full pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Manage customers and onboard new companies</p>
            </div>
            <button
              onClick={() => setShowOnboardingForm(!showOnboardingForm)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showOnboardingForm ? 'Cancel' : '+ Onboard Customer'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✓ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            ✗ {error}
          </div>
        )}

        {/* Onboarding Form */}
        {showOnboardingForm && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Onboard New Customer</h2>
            <form onSubmit={handleOnboard} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleFormChange}
                    placeholder="Enter company name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleFormChange}
                    placeholder="Enter owner name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleFormChange}
                    placeholder="Enter owner email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Password
                  </label>
                  <input
                    type="password"
                    name="ownerPassword"
                    value={formData.ownerPassword}
                    onChange={handleFormChange}
                    placeholder="Enter password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Main Account Budget
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">₹</span>
                    <input
                      type="number"
                      name="mainAccountBudget"
                      value={formData.mainAccountBudget}
                      onChange={handleFormChange}
                      placeholder="100000"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Access Type Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Account Type
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="accessType"
                        checked={!formData.isDemo}
                        onChange={() => setFormData({ ...formData, isDemo: false })}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700">Paid Account</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="accessType"
                        checked={formData.isDemo}
                        onChange={() => setFormData({ ...formData, isDemo: true })}
                        className="w-4 h-4 text-green-600 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700">Demo – 30 Days</span>
                    </label>
                  </div>
                </div>

                {/* Package Selection (only for paid) */}
                {!formData.isDemo && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Package
                  </label>
                  <select
                    name="selectedPackage"
                    value={formData.selectedPackage}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FOUNDATION">
                      Foundation - Dashboard, Transactions, Attendance, Payroll, Reports, Masters
                    </option>
                    <option value="STRUCTURE">
                      Structure - Foundation + Bills & Invoices, Import Data
                    </option>
                    <option value="LANDMARK">
                      Landmark - Structure + BOQ, Future Modules
                    </option>
                  </select>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Foundation:</strong> Dashboard, Transactions, Attendance, Payroll, Reports, Masters (Accounts, Categories, Employees & Partners, Users)<br/>
                    <strong>Structure:</strong> Everything in Foundation + Bills & Invoices, Import Data<br/>
                    <strong>Landmark:</strong> Everything in Structure + BOQ and upcoming modules
                  </p>
                </div>
                )}

                {/* Demo Info */}
                {formData.isDemo && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Demo Account:</strong> Valid for 30 days from account creation. After expiry, user can login but all menus will be disabled. Only logout and upgrade options will be available.
                  </p>
                </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? 'Processing...' : 'Onboard Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOnboardingForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Companies List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Companies ({totalCompanies})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No companies yet. {!showOnboardingForm && 'Click "Onboard Customer" to add one.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Employees
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Accounts
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedCompany(company)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {company.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          company.package === 'FOUNDATION' ? 'bg-blue-100 text-blue-800' :
                          company.package === 'STRUCTURE' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {company.package}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {company._count.users}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {company._count.employees}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {company._count.accounts}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {company._count.transactions}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCompany(company)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(company.id)}
                            className={`text-sm font-medium transition-colors ${
                              deleteConfirm === company.id
                                ? 'text-red-700 bg-red-100 px-2 py-1 rounded'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                          >
                            {deleteConfirm === company.id ? 'Confirm?' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-center">
              <button
                onClick={() => fetchCompanies(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchCompanies(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchCompanies(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Company Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{selectedCompany.name}</h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedCompany._count.users}
                  </div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {selectedCompany._count.employees}
                  </div>
                  <div className="text-sm text-gray-600">Employees</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {selectedCompany._count.accounts}
                  </div>
                  <div className="text-sm text-gray-600">Accounts</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {selectedCompany._count.transactions}
                  </div>
                  <div className="text-sm text-gray-600">Transactions</div>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Company Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company ID:</span>
                    <span className="font-medium text-gray-900">{selectedCompany.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedCompany.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedCompany(null)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
