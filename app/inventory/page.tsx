'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/components/AuthProvider'

export default function InventoryComingSoon() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="text-6xl mb-6">📦</div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Inventory Module
        </h1>
        
        <p className="text-gray-600 mb-6">
          This feature is currently under development and will be available soon!
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> Inventory management, purchase order tracking, goods received notes, and supplier payments.
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Back to Dashboard
        </button>

        <p className="text-xs text-gray-500 mt-6">
          We're working hard to bring you the best inventory management experience.
        </p>
      </div>
    </div>
  )
}
