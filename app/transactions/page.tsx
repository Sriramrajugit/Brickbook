'use client';

import { useState, useEffect } from 'react';
import MobileNav from '../components/MobileNav';
import { useAuth } from '../components/AuthProvider';
import { formatINR } from '@/lib/formatters';

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  status: string;
}

interface Transaction {
  id: number;
  amount: number;
  description: string | null;
  category: string;
  type: string;
  paymentMode?: string;
  date: string;
  account: { name: string };
  createdByUser?: {
    id: number;
    name: string | null;
    email: string | null;
    role: string;
  } | null;
}

export default function Transactions() {
  const { canEdit, isGuest, isOwner } = useAuth();
  
  // Filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [searchText, setSearchText] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit] = useState(10)

  // Sorting states
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Accounts and Categories from DB
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Transactions from DB
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state for auto-selecting type based on category
  const [transactionType, setTransactionType] = useState('Cash-Out');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMode, setFormPaymentMode] = useState('G-Pay');

  // Load accounts, categories, and transactions once
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        setAccounts(data);
        // Set first account as default
        if (data.length > 0) {
          setSelectedAccount(data[0].id.toString());
        }
      } catch (err) {
        console.error('Error loading accounts:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };

    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Failed to fetch employees');
        const data = await res.json();
        // Filter only active employees
        const activeEmployees = data.filter((emp: Employee) => emp.status === 'Active');
        setEmployees(activeEmployees);
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    };

    const fetchTransactions = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        });

        if (filterCategory !== 'All') params.append('category', filterCategory);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (searchText) params.append('search', searchText);

        const res = await fetch(`/api/transactions?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const result = await res.json();
        setTransactions(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.total);
      } catch (err) {
        console.error('Error loading transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
    fetchCategories();
    fetchEmployees();
    fetchTransactions();
  }, [currentPage, sortBy, sortOrder, filterCategory, startDate, endDate, searchText, limit]);

  // Helper function to refresh transactions
  const refreshTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });
      if (filterCategory !== 'All') params.append('category', filterCategory);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchText) params.append('search', searchText);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const result = await res.json();
      setTransactions(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRecords(result.pagination.total);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
      throw err;
    }
  };

  // Handle category change to auto-set type
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    if (category === 'Capital') {
      setTransactionType('Cash-in');
    } else {
      setTransactionType('Cash-Out');
    }
    // Reset employee selection when category changes
    setSelectedEmployee('');
  };

  const handleEdit = async (transaction: Transaction) => {
    setIsEditMode(true);
    setEditingTransactionId(transaction.id);
    setSelectedCategory(transaction.category);
    setTransactionType(transaction.type);
    setFormAmount(transaction.amount.toString());
    setFormDescription(transaction.description || '');
    setFormDate(new Date(transaction.date).toISOString().split('T')[0]);
    setFormPaymentMode(transaction.paymentMode || 'G-Pay');
    
    // Find account ID by name
    const account = accounts.find(acc => acc.name === transaction.account.name);
    if (account) {
      setSelectedAccount(account.id.toString());
    }

    // For Salary Advance, fetch the related advance record to get employeeId
    if (transaction.category === 'Salary Advance') {
      try {
        // Fetch all employees (not just active ones) to find the partner
        const empRes = await fetch('/api/employees');
        const allEmployees = empRes.ok ? await empRes.json() : [];
        console.log('All employees fetched:', allEmployees);
        
        const advancesRes = await fetch('/api/advances');
        if (advancesRes.ok) {
          const advancesData = await advancesRes.json();
          console.log('Available advances:', advancesData);
          console.log('Looking for Salary Advance with:');
          console.log('  Amount:', transaction.amount, 'Type:', typeof transaction.amount);
          console.log('  Date:', transaction.date);
          
          // Find advance record that matches this transaction amount and date
          // Use flexible matching to account for Decimal/Float differences
          const matchingAdvance = advancesData.find(
            (adv: any) => {
              const advAmount = Number(adv.amount);
              const txAmount = Number(transaction.amount);
              const advDate = new Date(adv.date).toDateString();
              const txDate = new Date(transaction.date).toDateString();
              
              // Check if amounts are within 0.01 (to account for rounding)
              const amountsMatch = Math.abs(advAmount - txAmount) < 0.01;
              const datesMatch = advDate === txDate;
              const matches = amountsMatch && datesMatch;
              
              console.log(`Advance ${adv.id}: Amount ${advAmount} (match: ${amountsMatch}), Date ${advDate} (match: ${datesMatch}) => ${matches}`);
              
              return matches;
            }
          );
          
          console.log('Matching advance:', matchingAdvance);
          
          if (matchingAdvance && matchingAdvance.employee && matchingAdvance.employee.id) {
            const empId = matchingAdvance.employee.id.toString();
            const empName = matchingAdvance.employee.name || '';
            console.log('Found employee ID from nested object:', empId, 'Name:', empName);
            setSelectedEmployee(empId);
            setSelectedEmployeeName(empName);
            console.log('Setting selectedEmployee to:', empId, 'name:', empName);
          } else if (matchingAdvance && matchingAdvance.employeeId) {
            const empId = matchingAdvance.employeeId.toString();
            console.log('Found employeeId directly:', empId);
            setSelectedEmployee(empId);
            // Try to find name from allEmployees
            if (allEmployees && allEmployees.length > 0) {
              const emp = allEmployees.find((e: any) => e.id.toString() === empId);
              if (emp) {
                setSelectedEmployeeName(emp.name || '');
                console.log('Found employee name:', emp.name);
              }
            }
            console.log('Setting selectedEmployee to:', empId);
          } else {
            console.log('No matching advance found or invalid employee data');
            setSelectedEmployee('');
            setSelectedEmployeeName('');
          }
        }
      } catch (err) {
        console.error('Error fetching advance for edit:', err);
      }
    }
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingTransactionId(null);
    setSelectedCategory('');
    setSelectedEmployee('');
    setSelectedEmployeeName('');
    setTransactionType('Cash-Out');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode('G-Pay');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete transaction');
      }

      alert('Transaction deleted successfully!');
      
      // Refresh transactions list
      await refreshTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete transaction');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate: Amount should not be empty or zero
    const amount = parseFloat(data.amount as string);
    if (!data.amount || isNaN(amount) || amount <= 0) {
      alert('Amount is required and must be greater than 0');
      return;
    }

    // Validate: Date should not be empty
    if (!data.date) {
      alert('Date is required');
      return;
    }

    // Validate: No future dates allowed
    const transactionDate = new Date(data.date as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);
    
    if (transactionDate > today) {
      alert('Future date transactions are not allowed. Only past or current date is allowed.');
      return;
    }

    // Validate: Partner is required for Salary Advance and Salary
    if ((data.category === 'Salary Advance' || data.category === 'Salary') && !selectedEmployee) {
      alert('Please select a partner for ' + data.category);
      return;
    }

    // Validate: Account is required
    if (!data.accountId) {
      alert('Account is required');
      return;
    }

    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `/api/transactions/${editingTransactionId}` : '/api/transactions';
      
      // POST or PUT to API to save to database
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(data.amount as string),
          description: data.description as string || null,
          category: data.category as string,
          type: data.type as string,
          paymentMode: data.paymentMode as string,
          date: data.date as string,
          accountId: Number(data.accountId as string),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save transaction');
      }

      const savedTransaction = await res.json();
      
      // Store edit mode state before resetting
      const wasEditMode = isEditMode;
      
      // Handle Advance record updates/creation
      if ((data.category === 'Salary Advance' || data.category === 'Salary') && selectedEmployee) {
        try {
          const advancesRes = await fetch('/api/advances');
          if (advancesRes.ok) {
            const advancesData = await advancesRes.json();
            
            if (wasEditMode) {
              // In edit mode: First delete the old advance record(s) for this employee on this date
              // This prevents duplicates when amount or date changes
              const oldAdvancesToDelete = advancesData.filter(
                (adv: any) => {
                  const advDate = new Date(adv.date).toDateString();
                  const txDate = new Date(data.date as string).toDateString();
                  return Number(adv.employeeId) === parseInt(selectedEmployee) && advDate === txDate;
                }
              );
              
              console.log('Old advances to delete:', oldAdvancesToDelete);
              
              // Delete old advance records
              for (const oldAdv of oldAdvancesToDelete) {
                try {
                  const deleteRes = await fetch('/api/advances', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: oldAdv.id }),
                  });
                  if (deleteRes.ok) {
                    console.log('Deleted old advance record:', oldAdv.id);
                  }
                } catch (delErr) {
                  console.error('Error deleting old advance:', delErr);
                }
              }
              
              // Now create a new advance record with the updated details
              const createRes = await fetch('/api/advances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  employeeId: parseInt(selectedEmployee),
                  amount: parseFloat(data.amount as string),
                  reason: data.description as string || data.category,
                  date: data.date as string,
                }),
              });
              
              if (createRes.ok) {
                console.log('Created new advance record successfully');
              } else {
                console.error('Failed to create new advance record');
              }
            } else {
              // New transaction - create advance record
              const advanceRes = await fetch('/api/advances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  employeeId: parseInt(selectedEmployee),
                  amount: parseFloat(data.amount as string),
                  reason: data.description as string || data.category,
                  date: data.date as string,
                }),
              });

              if (!advanceRes.ok) {
                console.error('Failed to create advance record');
              } else {
                console.log('Advance record created successfully');
              }
            }
          }
        } catch (advErr) {
          console.error('Error handling advance:', advErr);
        }
      }
      
      // Reset form and edit mode
      setSelectedCategory('');
      setSelectedEmployee('');
      setSelectedEmployeeName('');
      setIsEditMode(false);
      setEditingTransactionId(null);
      setFormAmount('');
      setFormDescription('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormPaymentMode('G-Pay');
      setTransactionType('Cash-Out');
      
      // Show success message
      alert(wasEditMode ? 'Transaction updated successfully!' : 'Transaction saved successfully!');
      
      // Refresh transactions list
      setCurrentPage(1);
      await refreshTransactions();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert(err instanceof Error ? err.message : 'Failed to save transaction');
    }
  };

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/transactions" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-red-600">📝</span>
              Transactions
            </h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Add Transaction - Only for OWNER and SITE_MANAGER */}
              {canEdit() && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isEditMode ? 'Edit Transaction' : 'Add New Entry'}
                </h3>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      name="category"
                      required
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(selectedCategory === 'Salary Advance' || selectedCategory === 'Salary') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Partner <span className="text-red-500">*</span>
                      </label>
                      {isEditMode && selectedEmployeeName ? (
                        <>
                          <input
                            type="text"
                            value={selectedEmployeeName}
                            disabled
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Employee: {selectedEmployeeName}</p>
                        </>
                      ) : (
                        <select
                          value={selectedEmployee}
                          onChange={(e) => {
                            const empId = e.target.value;
                            setSelectedEmployee(empId);
                            // Auto-populate description with Partner Name + Category
                            if ((selectedCategory === 'Salary Advance' || selectedCategory === 'Salary') && empId) {
                              const selectedEmp = employees.find(emp => emp.id.toString() === empId);
                              if (selectedEmp) {
                                setFormDescription(`${selectedEmp.name} - ${selectedCategory}`);
                              }
                            }
                          }}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                          required
                        >
                          <option value="">Select Partner</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id.toString()}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      name="description"
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      name="type"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    >
                      <option>Cash-in</option>
                      <option>Cash-Out</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Mode
                    </label>
                    <select
                      name="paymentMode"
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    >
                      <option>Cash</option>
                      <option>G-Pay</option>
                      <option>Bank Transfer</option>
                      <option>Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      title="Only past or current date allowed"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="accountId"
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        {isEditMode ? 'Update Entry' : 'Add Entry'}
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

              {/* Filters */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Description or category..."
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                      setFilterCategory('All')
                      setSearchText('')
                      setCurrentPage(1)
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                  <span className="text-sm text-gray-600 self-center">
                    Showing {transactions.length} of {totalRecords} transactions (Page {currentPage}/{totalPages})
                  </span>
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Transaction History
                </h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        onClick={() => handleSort('date')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('description')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('category')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('paymentMode')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Payment Mode {sortBy === 'paymentMode' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('amount')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('type')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      {isOwner() && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={isOwner() ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={isOwner() ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map(t => (
                        <tr key={t.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(t.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t.paymentMode || 'G-Pay'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatINR(t.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t.type}
                          </td>
                          {isOwner() && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(t)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(t.id)}
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
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} records
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
