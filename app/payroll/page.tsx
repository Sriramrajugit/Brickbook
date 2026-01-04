'use client';

import { useState, useEffect } from 'react';
import MobileNav from '../components/MobileNav';
import { useAuth } from '../components/AuthProvider';
import { formatINR } from '@/lib/formatters';

interface PayrollPreview {
  employeeId: number;
  employeeName: string;
  baseSalary: number;
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
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details || errData.error || 'Failed to fetch payroll preview');
        }
        const data = await res.json();
        setPayrollPreview(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load payroll preview: ${errorMsg}`);
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

    if (!startDate || !endDate) {
      setError('Please select a date range first.');
      return;
    }

    // Validate: End date should not be in future
    const endDateTime = new Date(endDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    endDateTime.setHours(0, 0, 0, 0);

    if (endDateTime >= tomorrow) {
      setError('Cannot save payroll for future dates. Please select a past or current date range.');
      return;
    }

    try {
      setSaveSuccess(false);
      setError('');

      // Get the account ID for transactions
      const accountId = selectedAccount !== 'All' ? parseInt(selectedAccount) : accounts[0]?.id;
      if (!accountId) {
        setError('Please select an account.');
        return;
      }

      // First, check if payroll already exists for this period and create payroll + transaction records
      const savePromises = payrollPreview.map(async (record) => {
        const netBalance = record.salary - record.totalAdvance;

        // Step 1: Create payroll record
        const payrollRes = await fetch('/api/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: record.employeeId,
            accountId: accountId,
            fromDate: startDate,
            toDate: endDate,
            amount: netBalance,
            remarks: remarks || null,
          }),
        });

        // Check for 409 conflict (payroll already exists for this week)
        if (payrollRes.status === 409) {
          const conflictData = await payrollRes.json();
          throw new Error(conflictData.error || 'Payroll already saved for this week');
        }

        if (!payrollRes.ok) {
          const errData = await payrollRes.json();
          throw new Error(errData.error || 'Failed to create payroll record');
        }

        // Step 2: Create transaction entry for this employee's salary
        const transactionRes = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: netBalance,
            description: `Salary for ${record.employeeName}`,
            category: 'Salary',
            type: 'Cash-Out',
            paymentMode: 'Bank Transfer',
            date: endDate, // Use end date of payroll period
            accountId: accountId,
          }),
        });

        if (!transactionRes.ok) {
          const errData = await transactionRes.json();
          throw new Error(errData.error || 'Failed to create salary transaction');
        }

        return { payrollRes, transactionRes };
      });

      const results = await Promise.all(savePromises);

      // All successful - refresh the payroll data
      setSaveSuccess(true);
      setRemarks('');
      
      // Reset date range to show fresh data with 0 balance
      setStartDate('');
      setEndDate('');
      
      // Refresh payroll preview (will now show empty or 0 balance)
      setPayrollPreview([]);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error saving payroll records.';
      setError(errorMsg);
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
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-red-800 font-semibold">Error</p>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow mb-6">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-green-800 font-semibold">Payroll Saved Successfully!</p>
                      <p className="text-green-700 text-sm mt-1">All salary transactions have been created. Page will refresh shortly.</p>
                    </div>
                  </div>
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
                          Days Worked
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          OT Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Per Day Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gross Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Advances
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payrollPreview.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            {loading ? 'Loading...' : 'No payroll data found. Please select a date range.'}
                          </td>
                        </tr>
                      ) : (
                        payrollPreview.map((record) => {
                          // record.salary now contains the calculated gross salary based on attendance
                          const grossSalary = record.salary; // Already calculated in backend
                          const baseDailySalary = record.baseSalary || 0; // Base salary from employee record
                          
                          // Calculate Days Worked INCLUDING OT multipliers (sum of all status values)
                          // Present=1, OT4Hrs=1.5, OT8Hrs=2, Absent=0
                          const daysWorked = record.attendance.reduce((total, att) => total + att.status, 0);
                          
                          // Calculate OT hours: OT4Hrs (status=1.5) = 4 hours, OT8Hrs (status=2) = 8 hours
                          const otHours = record.attendance.reduce((total, att) => {
                            if (att.status === 1.5) return total + 4; // OT4Hrs
                            if (att.status === 2) return total + 8;   // OT8Hrs
                            return total;
                          }, 0);
                          
                          const netBalance = grossSalary - record.totalAdvance;
                          
                          return (
                            <tr key={record.employeeId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {record.employeeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {daysWorked} days
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {otHours > 0 ? `${otHours} hrs` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatINR(baseDailySalary)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                {formatINR(grossSalary)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                                {formatINR(record.totalAdvance)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                {formatINR(netBalance)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700"></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700"></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600"></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          {formatINR(totals.grossPay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                          {formatINR(totals.advances)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                          {formatINR(totals.grossPay - totals.advances)}
                        </td>
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
