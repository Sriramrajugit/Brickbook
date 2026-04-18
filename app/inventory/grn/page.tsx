'use client'

import { useState, useEffect } from 'react'
import MobileNav from '@/app/components/MobileNav'
import { useAuth } from '@/app/components/AuthProvider'
import { formatINR } from '@/lib/formatters'

export default function GRNPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [grns, setGrns] = useState<any[]>([])
  const [pos, setPos] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingGRN, setViewingGRN] = useState<any>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    grnNumber: '',
    poId: '',
    receivedDate: new Date().toISOString().split('T')[0],
    warehouseLocation: '',
    receivedBy: '',
    transporterName: '',
    trackingNumber: '',
    deliveryNotes: '',
    discrepancies: ''
  })

  const [grnItems, setGrnItems] = useState<any[]>([])
  const [poItems, setPoItems] = useState<any[]>([])
  const [selectedPO, setSelectedPO] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    fetchPOs()
    fetchGRNs()
  }, [user, currentPage, statusFilter])

  const fetchPOs = async () => {
    try {
      // Fetch POs with SUBMITTED or RECEIVED status (can receive against both)
      const response = await fetch('/api/inventory/purchase-orders?limit=200')
      if (response.ok) {
        const data = await response.json()
        // Filter to show POs that are SUBMITTED or RECEIVED
        const filtered = (data.data || []).filter((po: any) => 
          po.status === 'SUBMITTED' || po.status === 'RECEIVED'
        )
        setPos(filtered)
      }
    } catch (error) {
      console.error('Error fetching POs:', error)
    }
  }

  const fetchGRNs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/inventory/grn?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGrns(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setError('')
      } else {
        setError('Failed to fetch GRNs')
      }
    } catch (error) {
      console.error('Error fetching GRNs:', error)
      setError('Error loading GRNs')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPO = (poId: string) => {
    setFormData({ ...formData, poId })
    const po = pos.find(p => p.id === parseInt(poId))
    setSelectedPO(po)
    if (po?.items) {
      setPoItems(po.items)
      setGrnItems([])
    }
  }

  const handleAddItem = (poItem: any) => {
    const exists = grnItems.find(i => i.poItemId === poItem.id)
    if (!exists) {
      setGrnItems([
        ...grnItems,
        {
          poItemId: poItem.id,
          itemId: poItem.id, // Will need actual itemId from inventory
          itemCode: poItem.itemCode,
          description: poItem.description,
          quantityOrdered: poItem.quantity,
          quantityReceived: poItem.quantity,
          quantityRejected: 0,
          unitPrice: poItem.unitPrice,
          batchNumber: '',
          expiryDate: '',
          condition: 'Good',
          qcNotes: ''
        }
      ])
    }
  }

  const handleRemoveItem = (index: number) => {
    setGrnItems(grnItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...grnItems]
    updated[index][field] = value
    setGrnItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPO) {
      setError('Please select a PO')
      return
    }
    if (grnItems.length === 0) {
      setError('Add at least one item')
      return
    }

    try {
      setLoading(true)
      const payload = {
        ...formData,
        poId: parseInt(formData.poId),
        items: grnItems.map(item => ({
          ...item,
          quantityReceived: parseFloat(item.quantityReceived),
          quantityRejected: parseFloat(item.quantityRejected || 0),
          unitPrice: parseFloat(item.unitPrice)
        }))
      }

      const response = await fetch('/api/inventory/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        setSuccessMsg(result.message || 'GRN created successfully!')
        setShowCreateModal(false)
        setFormData({
          grnNumber: '',
          poId: '',
          receivedDate: new Date().toISOString().split('T')[0],
          warehouseLocation: '',
          receivedBy: '',
          transporterName: '',
          trackingNumber: '',
          deliveryNotes: '',
          discrepancies: ''
        })
        setGrnItems([])
        setPoItems([])
        setSelectedPO(null)
        fetchGRNs()
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create GRN')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error creating GRN'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGRN = async (id: number) => {
    if (!confirm('Delete this GRN? Stock will be reversed.')) return

    try {
      const response = await fetch(`/api/inventory/grn?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccessMsg('GRN deleted')
        fetchGRNs()
        setViewingGRN(null)
        setTimeout(() => setSuccessMsg(''), 2000)
      } else {
        setError('Failed to delete GRN')
      }
    } catch (error) {
      setError('Error deleting GRN')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      RECEIVED: 'bg-blue-100 text-blue-800',
      VERIFIED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (!user) {
    return <div className="p-4">Please log in</div>
  }

  const calculateTotal = (qty: number, price: number, rejected: number = 0) => {
    return (qty - rejected) * price
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileNav currentPage="/inventory/grn" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
            ✅ {successMsg}
          </div>
        )}

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Goods Received Notes</h1>
            <p className="text-gray-600">Track and manage goods receipts from suppliers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
          >
            + New GRN
          </button>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'DRAFT', 'RECEIVED', 'VERIFIED', 'REJECTED'].map(status => (
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
        ) : grns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">No GRNs found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create First GRN
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">GRN #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">PO #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Supplier</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn) => (
                  <tr key={grn.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{grn.grnNumber}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{grn.purchaseOrder.poNumber}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{grn.purchaseOrder.vendorName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(grn.receivedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                      {formatINR(grn.totalReceivedAmount)}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grn.status)}`}>
                        {grn.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm space-x-2">
                      <button
                        onClick={() => setViewingGRN(grn)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </button>
                      {grn.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDeleteGRN(grn.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
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
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Create Goods Received Note</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white text-2xl hover:opacity-80"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* GRN and PO Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">GRN Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.grnNumber}
                      onChange={(e) => setFormData({ ...formData, grnNumber: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded px-4 py-2 font-semibold"
                      placeholder="GRN-2026-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Order *</label>
                    <select
                      required
                      value={formData.poId}
                      onChange={(e) => handleSelectPO(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded px-4 py-2 font-semibold"
                    >
                      <option value="">Select PO</option>
                      {pos.map(po => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} - {po.vendorName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedPO && (
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <p className="text-sm"><strong>Vendor:</strong> {selectedPO.vendorName}</p>
                    <p className="text-sm"><strong>PO Amount:</strong> {formatINR(selectedPO.totalAmount)}</p>
                    <p className="text-sm"><strong>Items:</strong> {selectedPO.items?.length || 0}</p>
                  </div>
                )}

                {/* Receipt Details */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Received Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Warehouse Location</label>
                    <input
                      type="text"
                      value={formData.warehouseLocation}
                      onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="e.g., Bin A-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Received By</label>
                    <input
                      type="text"
                      value={formData.receivedBy}
                      onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Verified By</label>
                    <input
                      type="text"
                      value={formData.receivedBy}
                      disabled
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                      placeholder="Verified later"
                    />
                  </div>
                </div>

                {/* Transporter Info */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Transporter Name</label>
                    <input
                      type="text"
                      value={formData.transporterName}
                      onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={formData.trackingNumber}
                      onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h3 className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded mb-2 inline-block">
                    RECEIVED ITEMS
                  </h3>
                  {poItems.length === 0 ? (
                    <p className="text-gray-500 text-sm italic py-4">Select a PO to add items</p>
                  ) : (
                    <div className="space-y-2">
                      {poItems.map((poItem, idx) => {
                        const exists = grnItems.find(i => i.poItemId === poItem.id)
                        return (
                          <button
                            key={poItem.id}
                            type="button"
                            onClick={() => !exists && handleAddItem(poItem)}
                            disabled={!!exists}
                            className={`w-full p-3 border-2 rounded text-left text-sm transition ${
                              exists
                                ? 'border-green-500 bg-green-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-blue-500 cursor-pointer'
                            }`}
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold">{poItem.description}</span>
                              <span className="text-gray-600">{poItem.quantity} × {formatINR(poItem.unitPrice)}</span>
                            </div>
                            {exists ? (
                              <span className="text-green-600 text-xs">✓ Added</span>
                            ) : (
                              <span className="text-gray-400 text-xs">Click to add</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Added Items Table */}
                  {grnItems.length > 0 && (
                    <div className="mt-4">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-blue-200">
                            <th className="border px-2 py-1 text-left">Description</th>
                            <th className="border px-2 py-1 text-center">Qty Ordered</th>
                            <th className="border px-2 py-1 text-center">Qty Received</th>
                            <th className="border px-2 py-1 text-center">Rejected</th>
                            <th className="border px-2 py-1 text-center">Condition</th>
                            <th className="border px-2 py-1 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grnItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50">
                              <td className="border px-2 py-1">{item.description}</td>
                              <td className="border px-2 py-1 text-center">{item.quantityOrdered}</td>
                              <td className="border px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.quantityOrdered}
                                  step="0.01"
                                  value={item.quantityReceived}
                                  onChange={(e) => handleItemChange(idx, 'quantityReceived', e.target.value)}
                                  className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center text-xs"
                                />
                              </td>
                              <td className="border px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.quantityRejected}
                                  onChange={(e) => handleItemChange(idx, 'quantityRejected', e.target.value)}
                                  className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center text-xs"
                                />
                              </td>
                              <td className="border px-2 py-1">
                                <select
                                  value={item.condition}
                                  onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                                  className="w-20 border border-gray-300 rounded px-1 py-0.5 text-xs"
                                >
                                  <option>Good</option>
                                  <option>Damaged</option>
                                  <option>Expired</option>
                                </select>
                              </td>
                              <td className="border px-2 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-red-600 hover:text-red-800 font-bold"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Delivery Notes & Discrepancies */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Notes</label>
                  <textarea
                    value={formData.deliveryNotes}
                    onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    rows={2}
                    placeholder="Any delivery notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Discrepancies</label>
                  <textarea
                    value={formData.discrepancies}
                    onChange={(e) => setFormData({ ...formData, discrepancies: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    rows={2}
                    placeholder="Any damaged items, missing items, etc."
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 justify-end border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 border-2 border-gray-300 rounded text-sm font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || grnItems.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create GRN & Update Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View GRN Modal */}
        {viewingGRN && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Goods Received Note Details</h2>
                <button
                  onClick={() => setViewingGRN(null)}
                  className="text-white text-2xl hover:opacity-80"
                >
                  ✕
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">GRN Number</p>
                    <p className="text-lg font-bold text-gray-900">{viewingGRN.grnNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">PO Number</p>
                    <p className="text-lg font-bold text-gray-900">{viewingGRN.purchaseOrder.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold mt-1 ${getStatusColor(viewingGRN.status)}`}>
                      {viewingGRN.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-xs text-gray-600"><strong>Supplier:</strong> {viewingGRN.purchaseOrder.vendorName}</p>
                    <p className="text-xs text-gray-600 mt-2"><strong>Received Date:</strong> {new Date(viewingGRN.receivedDate).toLocaleString()}</p>
                    <p className="text-xs text-gray-600 mt-2"><strong>Received By:</strong> {viewingGRN.receivedBy || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600"><strong>Transporter:</strong> {viewingGRN.transporterName || '-'}</p>
                    <p className="text-xs text-gray-600 mt-2"><strong>Tracking:</strong> {viewingGRN.trackingNumber || '-'}</p>
                    <p className="text-xs text-gray-600 mt-2"><strong>Location:</strong> {viewingGRN.warehouseLocation || '-'}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <p className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded mb-2 inline-block">
                    RECEIVED ITEMS
                  </p>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="border px-3 py-2 text-left">Description</th>
                        <th className="border px-3 py-2 text-center">Ordered</th>
                        <th className="border px-3 py-2 text-center">Received</th>
                        <th className="border px-3 py-2 text-center">Rejected</th>
                        <th className="border px-3 py-2 text-center">Accepted</th>
                        <th className="border px-3 py-2 text-center">Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingGRN.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="border px-3 py-2">{item.description}</td>
                          <td className="border px-3 py-2 text-center">{item.quantityOrdered}</td>
                          <td className="border px-3 py-2 text-center text-blue-600 font-semibold">{item.quantityReceived}</td>
                          <td className="border px-3 py-2 text-center text-red-600 font-semibold">{item.quantityRejected}</td>
                          <td className="border px-3 py-2 text-center text-green-600 font-semibold">{item.quantityAccepted}</td>
                          <td className="border px-3 py-2 text-center text-xs">
                            {item.condition && (
                              <span className={`px-2 py-1 rounded ${
                                item.condition === 'Good' ? 'bg-green-100 text-green-800' :
                                item.condition === 'Damaged' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.condition}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notes */}
                {(viewingGRN.deliveryNotes || viewingGRN.discrepancies) && (
                  <div className="grid grid-cols-2 gap-4">
                    {viewingGRN.deliveryNotes && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-xs font-bold text-gray-700">Delivery Notes</p>
                        <p className="text-sm text-gray-900 mt-1">{viewingGRN.deliveryNotes}</p>
                      </div>
                    )}
                    {viewingGRN.discrepancies && (
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="text-xs font-bold text-gray-700">Discrepancies</p>
                        <p className="text-sm text-gray-900 mt-1">{viewingGRN.discrepancies}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Total Received Amount:</span>
                    <span className="text-xl font-bold text-gray-900">{formatINR(viewingGRN.totalReceivedAmount)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6 flex justify-end gap-2">
                  {viewingGRN.status === 'DRAFT' && (
                    <button
                      onClick={() => {
                        handleDeleteGRN(viewingGRN.id)
                        setViewingGRN(null)
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded font-semibold hover:bg-gray-100"
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => setViewingGRN(null)}
                    className="px-6 py-2 bg-gray-600 text-white rounded font-semibold hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
