'use client';

import { useState, useEffect } from 'react';
import MobileNav from '@/app/components/MobileNav';
import { useAuth } from '@/app/components/AuthProvider';
import { formatINR } from '@/lib/formatters';

interface Item {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  openingStock: number;
  currentStock: number;
  reorderLevel: number | null;
  defaultRate: number | null;
  createdAt: string;
}

export default function ItemsPage() {
  const { canEdit, isGuest, isOwner } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [limit] = useState(10);

  // Form state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: 'Bag',
    openingStock: '',
    reorderLevel: '',
    defaultRate: '',
  });

  // Units for dropdown
  const units = ['Bag', 'Kg', 'Ton', 'Nos', 'Liter', 'Meter', 'Box'];

  // Fetch items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (searchText) params.append('search', searchText);

      const res = await fetch(`/api/inventory/items?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch items');
      const result = await res.json();
      setItems(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRecords(result.pagination.total);
    } catch (err) {
      console.error('Error fetching items:', err);
      alert('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, searchText, limit]);

  const handleEdit = (item: Item) => {
    setIsEditMode(true);
    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      unit: item.unit,
      openingStock: item.openingStock.toString(),
      reorderLevel: item.reorderLevel?.toString() || '',
      defaultRate: item.defaultRate?.toString() || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingItemId(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      unit: 'Bag',
      openingStock: '',
      reorderLevel: '',
      defaultRate: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/inventory/items/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
      alert('Item deleted successfully');
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Item name is required');
      return;
    }

    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode
        ? `/api/inventory/items/${editingItemId}`
        : '/api/inventory/items';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          unit: formData.unit,
          openingStock: formData.openingStock ? Number(formData.openingStock) : 0,
          reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : null,
          defaultRate: formData.defaultRate ? Number(formData.defaultRate) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save item');
      alert(isEditMode ? 'Item updated successfully' : 'Item created successfully');
      handleCancelEdit();
      setCurrentPage(1);
      await fetchItems();
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/inventory/items" />

      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-blue-600">📦</span>
              Items Master
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Add/Edit Form */}
            {canEdit() && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isEditMode ? 'Edit Item' : 'Add New Item'}
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      placeholder="e.g., Cement"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      placeholder="e.g., Materials"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Opening Stock</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.openingStock}
                      onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      placeholder="Minimum stock"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.defaultRate}
                      onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      placeholder="₹"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        {isEditMode ? 'Update Item' : 'Add Item'}
                      </button>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search items..."
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Rate</th>
                    {isOwner() && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={isOwner() ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                        Loading items...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={isOwner() ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.category || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.reorderLevel || '-'} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.defaultRate ? formatINR(item.defaultRate) : '-'}
                        </td>
                        {isOwner() && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 self-center">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Last
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: {totalRecords} items
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
