'use client'
import { useEffect, useState } from 'react'
import MobileNav from '../components/MobileNav'
import { useAuth } from '../components/AuthProvider'

type Category = {
  id: number
  name: string
  description: string | null
}

export default function Categories() {
  const { canEdit, isGuest } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/categories?id=${editingId}` 
        : '/api/categories'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCategories()
        handleCancel()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description || ''
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ name: '', description: '' })
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
        <MobileNav currentPage="/categories" />
        <div className="flex-1 lg:ml-0 pt-16 lg:pt-0 flex items-center justify-center">
          <div className="text-xl">⏳ Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/categories" />
      
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">🏷️ Categories</h1>
            {canEdit() && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                ➕ Add Category
              </button>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

          {canEdit() && showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? '✏️ Edit Category' : '➕ Add New Category'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., Food, Transportation, Salary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    💾 Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📭 No categories found. Add your first category!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {category.description || '-'}
                        </td>
                        {canEdit() && (
                          <td className="px-6 py-4 text-right text-sm">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
