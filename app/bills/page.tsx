'use client';

import { useState, useEffect } from 'react';
import MobileNav from '@/app/components/MobileNav';
import { useAuth } from '@/app/components/AuthProvider';
import { formatINR, formatDateDDMMYYYY } from '@/lib/formatters';
import Link from 'next/link';

interface Employee {
  id: number;
  name: string;
  partnerType: string;
}

interface Bill {
  id: number;
  invoiceNo: string;
  billDate: string;
  dueDate: string | null;
  amount: number;
  paidAmount: number;
  status: string;
  employee: Employee;
  billImagePath: string | null;
}

export default function BillsPage() {
  const { isGuest } = useAuth();

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchText, setSearchText] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);

  // Sorting states
  const [sortBy, setSortBy] = useState('billDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data
  const [bills, setBills] = useState<Bill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch suppliers (employees with partnerType: Supplier)
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/employees?limit=1000');
        if (res.ok) {
          const data = await res.json();
          // Filter to only suppliers (API returns array directly)
          const suppliers = Array.isArray(data) 
            ? data.filter((emp: Employee) => emp.partnerType === 'Supplier')
            : [];
          setEmployees(suppliers);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setEmployees([]);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch bills with filters
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        let query = `/api/bills?page=${currentPage}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

        if (startDate) query += `&startDate=${startDate}`;
        if (endDate) query += `&endDate=${endDate}`;
        if (filterEmployee) query += `&employeeId=${filterEmployee}`;
        if (filterStatus !== 'All') query += `&status=${filterStatus}`;

        const res = await fetch(query);
        if (res.ok) {
          const data = await res.json();
          setBills(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
          setError('');
        } else {
          setError('Failed to fetch bills');
        }
      } catch (err) {
        console.error('Error fetching bills:', err);
        setError('Error loading bills');
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [currentPage, limit, sortBy, sortOrder, startDate, endDate, filterEmployee, filterStatus]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      const res = await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBills(bills.filter((b) => b.id !== id));
        setError('');
      } else {
        setError('Failed to delete bill');
      }
    } catch (err) {
      console.error('Error deleting bill:', err);
      setError('Error deleting bill');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'FULLY_PAID':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'Unpaid';
      case 'PARTIALLY_PAID':
        return 'Partially Paid';
      case 'FULLY_PAID':
        return 'Fully Paid';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/bills" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Bills & Invoices</h1>
            {!isGuest() && (
              <Link
                href="/bills/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + New Bill
              </Link>
            )}
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <select
                value={filterEmployee}
                onChange={(e) => {
                  setFilterEmployee(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Suppliers</option>
                {employees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="All">All Status</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="FULLY_PAID">Fully Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="billDate">Bill Date</option>
                <option value="dueDate">Due Date</option>
                <option value="amount">Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading bills...</div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No bills found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Invoice No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Bill Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      Paid
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
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.invoiceNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {bill.employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDateDDMMYYYY(bill.billDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {bill.dueDate ? formatDateDDMMYYYY(bill.dueDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatINR(bill.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatINR(bill.paidAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            bill.status
                          )}`}
                        >
                          {getStatusLabel(bill.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/bills/${bill.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View
                        </Link>
                        {!isGuest() && (
                          <>
                            <span className="mx-2 text-gray-400">|</span>
                            <Link
                              href={`/bills/${bill.id}/edit`}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Edit
                            </Link>
                            <span className="mx-2 text-gray-400">|</span>
                            <button
                              onClick={() => handleDelete(bill.id)}
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
