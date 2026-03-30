'use client';

import { useState, useEffect } from 'react';
import MobileNav from '../components/MobileNav';
import ProfileMenu from '../components/ProfileMenu';
import { useAuth } from '../components/AuthProvider';
import { formatINR } from '@/lib/formatters';

interface PayrollPreview {
  employeeId: number;
  employeeName: string;
  salaryFrequency: string;
  baseSalary: number;
  salary: number;
  totalAdvance: number;
  totalSalaryPaid: number;
  attendance: any[];
}

interface Account {
  id: number;
  name: string;
  type?: string;
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
  
  // Selection states
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [alreadyPaidEmployees, setAlreadyPaidEmployees] = useState<Set<number>>(new Set());

  // Fetch accounts for filter dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          // Filter out Contract and Supplier accounts - only show Project and General accounts for payroll
          const filteredAccounts = data.filter((acc: Account) => 
            acc.type !== 'Contract' && acc.type !== 'Supplier'
          );
          setAccounts(filteredAccounts);
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
  const monthlyEmployees = payrollPreview.filter(emp => emp.salaryFrequency === 'M');
  const dailyEmployees = payrollPreview.filter(emp => emp.salaryFrequency === 'D');

  // Filter to only selected employees
  const selectedMonthlyEmployees = monthlyEmployees.filter(emp => selectedEmployees.has(emp.employeeId));
  const selectedDailyEmployees = dailyEmployees.filter(emp => selectedEmployees.has(emp.employeeId));
  const selectedPayrollPreview = payrollPreview.filter(emp => selectedEmployees.has(emp.employeeId));

  const calculateTotals = (employees: PayrollPreview[]) => {
    return employees.reduce(
      (acc, record) => ({
        grossPay: acc.grossPay + (record.salary || 0),
        advances: acc.advances + (record.totalAdvance || 0),
        salaryPaid: acc.salaryPaid + (record.totalSalaryPaid || 0),
      }),
      { grossPay: 0, advances: 0, salaryPaid: 0 }
    );
  };

  const monthlyTotals = calculateTotals(selectedMonthlyEmployees);
  const dailyTotals = calculateTotals(selectedDailyEmployees);
  const totalTotals = calculateTotals(selectedPayrollPreview);

  const totals = {
    grossPay: totalTotals.grossPay,
    advances: totalTotals.advances,
    salaryPaid: totalTotals.salaryPaid
  };

  // Handle individual employee checkbox
  const handleEmployeeToggle = (employeeId: number) => {
    if (alreadyPaidEmployees.has(employeeId)) return; // Prevent toggling already paid
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  // Handle "Select All" for monthly employees
  const handleSelectAllMonthly = (selectAll: boolean) => {
    const newSelected = new Set(selectedEmployees);
    monthlyEmployees.forEach((emp) => {
      if (!alreadyPaidEmployees.has(emp.employeeId)) {
        if (selectAll) {
          newSelected.add(emp.employeeId);
        } else {
          newSelected.delete(emp.employeeId);
        }
      }
    });
    setSelectedEmployees(newSelected);
  };

  // Handle "Select All" for daily employees
  const handleSelectAllDaily = (selectAll: boolean) => {
    const newSelected = new Set(selectedEmployees);
    dailyEmployees.forEach((emp) => {
      if (!alreadyPaidEmployees.has(emp.employeeId)) {
        if (selectAll) {
          newSelected.add(emp.employeeId);
        } else {
          newSelected.delete(emp.employeeId);
        }
      }
    });
    setSelectedEmployees(newSelected);
  };

  // Fetch payroll preview from backend
  useEffect(() => {
    if (!startDate || !endDate) return;
    
    // Validate date range
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (startDateTime > endDateTime) {
      setError('From Date must be less than To Date');
      setPayrollPreview([]);
      setLoading(false);
      return;
    }
    
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
        
        // Check if data is empty and set appropriate message
        if (!data || data.length === 0) {
          setError('No records found for this date range. Payroll may have already been processed.');
          setPayrollPreview([]);
        } else {
          setPayrollPreview(data);
        }
        
        // Fetch which employees already have payroll for this period
        const paidRes = await fetch(`/api/payroll/paid?fromDate=${startDate}&toDate=${endDate}`);
        if (paidRes.ok) {
          const paidData = await paidRes.json();
          const paidIds = new Set(paidData.map((p: any) => p.employeeId));
          setAlreadyPaidEmployees(paidIds);
          
          // Auto-select unpaid employees
          if (data && data.length > 0) {
            const unpaidEmployees = new Set<number>();
            data.forEach((emp: PayrollPreview) => {
              if (!paidIds.has(emp.employeeId)) {
                unpaidEmployees.add(emp.employeeId);
              }
            });
            setSelectedEmployees(unpaidEmployees);
          }
        }
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
    if (!startDate || !endDate) {
      setError('Please select a date range first.');
      return;
    }

    // Validate date range
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (startDateTime > endDateTime) {
      setError('From Date must be less than To Date');
      return;
    }

    if (payrollPreview.length === 0) {
      setError('No payroll records to save.');
      return;
    }

    if (selectedEmployees.size === 0) {
      setError('Please select at least one employee to save payroll.');
      return;
    }

    // Validate: End date should not be in future
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    endDateTime.setHours(0, 0, 0, 0);

    if (endDateTime >= tomorrow) {
      setError('Cannot save payroll for future dates. Please select a past or current date range.');
      return;
    }

    // Check for monthly employees and validate date range makes sense for monthly processing
    const selectedMonthlyList = selectedMonthlyEmployees;
    if (selectedMonthlyList.length > 0) {
      // For monthly employees, ideally the range should be the full month or at least notify
      const startMonth = new Date(startDate).getMonth();
      const endMonth = new Date(endDate).getMonth();
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      
      if (startMonth !== endMonth || startYear !== endYear) {
        setError('For monthly employees, date range should be within the same calendar month. Please adjust your date range.');
        return;
      }
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

      // Save only selected employees
      const recordsToSave = payrollPreview.filter(record => selectedEmployees.has(record.employeeId));
      
      // Double-check: filter out employees who are marked as already paid
      const recordsToActuallySave = recordsToSave.filter(record => !alreadyPaidEmployees.has(record.employeeId));
      
      if (recordsToActuallySave.length === 0) {
        // Check if all selected employees were already paid
        const alreadyPaidCount = recordsToSave.filter(r => alreadyPaidEmployees.has(r.employeeId)).length;
        if (alreadyPaidCount > 0) {
          setError(`All selected employees already have payroll processed for this period. Please deselect them to continue.`);
        } else {
          setError('No employees to save.');
        }
        return;
      }

      const skippedEmployees = recordsToSave.filter(record => alreadyPaidEmployees.has(record.employeeId));
      if (skippedEmployees.length > 0) {
        console.warn('⏭️ Skipping already-paid employees:', skippedEmployees.map(e => e.employeeName).join(', '));
      }

      const savePromises = recordsToActuallySave.map(async (record) => {
        const netBalance = record.salary - record.totalAdvance;

        // Step 1: Create payroll record
        const payrollPayload = {
          employeeId: record.employeeId,
          accountId: accountId,
          fromDate: startDate,
          toDate: endDate,
          amount: netBalance,
          remarks: remarks || null,
        };
        console.log('📤 Saving payroll for', record.employeeName, ':', payrollPayload);
        
        const payrollRes = await fetch('/api/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payrollPayload),
        });

        // Check for 409 conflict
        if (payrollRes.status === 409) {
          const conflictData = await payrollRes.json();
          const errorMsg = conflictData.error || 'Payroll already saved';
          console.warn(`⚠️ Conflict for ${record.employeeName}: ${errorMsg}`);
          return { 
            success: false, 
            employeeName: record.employeeName,
            error: errorMsg 
          };
        }

        if (!payrollRes.ok) {
          const errData = await payrollRes.json();
          const errorMsg = errData.details || errData.error || 'Failed to create payroll record';
          console.error(`❌ Error for ${record.employeeName}: ${errorMsg}`);
          return { 
            success: false, 
            employeeName: record.employeeName,
            error: errorMsg 
          };
        }

        // Step 2: Create transaction entry only if there's a net balance to pay
        if (netBalance > 0) {
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
            const errorMsg = errData.error || 'Failed to create salary transaction';
            console.error(`❌ Transaction error for ${record.employeeName}: ${errorMsg}`);
            return { 
              success: false, 
              employeeName: record.employeeName,
              error: `Payroll saved but transaction failed: ${errorMsg}` 
            };
          }
        }

        return { success: true, employeeName: record.employeeName };
      });

      const results = await Promise.all(savePromises);
      
      // Check if all or some failed
      const failedResults = results.filter((r: any) => !r.success);
      const successResults = results.filter((r: any) => r.success);
      
      // Handle results
      if (successResults.length > 0) {
        console.log(`✅ Successfully saved payroll for ${successResults.length} employee(s)`);
      }
      
      if (failedResults.length > 0) {
        // Separate already-paid errors from other errors
        const alreadyPaidErrors = failedResults.filter(r => r.error?.includes('already'));
        const otherErrors = failedResults.filter(r => !r.error?.includes('already'));
        
        let errorMsg = '';
        if (alreadyPaidErrors.length > 0) {
          errorMsg += `⏭️ Already Paid (${alreadyPaidErrors.length}): ${alreadyPaidErrors.map(r => r.employeeName).join(', ')}\n`;
        }
        if (otherErrors.length > 0) {
          errorMsg += `❌ Failed to Save:\n${otherErrors.map(r => `${r.employeeName}: ${r.error}`).join('\n')}`;
        }
        
        // If some succeeded, show partial success message
        if (successResults.length > 0) {
          setError(errorMsg);
          // Still mark as partial success since some were saved
          setSaveSuccess(true);
          setRemarks('');
          setStartDate('');
          setEndDate('');
          setPayrollPreview([]);
          
          setTimeout(() => {
            setSaveSuccess(false);
          }, 4000);
          return;
        } else {
          // All failed
          throw new Error(errorMsg);
        }
      }


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
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-green-600">💰</span>
              Payroll
            </h1>
            <div className="hidden lg:block">
              <ProfileMenu />
            </div>
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
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setError(''); // Clear error when user changes date
                      }}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date (Saturday)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setError(''); // Clear error when user changes date
                      }}
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
                    <div className="flex items-end gap-2">
                      <button
                        onClick={handleSavePayroll}
                        disabled={selectedEmployees.size === 0}
                        className="w-full bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Save Payroll ({selectedEmployees.size} Selected)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payroll Preview Records */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Preview</h3>

                {/* MONTHLY EMPLOYEES SECTION */}
                {monthlyEmployees.length > 0 && (
                <div className="mb-8">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900 flex items-center">
                        📅 Monthly Employees ({monthlyEmployees.length})
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">Fixed monthly salary</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={monthlyEmployees.every(emp => selectedEmployees.has(emp.employeeId) || alreadyPaidEmployees.has(emp.employeeId))}
                        onChange={(e) => handleSelectAllMonthly(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-blue-900">Select All</span>
                    </label>
                  </div>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pay
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monthly Salary
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
                        {monthlyEmployees.map((record) => {
                          const netBalance = record.salary - record.totalAdvance;
                          const isPaid = alreadyPaidEmployees.has(record.employeeId);
                          const isSelected = selectedEmployees.has(record.employeeId);
                          return (
                            <tr 
                              key={record.employeeId}
                              className={isPaid ? 'bg-gray-100 opacity-60' : isSelected ? 'bg-blue-50' : ''}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleEmployeeToggle(record.employeeId)}
                                  disabled={isPaid}
                                  className="w-4 h-4 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isPaid ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {record.employeeName}
                                {isPaid && <span className="ml-2 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">Already Paid</span>}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isPaid ? 'text-gray-500' : 'text-green-600'}`}>
                                {formatINR(record.salary)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isPaid ? 'text-gray-500' : 'text-orange-600'}`}>
                                {formatINR(record.totalAdvance)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isPaid ? 'text-gray-500' : 'text-blue-600'}`}>
                                {formatINR(netBalance)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-blue-100">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">MONTHLY TOTAL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatINR(monthlyTotals.grossPay)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                            {formatINR(monthlyTotals.advances)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {formatINR(monthlyTotals.grossPay - monthlyTotals.advances)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                )}

                {/* DAILY EMPLOYEES SECTION */}
                {dailyEmployees.length > 0 && (
                <div className="mb-8">
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold text-amber-900 flex items-center">
                        📊 Daily Employees ({dailyEmployees.length})
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">Salary based on attendance + OT calculations</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dailyEmployees.every(emp => selectedEmployees.has(emp.employeeId) || alreadyPaidEmployees.has(emp.employeeId))}
                        onChange={(e) => handleSelectAllDaily(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-amber-900">Select All</span>
                    </label>
                  </div>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pay
                          </th>
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
                            Daily Rate
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
                        {dailyEmployees.map((record) => {
                          const daysWorked = record.attendance.reduce((total, att) => total + att.status, 0);
                          const otHours = record.attendance.reduce((total, att) => {
                            if (att.status === 1.5) return total + 4;
                            if (att.status === 2) return total + 8;
                            return total;
                          }, 0);
                          const netBalance = record.salary - record.totalAdvance;
                          const isPaid = alreadyPaidEmployees.has(record.employeeId);
                          const isSelected = selectedEmployees.has(record.employeeId);
                          
                          return (
                            <tr 
                              key={record.employeeId}
                              className={isPaid ? 'bg-gray-100 opacity-60' : isSelected ? 'bg-amber-50' : ''}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleEmployeeToggle(record.employeeId)}
                                  disabled={isPaid}
                                  className="w-4 h-4 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isPaid ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {record.employeeName}
                                {isPaid && <span className="ml-2 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">Already Paid</span>}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isPaid ? 'text-gray-500' : 'text-gray-700'}`}>
                                {daysWorked} days
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isPaid ? 'text-gray-500' : 'text-gray-700'}`}>
                                {otHours > 0 ? `${otHours} hrs` : '-'}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isPaid ? 'text-gray-500' : 'text-gray-600'}`}>
                                {formatINR(record.baseSalary)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isPaid ? 'text-gray-500' : 'text-green-600'}`}>
                                {formatINR(record.salary)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isPaid ? 'text-gray-500' : 'text-orange-600'}`}>
                                {formatINR(record.totalAdvance)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isPaid ? 'text-gray-500' : 'text-blue-600'}`}>
                                {formatINR(netBalance)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-amber-100">
                        <tr>
                          <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-900">DAILY TOTAL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatINR(dailyTotals.grossPay)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                            {formatINR(dailyTotals.advances)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {formatINR(dailyTotals.grossPay - dailyTotals.advances)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                )}

                {payrollPreview.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading...' : 'No payroll data found. Please select a date range.'}
                </div>
                )}

                {/* GRAND TOTAL FOOTER */}
                {payrollPreview.length > 0 && (
                <div className="bg-gray-900 text-white p-4 rounded-lg mt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-300">TOTAL GROSS PAY</p>
                      <p className="text-2xl font-bold text-green-400">{formatINR(totals.grossPay)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">TOTAL ADVANCES</p>
                      <p className="text-2xl font-bold text-orange-400">{formatINR(totals.advances)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">NET PAYABLE</p>
                      <p className="text-2xl font-bold text-blue-400">{formatINR(totals.grossPay - totals.advances)}</p>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
