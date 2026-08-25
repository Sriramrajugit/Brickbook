'use client';

import { useState, useEffect } from 'react';
import MobileNav from '@/app/components/MobileNav';
import { useAuth } from '@/app/components/AuthProvider';

interface Partner {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  partnerType: string;
  gstNumber: string | null;
  creditPeriodDays: number;
  isActive: boolean;
}

export default function PartnersPage() {
  const { isGuest } = useAuth();

  // Filter states
  const [filterType, setFilterType] = useState('All');
  const [filterActive, setFilterActive] = useState('true');
  const [searchText, setSearchText] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);

  // Data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    partnerType: 'SUPPLIER',
    gstNumber: '',
    creditPeriodDays: 30,
    isActive: true,
  });

  // Fetch partners
  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        let query = `/api/partners?page=${currentPage}&limit=${limit}`;

        if (filterType !== 'All') query += `&partnerType=${filterType}`;
        if (filterActive !== '') query += `&isActive=${filterActive}`;
        if (searchText) query += `&search=${encodeURIComponent(searchText)}`;

        const res = await fetch(query);
        if (res.ok) {
          const data = await res.json();
          setPartners(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
          setError('');
        } else {
          setError('Failed to fetch partners');
        }
      } catch (err) {
        console.error('Error fetching partners:', err);
        setError('Error loading partners');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [currentPage, limit, filterType, filterActive, searchText]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseInt(value)
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/partners/${editingId}` : '/api/partners';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          partnerType: 'SUPPLIER',
          gstNumber: '',
          creditPeriodDays: 30,
          isActive: true,
        });

        // Refresh list
        setCurrentPage(1);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to save partner');
      }
    } catch (err) {
      console.error('Error saving partner:', err);
      setError('Error saving partner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setFormData({
      name: partner.name,
      email: partner.email || '',
      phone: partner.phone || '',
      address: partner.address || '',
      partnerType: partner.partnerType,
      gstNumber: partner.gstNumber || '',
      creditPeriodDays: partner.creditPeriodDays,
      isActive: partner.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;

    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPartners(partners.filter((p) => p.id !== id));
      } else {
        setError('Failed to delete partner');
      }
    } catch (err) {
      console.error('Error deleting partner:', err);
      setError('Error deleting partner');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav currentPage="/partners" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Partners</h1>
          {!isGuest && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  address: '',
                  partnerType: 'SUPPLIER',
                  gstNumber: '',
                  creditPeriodDays: 30,
                  isActive: true,
                });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Partner
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="All">All Types</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, email, phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading partners...</div>
          ) : partners.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No partners found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      GST No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Credit Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {partner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            partner.partnerType === 'SUPPLIER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {partner.partnerType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {partner.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {partner.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {partner.gstNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {partner.creditPeriodDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            partner.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {partner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!isGuest && (
                          <>
                            <button
                              onClick={() => handleEdit(partner)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Edit
                            </button>
                            <span className="mx-2 text-gray-400">|</span>
                            <button
                              onClick={() => handleDelete(partner.id)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages} ({totalRecords} records)
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Partner Form Modal */}
        {showForm && !isGuest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingId ? 'Edit Partner' : 'Add New Partner'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="partnerType"
                      value={formData.partnerType}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="SUPPLIER">Supplier</option>
                      <option value="CUSTOMER">Customer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Period (days)
                    </label>
                    <input
                      type="number"
                      name="creditPeriodDays"
                      value={formData.creditPeriodDays}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="isActive"
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.value === 'true',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
