'use client';

import { useState, useEffect } from 'react';
import MobileNav from '../components/MobileNav';
import ProfileMenu from '../components/ProfileMenu';
import { useAuth } from '../components/AuthProvider';
import { formatDateDDMMYYYY } from '@/lib/formatters';

interface AuditEntry {
  id: string;
  module: string;
  action: string;
  recordId: number;
  userId: number;
  user: {
    name: string | null;
    email: string | null;
  };
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditPage() {
  const { user, isOwner } = useAuth();
  
  // Redirect if not admin
  useEffect(() => {
    if (user && !isOwner) {
      window.location.href = '/';
    }
  }, [user, isOwner]);

  // Filter states
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');

  // Data states
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch audit logs
  const fetchAudits = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(module && { module }),
        ...(action && { action }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(userId && { userId }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/audit?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setAudits(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on filter change
  useEffect(() => {
    fetchAudits(1);
  }, [module, action, startDate, endDate, userId, search]);

  const modules = ['LOGIN', 'TRANSACTION', 'CATEGORY', 'EMPLOYEE', 'BILL'];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

  const getDiffView = (before: any, after: any) => {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    if (!before || !after) return changes;

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    allKeys.forEach(key => {
      if (before[key] !== after[key]) {
        changes.push({
          field: key,
          oldValue: before[key],
          newValue: after[key],
        });
      }
    });

    return changes;
  };

  const renderDiffValue = (value: any) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
    return String(value).substring(0, 50);
  };

  if (!isOwner) {
    return <div className="p-8 text-center">Access denied. Admin only.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <div className="hidden lg:block">
              <ProfileMenu />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Module Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              >
                <option value="">All Modules</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search description, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                placeholder="Filter by user..."
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Audit Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Record ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : audits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No audit entries found
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr key={audit.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDateDDMMYYYY(new Date(audit.timestamp).toISOString())}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(audit.timestamp).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {audit.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            audit.action === 'CREATE'
                              ? 'bg-green-100 text-green-800'
                              : audit.action === 'UPDATE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : audit.action === 'DELETE'
                              ? 'bg-red-100 text-red-800'
                              : audit.action === 'LOGIN'
                              ? 'bg-purple-100 text-purple-800'
                              : audit.action === 'LOGOUT'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {audit.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{audit.user.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{audit.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {audit.recordId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{audit.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setSelectedAudit(audit);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{audits.length}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchAudits(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchAudits(pageNum)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => fetchAudits(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
        </main>
      </div>

      {/* Modal for Details */}
      {showModal && selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Audit Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4">
              {/* Basic Info */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Module</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedAudit.module}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Action</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedAudit.action}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Timestamp</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateDDMMYYYY(new Date(selectedAudit.timestamp).toISOString())} at{' '}
                      {new Date(selectedAudit.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">User</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedAudit.user.name} ({selectedAudit.user.email})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Record ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedAudit.recordId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">IP Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedAudit.ipAddress || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedAudit.description}
                </p>
              </div>

              {/* Change Comparison (for UPDATE/DELETE actions) */}
              {selectedAudit.beforeData && selectedAudit.afterData && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Changes</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Field</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">
                            Before
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">
                            After
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDiffView(selectedAudit.beforeData, selectedAudit.afterData).map(
                          (change, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {change.field}
                              </td>
                              <td className="px-3 py-2 bg-red-50 text-red-900">
                                {renderDiffValue(change.oldValue)}
                              </td>
                              <td className="px-3 py-2 bg-green-50 text-green-900">
                                {renderDiffValue(change.newValue)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Before Data Only (for DELETE) */}
              {selectedAudit.beforeData && !selectedAudit.afterData && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Deleted Data</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-48 text-gray-700">
                    {JSON.stringify(selectedAudit.beforeData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
