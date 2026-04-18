'use client'

import { useState, useEffect } from 'react'
import MobileNav from '@/app/components/MobileNav'
import { useAuth } from '@/app/components/AuthProvider'
import { formatINR } from '@/lib/formatters'

export default function PurchaseOrdersPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingPO, setViewingPO] = useState<any>(null)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    poNumber: '',
    supplierId: '',
    shipToAccountId: '',
    vendorName: '',
    vendorContact: '',
    vendorAddress: '',
    vendorPhone: '',
    shipToName: '',
    shipToAddress: '',
    shipToCity: '',
    shipToState: '',
    shipToZip: '',
    requisitioner: '',
    shipVia: '',
    fob: '',
    shippingTerms: '',
    comments: '',
    taxAmount: '0',
    shippingAmount: '0',
    otherAmount: '0'
  })
  const [items, setItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState({ itemCode: '', description: '', quantity: '', unitPrice: '' })

  useEffect(() => {
    if (!user) return
    fetchSuppliers()
    fetchAccounts()
    fetchPurchaseOrders()
  }, [user, currentPage, statusFilter])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts?limit=100')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/inventory/purchase-orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setError('')
      } else {
        setError('Failed to fetch purchase orders')
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      setError('Error loading purchase orders')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!newItem.itemCode || !newItem.description || !newItem.quantity || !newItem.unitPrice) {
      alert('Please fill all item fields')
      return
    }
    setItems([...items, { ...newItem }])
    setNewItem({ itemCode: '', description: '', quantity: '', unitPrice: '' })
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      setError('Add at least one item')
      return
    }

    try {
      setLoading(true)
      const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplierId))

      const payload = {
        ...formData,
        supplierId: parseInt(formData.supplierId),
        shipToAccountId: formData.shipToAccountId ? parseInt(formData.shipToAccountId) : null,
        items,
        taxAmount: parseFloat(formData.taxAmount) || 0,
        shippingAmount: parseFloat(formData.shippingAmount) || 0,
        otherAmount: parseFloat(formData.otherAmount) || 0
      }

      const response = await fetch('/api/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({
          poNumber: '',
          supplierId: '',
          shipToAccountId: '',
          vendorName: '',
          vendorContact: '',
          vendorAddress: '',
          vendorPhone: '',
          shipToName: '',
          shipToAddress: '',
          shipToCity: '',
          shipToState: '',
          shipToZip: '',
          requisitioner: '',
          shipVia: '',
          fob: '',
          shippingTerms: '',
          comments: '',
          taxAmount: '0',
          shippingAmount: '0',
          otherAmount: '0'
        })
        setItems([])
        fetchPurchaseOrders()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create purchase order')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      const errorMsg = error instanceof Error ? error.message : 'Error creating purchase order'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this PO?')) return

    try {
      const response = await fetch(`/api/inventory/purchase-orders?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPurchaseOrders()
      } else {
        setError('Failed to delete purchase order')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      setError('Error deleting purchase order')
    }
  }

  const handleViewPO = (order: any) => {
    setViewingPO(order)
  }

  const getValidNextStatuses = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['RECEIVED', 'CANCELLED'],
      RECEIVED: [],
      CANCELLED: []
    }
    return transitions[currentStatus] || []
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusButtonColor = (status: string): string => {
    const colors: Record<string, string> = {
      SUBMITTED: 'bg-blue-600 hover:bg-blue-700',
      RECEIVED: 'bg-green-600 hover:bg-green-700',
      CANCELLED: 'bg-red-600 hover:bg-red-700'
    }
    return colors[status] || 'bg-gray-600 hover:bg-gray-700'
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!viewingPO) return
    
    if (!confirm(`Change status from ${viewingPO.status} to ${newStatus}?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/inventory/purchase-orders?id=${viewingPO.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      )

      if (response.ok) {
        const updated = await response.json()
        setViewingPO(updated)
        fetchPurchaseOrders()
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setError(error instanceof Error ? error.message : 'Error updating status')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="p-4">Please log in</div>
  }

  const calculateItemTotal = (quantity: string, unitPrice: string) => {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.unitPrice), 0)
  const tax = parseFloat(formData.taxAmount) || 0
  const shipping = parseFloat(formData.shippingAmount) || 0
  const other = parseFloat(formData.otherAmount) || 0
  const poTotal = itemsSubtotal + tax + shipping + other

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileNav currentPage="/inventory/purchase-orders" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Manage and track purchase orders from suppliers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
          >
            + New PO
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          {['all', 'DRAFT', 'SUBMITTED', 'RECEIVED', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded text-sm font-medium ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All Status' : status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No purchase orders found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Create First Purchase Order
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">PO ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Supplier</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{order.poNumber}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{order.vendorName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                      {formatINR(order.totalAmount)}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'RECEIVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm space-x-2">
                      <button
                        onClick={() => handleViewPO(order)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Create Purchase Order</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white text-2xl hover:opacity-80"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-3">
                {/* PO Header - 2 columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">PO Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded px-4 py-2 font-semibold text-gray-900"
                      placeholder="PO-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Supplier *</label>
                    <select
                      required
                      value={formData.supplierId}
                      onChange={(e) => {
                        const supplier = suppliers.find(s => s.id === parseInt(e.target.value))
                        setFormData({
                          ...formData,
                          supplierId: e.target.value,
                          vendorName: supplier?.name || '',
                          vendorContact: supplier?.email || '',
                          vendorAddress: supplier?.address || '',
                          vendorPhone: supplier?.phone || ''
                        })
                      }}
                      className="w-full border-2 border-gray-300 rounded px-4 py-2 font-semibold"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vendor and Ship-to Details */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Vendor Details */}
                  <div>
                    <h3 className="text-sm font-bold text-white bg-green-600 px-3 py-1 rounded mb-2">VENDOR</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        placeholder="Vendor Name"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={formData.vendorContact}
                        onChange={(e) => setFormData({ ...formData, vendorContact: e.target.value })}
                        placeholder="Contact Person"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={formData.vendorAddress}
                        onChange={(e) => setFormData({ ...formData, vendorAddress: e.target.value })}
                        placeholder="Address"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="tel"
                        value={formData.vendorPhone}
                        onChange={(e) => setFormData({ ...formData, vendorPhone: e.target.value })}
                        placeholder="Phone"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Ship-to Details */}
                  <div>
                    <h3 className="text-sm font-bold text-white bg-green-600 px-3 py-1 rounded mb-2">SHIP TO (FROM ACCOUNT)</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Select Account *</label>
                        <select
                          value={formData.shipToAccountId}
                          onChange={(e) => {
                            const account = accounts.find(a => a.id === parseInt(e.target.value))
                            setFormData({
                              ...formData,
                              shipToAccountId: e.target.value,
                              shipToName: account?.name || '',
                              shipToAddress: account?.address || '',
                              shipToCity: account?.city || '',
                              shipToState: account?.state || '',
                              shipToZip: account?.zip || ''
                            })
                          }}
                          className="w-full border-2 border-gray-300 rounded px-2 py-1 text-xs font-semibold"
                        >
                          <option value="">Select Account</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.city}, {a.state})
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Address fields - 2x2 grid */}
                      <input
                        type="text"
                        value={formData.shipToName}
                        readOnly
                        placeholder="Ship-To Name"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={formData.shipToAddress}
                        readOnly
                        placeholder="Address"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
                      />
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="text"
                          value={formData.shipToCity}
                          readOnly
                          placeholder="City"
                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
                        />
                        <input
                          type="text"
                          value={formData.shipToState}
                          readOnly
                          placeholder="State"
                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
                        />
                        <input
                          type="text"
                          value={formData.shipToZip}
                          readOnly
                          placeholder="ZIP"
                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">REQUISITIONER</label>
                    <input
                      type="text"
                      value={formData.requisitioner}
                      onChange={(e) => setFormData({ ...formData, requisitioner: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">SHIP VIA</label>
                    <input
                      type="text"
                      value={formData.shipVia}
                      onChange={(e) => setFormData({ ...formData, shipVia: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">F.O.B.</label>
                    <input
                      type="text"
                      value={formData.fob}
                      onChange={(e) => setFormData({ ...formData, fob: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">SHIPPING TERMS</label>
                    <input
                      type="text"
                      value={formData.shippingTerms}
                      onChange={(e) => setFormData({ ...formData, shippingTerms: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-0.5"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h3 className="text-sm font-bold text-white bg-green-600 px-3 py-1 rounded mb-2">LINE ITEMS</h3>
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-xs italic py-4 text-center border rounded bg-gray-50">No items added yet</p>
                  ) : (
                    <table className="w-full border-collapse text-xs mb-2">
                      <thead>
                        <tr className="bg-gray-200 border">
                          <th className="border px-2 py-1 text-left font-bold text-gray-700">Item Code</th>
                          <th className="border px-2 py-1 text-left font-bold text-gray-700">Description</th>
                          <th className="border px-2 py-1 text-center font-bold text-gray-700">Qty</th>
                          <th className="border px-2 py-1 text-right font-bold text-gray-700">Unit Price</th>
                          <th className="border px-2 py-1 text-right font-bold text-gray-700">Total</th>
                          <th className="border px-2 py-1 text-center font-bold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-yellow-50 border-b">
                            <td className="border px-2 py-1 text-gray-900 font-semibold">{item.itemCode}</td>
                            <td className="border px-2 py-1 text-gray-900">{item.description}</td>
                            <td className="border px-2 py-1 text-center text-gray-900">{item.quantity}</td>
                            <td className="border px-2 py-1 text-right text-gray-900">{formatINR(item.unitPrice)}</td>
                            <td className="border px-2 py-1 text-right font-semibold text-gray-900">{formatINR(calculateItemTotal(item.quantity, item.unitPrice))}</td>
                            <td className="border px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-600 hover:text-red-800 font-bold text-sm"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Add Item Form */}
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs font-bold text-gray-700 mb-2">ADD ITEM</p>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <input
                        type="text"
                        value={newItem.itemCode}
                        onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                        placeholder="Item Code"
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Description"
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                        placeholder="Qty"
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                        placeholder="Unit Price"
                        step="0.01"
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full bg-blue-600 text-white py-1 rounded text-xs font-semibold hover:bg-blue-700"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs font-bold text-gray-700 mb-2">FINANCIAL SUMMARY</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatINR(itemsSubtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax:</span>
                      <input
                        type="number"
                        value={formData.taxAmount}
                        onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                        step="0.01"
                        className="w-32 border border-gray-300 rounded px-1 py-0.5 text-right text-xs"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Shipping:</span>
                      <input
                        type="number"
                        value={formData.shippingAmount}
                        onChange={(e) => setFormData({ ...formData, shippingAmount: e.target.value })}
                        step="0.01"
                        className="w-32 border border-gray-300 rounded px-1 py-0.5 text-right text-xs"
                      />
                    </div>
                    <div className="flex justify-between items-center border-t pt-1">
                      <span className="font-bold">TOTAL:</span>
                      <span className="text-base font-bold text-green-600">{formatINR(poTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Comments or Special Instructions</label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    rows={2}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 justify-end border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-1 border-2 border-gray-300 rounded text-xs font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Create PO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View PO Modal - Professional Template */}
        {viewingPO && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
              {/* Header with Print Button */}
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-8 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">PURCHASE ORDER</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white text-green-600 rounded font-semibold hover:bg-gray-100"
                  >
                    🖨 Print
                  </button>
                  <button
                    onClick={() => setViewingPO(null)}
                    className="text-white text-2xl hover:opacity-80"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* PO Content */}
              <div className="p-8 space-y-6">
                {/* Top Section - Company Info & PO Details */}
                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2">
                    <h3 className="text-xl font-bold text-green-600 mb-2">Purchase Order</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-semibold">[Company Name]</p>
                      <p>[Street Address]</p>
                      <p>[City, ST ZIP]</p>
                      <p>Phone: (000) 000-0000</p>
                      <p>Fax: (000) 000-0000</p>
                      <p>Website:</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-4">
                      <p className="text-xs text-gray-600">DATE</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(viewingPO.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">PO #</p>
                      <p className="text-lg font-bold text-gray-900">{viewingPO.poNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Vendor & Ship-to Info */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Vendor Section */}
                  <div className="border-b-4 border-green-600 pb-4">
                    <p className="text-xs font-bold text-white bg-green-600 px-2 py-1 inline-block mb-2">VENDOR</p>
                    <div className="text-sm text-gray-900 space-y-1 mt-2">
                      <p className="font-semibold">{viewingPO.vendorName}</p>
                      <p>{viewingPO.vendorContact}</p>
                      <p>{viewingPO.vendorAddress}</p>
                      <p>Phone: {viewingPO.vendorPhone}</p>
                      <p>Fax: (000) 000-0000</p>
                    </div>
                  </div>

                  {/* Ship-to Section */}
                  <div className="border-b-4 border-green-600 pb-4">
                    <p className="text-xs font-bold text-white bg-green-600 px-2 py-1 inline-block mb-2">SHIP TO</p>
                    <div className="text-sm text-gray-900 space-y-1 mt-2">
                      <p className="font-semibold">{viewingPO.shipToName}</p>
                      <p>[Company Name]</p>
                      <p>{viewingPO.shipToAddress}</p>
                      <p>{viewingPO.shipToCity}, {viewingPO.shipToState} {viewingPO.shipToZip}</p>
                      <p>[Phone]</p>
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-4 gap-4 bg-gray-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-gray-600">REQUISITIONER</p>
                    <p className="text-sm text-gray-900">{viewingPO.requisitioner || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600">SHIP VIA</p>
                    <p className="text-sm text-gray-900">{viewingPO.shipVia || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600">F.O.B.</p>
                    <p className="text-sm text-gray-900">{viewingPO.fob || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600">SHIPPING TERMS</p>
                    <p className="text-sm text-gray-900">{viewingPO.shippingTerms || '-'}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="border px-3 py-2 text-left font-bold">ITEM #</th>
                        <th className="border px-3 py-2 text-left font-bold">DESCRIPTION</th>
                        <th className="border px-3 py-2 text-center font-bold">QTY</th>
                        <th className="border px-3 py-2 text-right font-bold">UNIT PRICE</th>
                        <th className="border px-3 py-2 text-right font-bold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingPO.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 border-b">
                          <td className="border px-3 py-2 text-gray-900">{item.itemCode}</td>
                          <td className="border px-3 py-2 text-gray-900">{item.description}</td>
                          <td className="border px-3 py-2 text-center text-gray-900">{item.quantity}</td>
                          <td className="border px-3 py-2 text-right text-gray-900">{formatINR(item.unitPrice)}</td>
                          <td className="border px-3 py-2 text-right font-semibold text-gray-900">{formatINR(item.totalPrice)}</td>
                        </tr>
                      ))}
                      {/* Empty rows for spacing */}
                      {(!viewingPO.items || viewingPO.items.length < 5) && (
                        <>
                          {Array.from({ length: 5 - (viewingPO.items?.length || 0) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="border-b">
                              <td className="border px-3 py-3" colSpan={5}></td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Comments & Financial Summary */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Comments */}
                  <div>
                    <p className="text-xs font-bold text-white bg-green-600 px-2 py-1 inline-block mb-2">Comments or Special Instructions</p>
                    <div className="border rounded p-3 min-h-20 text-sm text-gray-900">
                      {viewingPO.comments || '-'}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">SUBTOTAL</span>
                      <span className="font-semibold text-gray-900">{formatINR(viewingPO.subtotal)}</span>
                    </div>
                    {viewingPO.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">TAX</span>
                        <span className="font-semibold text-gray-900">{formatINR(viewingPO.taxAmount)}</span>
                      </div>
                    )}
                    {viewingPO.shippingAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">SHIPPING</span>
                        <span className="font-semibold text-gray-900">{formatINR(viewingPO.shippingAmount)}</span>
                      </div>
                    )}
                    {viewingPO.otherAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">OTHER</span>
                        <span className="font-semibold text-gray-900">{formatINR(viewingPO.otherAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between bg-yellow-100 px-3 py-2 border-2 border-yellow-300 rounded mt-2">
                      <span className="font-bold text-gray-900">TOTAL</span>
                      <span className="font-bold text-lg text-gray-900">₹ {formatINR(viewingPO.totalAmount).replace('₹', '')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 text-center text-xs text-gray-600">
                  <p>If you have any questions about this purchase order, please contact</p>
                  <p>[Name, Phone #, E-mail]</p>
                </div>

                {/* Status & Actions Section */}
                <div className="border-t pt-6">
                  <div className="mb-6">
                    {/* Current Status Display */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                      <span className="text-sm text-gray-600 font-bold">Purchase Order Status:</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(viewingPO.status)}`}>
                        {viewingPO.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        (Created: {new Date(viewingPO.createdAt).toLocaleString()})
                      </span>
                    </div>

                    {/* Status Transition Controls */}
                    {getValidNextStatuses(viewingPO.status).length > 0 ? (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200 mb-4">
                        <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="text-lg">⚡</span> Move To Next Status:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getValidNextStatuses(viewingPO.status).map(newStatus => (
                            <button
                              key={newStatus}
                              onClick={() => handleStatusChange(newStatus)}
                              disabled={loading}
                              title={`${newStatus === 'CANCELLED' ? 'Cancel this PO' : `Change status to ${newStatus}`}`}
                              className={`px-4 py-2 rounded font-medium text-sm text-white transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusButtonColor(newStatus)}`}
                            >
                              {loading ? '⏳ Updating...' : `→ ${newStatus}`}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          ℹ️ Status change will be recorded and reflected in the PO list.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 mb-4">
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-lg">ℹ️</span>
                          <span>This PO is in a final state. No further status changes are allowed.</span>
                        </p>
                        {viewingPO.status === 'RECEIVED' && (
                          <p className="text-xs text-gray-600 mt-2">✅ Order received and fulfilled</p>
                        )}
                        {viewingPO.status === 'CANCELLED' && (
                          <p className="text-xs text-gray-600 mt-2">❌ This order has been cancelled</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Workflow Information */}
                  <div className="bg-gray-50 p-3 rounded mb-4 text-xs text-gray-600 border border-gray-200">
                    <p className="font-semibold text-gray-700 mb-2">📋 Status Workflow:</p>
                    <p>DRAFT (editable) → SUBMITTED (pending) → RECEIVED (complete)</p>
                    <p className="mt-1">You can cancel from any stage before completion.</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 flex-wrap">
                    {/* Delete Button - Only for DRAFT */}
                    {viewingPO.status === 'DRAFT' && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this draft PO? This action cannot be undone.')) {
                            handleDelete(viewingPO.id)
                            setViewingPO(null)
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                        title="Only draft POs can be deleted"
                      >
                        🗑️ Delete Draft
                      </button>
                    )}

                    {/* Print Button */}
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded font-semibold hover:bg-gray-100 transition"
                      title="Print this PO"
                    >
                      🖨️ Print
                    </button>

                    {/* Close Button */}
                    <button
                      onClick={() => setViewingPO(null)}
                      className="px-6 py-2 bg-gray-600 text-white rounded font-semibold hover:bg-gray-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
