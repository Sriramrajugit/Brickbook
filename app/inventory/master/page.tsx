'use client'

import { useState, useEffect } from 'react'
import MobileNav from '@/app/components/MobileNav'
import { useAuth } from '@/app/components/AuthProvider'

export default function InventoryMasterPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [masterItems, setMasterItems] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    fetchMasterItems()
  }, [user])

  const fetchMasterItems = async () => {
    try {
      setLoading(true)
      // TODO: Add API endpoint to fetch inventory master items
      setMasterItems([])
    } catch (error) {
      console.error('Error fetching inventory master:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="p-4">Please log in</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileNav currentPage="/inventory/master" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Master</h1>
          <p className="text-gray-600">Manage inventory items and their details</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">📦 Items</h2>
              <p className="text-gray-600 mb-4">Manage inventory items</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                View Items
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">📊 Stock Levels</h2>
              <p className="text-gray-600 mb-4">Track current stock levels</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                View Stock
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">🏷️ Categories</h2>
              <p className="text-gray-600 mb-4">Manage inventory categories</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                View Categories
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
