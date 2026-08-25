'use client';

import { useState, useEffect, use } from 'react';
import MobileNav from '@/app/components/MobileNav';
import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { formatINR, formatDateDDMMYYYY } from '@/lib/formatters';
import Link from 'next/link';

interface Employee {
  id: number;
  name: string;
  partnerType: string;
}

interface Payment {
  id: number;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  referenceNo: string | null;
  transactionId: number | null;
}

interface Account {
  id: number;
  name: string;
}

interface Bill {
  id: number;
  invoiceNo: string;
  billDate: string;
  dueDate: string | null;
  amount: number;
  paidAmount: number;
  status: string;
  remarks?: string | null;
  employeeId: number;
  accountId?: number;
  employee?: Employee;
  account?: Account;
  payments?: Payment[];
}

export default function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isGuest, canEdit } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states for bill
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Payment form states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('GPAY');
  const [referenceNo, setReferenceNo] = useState('');
  const [accountId, setAccountId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fetch bill details
  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bills/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setBill(data.data);
          setInvoiceNo(data.data.invoiceNo);
          setBillDate(data.data.billDate.split('T')[0]);
          setDueDate(data.data.dueDate ? data.data.dueDate.split('T')[0] : '');
          setAmount(data.data.amount.toString());
          setRemarks(data.data.remarks || '');
          // Set accountId from bill so payment form can use it as default
          if (data.data.accountId) {
            setAccountId(data.data.accountId.toString());
          }
        } else {
          setError('Bill not found');
        }
      } catch (err) {
        console.error('Error fetching bill:', err);
        setError('Error loading bill');
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [resolvedParams.id]);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.data);
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    };

    fetchAccounts();
  }, []);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setError('');

    try {
      if (!paymentAmount || !accountId) {
        setError('Please fill in all required payment fields');
        setSubmittingPayment(false);
        return;
      }

      const amount = parseFloat(paymentAmount);
      const balanceRemaining = bill!.amount - bill!.paidAmount;

      if (amount > balanceRemaining) {
        setError(
          `Payment amount (${formatINR(amount)}) cannot exceed remaining balance (${formatINR(balanceRemaining)})`
        );
        setSubmittingPayment(false);
        return;
      }

      const res = await fetch(`/api/bills/${resolvedParams.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentDate,
          amount,
          paymentMode,
          referenceNo,
          accountId: parseInt(accountId),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBill(data.data.bill);
        setSuccessMessage('Payment recorded successfully! Transaction created automatically.');
        setShowPaymentForm(false);

        // Reset form
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentAmount('');
        setReferenceNo('');
        setAccountId('');
        setPaymentMode('GPAY');

        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Error recording payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!invoiceNo || !billDate || !amount) {
      setError('Invoice No, Bill Date, and Amount are required');
      return;
    }

    const billAmount = parseFloat(amount);
    if (isNaN(billAmount) || billAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (bill && billAmount < bill.paidAmount) {
      setError(`Amount cannot be less than paid amount (₹${bill.paidAmount})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bills/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNo,
          billDate,
          dueDate: dueDate || null,
          amount: billAmount,
          remarks: remarks || null,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Bill updated successfully!');
        setTimeout(() => {
          router.push(`/bills/${resolvedParams.id}`);
        }, 1500);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to update bill');
      }
    } catch (err) {
      console.error('Error updating bill:', err);
      setError('Error updating bill');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
        <MobileNav currentPage="/bills" />
        <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
          <header className="bg-white shadow">
            <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900">Edit Bill</h1>
            </div>
          </header>
          <main>
            <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <p className="text-gray-600">Loading bill...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isGuest()) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
        <MobileNav currentPage="/bills" />
        <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
          <header className="bg-white shadow">
            <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900">Edit Bill</h1>
            </div>
          </header>
          <main>
            <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <p className="text-red-600 font-medium">You don't have permission to edit bills</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/bills" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Link href={`/bills/${resolvedParams.id}`} className="text-blue-600 hover:underline mb-4 block">
              ← Back to Bill
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Bill</h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}

              {/* Two-Column Layout: Form + Payment Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Bill Edit Form (2/3 width on large screens) */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Invoice No */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Invoice No <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          required
                          placeholder="e.g., INV-101"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Bill Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bill Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={billDate}
                          onChange={(e) => setBillDate(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Total Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        {bill && bill.paidAmount > 0 && (
                          <p className="text-xs text-gray-600 mt-2">
                            ℹ️ Already paid: ₹{bill.paidAmount.toFixed(2)} - Amount must be equal or greater
                          </p>
                        )}
                      </div>

                      {/* Paid Amount (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paid <span className="text-gray-500">(View Only)</span>
                        </label>
                        <input
                          type="text"
                          value={bill ? `₹${bill.paidAmount.toFixed(2)}` : '₹0.00'}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>

                      {/* Balance (Calculated) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Balance <span className="text-gray-500">(Calculated)</span>
                        </label>
                        <input
                          type="text"
                          value={bill ? `₹${(bill.amount - bill.paidAmount).toFixed(2)}` : '₹0.00'}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>

                      {/* Remarks */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description / Remarks (Optional)
                        </label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Enter any notes or remarks about this bill..."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Info Box */}
                      <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> You can only edit basic bill details. If payments have been recorded, the amount cannot be reduced below the paid amount.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="md:col-span-2 flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                          {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Right Column: Payment Summary + History (1/3 width on large screens) - STICKY */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-24">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">⚠️ Part Payment</h2>

                    {/* Payment Summary Cards */}
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      {/* Total Amount */}
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1">TOTAL AMOUNT</p>
                        <p className="text-xl font-bold text-blue-900">{bill && formatINR(bill.amount)}</p>
                      </div>

                      {/* Paid Amount */}
                      <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">PAID</p>
                        <p className="text-xl font-bold text-green-900">{bill && formatINR(bill.paidAmount)}</p>
                      </div>

                      {/* Balance */}
                      <div className={`rounded-lg p-3 ${bill && bill.amount - bill.paidAmount > 0 ? 'bg-red-50 border border-red-300' : 'bg-gray-50 border border-gray-300'}`}>
                        <p className={`text-xs font-medium ${bill && bill.amount - bill.paidAmount > 0 ? 'text-red-700' : 'text-gray-700'} mb-1`}>BALANCE</p>
                        <p className={`text-xl font-bold ${bill && bill.amount - bill.paidAmount > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                          {bill && formatINR(bill.amount - bill.paidAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Payment History */}
                    {bill && bill.payments && bill.payments.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {bill.payments.map((payment, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDateDDMMYYYY(payment.paymentDate)}
                                </p>
                                <p className="font-semibold text-green-700">
                                  {formatINR(payment.amount)}
                                </p>
                              </div>
                              <p className="text-xs text-gray-600">
                                {payment.paymentMode === 'GPAY' ? 'G-Pay' : 
                                 payment.paymentMode === 'CASH' ? 'Cash' :
                                 payment.paymentMode === 'BANK_TRANSFER' ? 'Bank Transfer' :
                                 payment.paymentMode === 'CHEQUE' ? 'Cheque' :
                                 payment.paymentMode}
                                {payment.referenceNo && ` • ${payment.referenceNo}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Payment Button */}
                    {bill && bill.amount - bill.paidAmount > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(!showPaymentForm)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition text-sm"
                        >
                          {showPaymentForm ? '✕ Cancel' : '+ Add Payment'}
                        </button>

                        {/* Inline Payment Form */}
                        {showPaymentForm && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <form onSubmit={handlePaymentSubmit} className="space-y-3">
                              {/* Payment Date */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Payment Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                  required
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                />
                              </div>

                              {/* Payment Amount */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  required
                                  placeholder="0.00"
                                  max={bill.amount - bill.paidAmount}
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                  Max: {formatINR(bill.amount - bill.paidAmount)}
                                </p>
                              </div>

                              {/* Account - Pre-filled from Bill (Read-only) */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Account <span className="text-gray-600">(Default from Bill)</span>
                                </label>
                                <input
                                  type="text"
                                  value={bill?.account?.name || 'Loading...'}
                                  readOnly
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">All payments for this bill will use the same account.</p>
                              </div>

                              {/* Payment Mode */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Payment Mode
                                </label>
                                <select
                                  value={paymentMode}
                                  onChange={(e) => setPaymentMode(e.target.value)}
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                >
                                  <option value="GPAY">G-Pay</option>
                                  <option value="BANK_TRANSFER">Bank Transfer</option>
                                  <option value="CASH">Cash</option>
                                  <option value="CHEQUE">Cheque</option>
                                  <option value="UPI">UPI</option>
                                </select>
                              </div>

                              {/* Reference No */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Reference No (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={referenceNo}
                                  onChange={(e) => setReferenceNo(e.target.value)}
                                  placeholder="Txn ID / Cheque No"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <button
                                  type="submit"
                                  disabled={submittingPayment}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition"
                                >
                                  {submittingPayment ? 'Recording...' : 'Record'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowPaymentForm(false)}
                                  className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium text-sm transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
