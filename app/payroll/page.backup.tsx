'use client';

import { useState, useEffect } from 'react';
import MobileNav from '../components/MobileNav';
import { useAuth } from '../components/AuthProvider';
import { formatINR } from '@/lib/formatters';

interface PayrollPreview {
  employeeId: number;
  employeeName: string;
  salary: number;
  totalAdvance: number;
  totalSalaryPaid: number;
  attendance: any[];
}

interface Account {
  id: number;
  name: string;
}

export default function Payroll() {
  const { isGuest, isOwner } = useAuth();
  const [payrollPreview, setPayrollPreview] = useState<PayrollPreview[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [remarks, setRemarks] = useState('');
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('All');

  // Fetch accounts for filter dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        }
      } catch (err) {
        console.error('Error loading accounts:', err);
      }
    };
    fetchAccounts();
  }, []);

  // Set default to current week (Monday to Saturday)
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    setStartDate(monday.toISOString().split('T')[0]);
    setEndDate(saturday.toISOString().split('T')[0]);
  }, []);

  // Calculate totals from backend data
  const totals = payrollPreview.reduce(
    (acc, record) => ({
      grossPay: acc.grossPay + (record.salary || 0),
      advances: acc.advances + (record.totalAdvance || 0),
      salaryPaid: acc.salaryPaid + (record.totalSalaryPaid || 0),
    }),
    { grossPay: 0, advances: 0, salaryPaid: 0 }
  );

  // Fetch payroll preview from backend
  useEffect(() => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    const fetchPayroll = async () => {
      try {
        const params = new URLSearchParams({
          fromDate: startDate,
          toDate: endDate,
        });
        const res = await fetch(`/api/payroll?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch payroll preview');
        const data = await res.json();
        setPayrollPreview(data);
      } catch (err) {
        setError('Failed to load payroll preview');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, [startDate, endDate]);

  const formatPeriod = () => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const handleSavePayroll = async () => {
    if (payrollPreview.length === 0) {
      setError('No payroll records to save.');
      return;
    }

    try {
      setSaveSuccess(false);
      setError('');

      // Create payroll records for each employee
      const savePromises = payrollPreview.map((record) =>
        fetch('/api/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: record.employeeId,
            accountId: selectedAccount !== 'All' ? parseInt(selectedAccount) : accounts[0]?.id,
            fromDate: startDate,
            toDate: endDate,
            amount: record.salary - record.totalAdvance,
            remarks: remarks || null,
          }),
        })
      );

      const responses = await Promise.all(savePromises);
      const allSuccess = responses.every((res) => res.ok);

      if (allSuccess) {
        setSaveSuccess(true);
        setRemarks('');
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError('Failed to save some payroll records.');
      }
    } catch (err) {
      setError('Error saving payroll records.');
      console.error('Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/payroll" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-green-600">💰</span>
              Payroll
            </h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {loading && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <p className="text-gray-600 text-center">Loading payroll data...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg shadow mb-6">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow mb-6">
                  <p className="text-green-700">✓ Payroll records saved successfully!</p>
                </div>
              )}

              {/* Guest View Notice */}
              {isGuest() && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        You are viewing in <strong>Guest Mode</strong>. You can view payroll data but cannot save records.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Filter */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Period (Monday - Saturday)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account/Project</label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Accounts</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date (Monday)</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date (Saturday)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const today = new Date();
                        const dayOfWeek = today.getDay();
                        const monday = new Date(today);
                        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                        monday.setDate(today.getDate() + diff);
                        const saturday = new Date(monday);
                        saturday.setDate(monday.getDate() + 5);
                        setStartDate(monday.toISOString().split('T')[0]);
                        setEndDate(saturday.toISOString().split('T')[0]);
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Current Week
                    </button>
                  </div>
                </div>
                {startDate && endDate && (
                  <p className="mt-4 text-sm text-gray-600">
                    Period: <span className="font-semibold">{formatPeriod()}</span> (
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                  </p>
                )}
              </div>

              {/* Payroll Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Gross Pay</p>
                  <p className="text-2xl font-bold text-green-600">{formatINR(totals.grossPay)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Advances</p>
                  <p className="text-2xl font-bold text-orange-600">{formatINR(totals.advances)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-600">Net Payable</p>
                  <p className="text-2xl font-bold text-blue-600">{formatINR(totals.grossPay - totals.advances)}</p>
                </div>
              </div>

              {/* Save Payroll Section */}
              {payrollPreview.length > 0 && !isGuest() && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Save Payroll Records</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g., Weekly payroll for week ending 26/01/2026"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleSavePayroll}
                        className="w-full bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-semibold"
                      >
                        Save All Payroll Records
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payroll Preview Records */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Preview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gross Pay
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Advances
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net Payable
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payrollPreview.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            {loading ? 'Loading...' : 'No payroll data found. Please select a date range.'}
                          </td>
                        </tr>
                      ) : (
                        payrollPreview.map((record) => (
                          <tr key={record.employeeId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.employeeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatINR(record.salary)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                              {formatINR(record.totalAdvance)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                              {formatINR(record.salary - record.totalAdvance)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {record.attendance.length} days
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatINR(totals.grossPay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                          {formatINR(totals.advances)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                          {formatINR(totals.grossPay - totals.advances)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
