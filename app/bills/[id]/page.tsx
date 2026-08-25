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

interface Bill {
  id: number;
  invoiceNo: string;
  billDate: string;
  dueDate: string | null;
  amount: number;
  paidAmount: number;
  status: string;
  billImagePath: string | null;
  accountId?: number;
  employee: Employee;
  account?: Account;
  payments: Payment[];
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

export default function BillDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isGuest, canEdit } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Payment form states
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
        setSuccessMessage('Payment recorded successfully!');
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

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!bill) {
    return (
      <div className="p-8 text-center">
        <p>Bill not found</p>
        <Link href="/bills" className="text-blue-600 hover:underline mt-4">
          Back to Bills
        </Link>
      </div>
    );
  }

  const balanceRemaining = bill.amount - bill.paidAmount;
  const progressPercent = (bill.paidAmount / bill.amount) * 100;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/bills" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Link href="/bills" className="text-blue-600 hover:underline mb-4 block">
              ← Back to Bills
            </Link>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Invoice {bill.invoiceNo}</h1>
              {!isGuest() && (
                <Link
                  href={`/bills/${bill.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  ✏️ Edit
                </Link>
              )}
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-gray-600">{bill.employee.name}</p>
                  </div>
                  <span
                    className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                      bill.status
                    )}`}
                  >
                    {getStatusLabel(bill.status)}
                  </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Bill Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDateDDMMYYYY(bill.billDate)}
              </p>
            </div>
            {bill.dueDate && (
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateDDMMYYYY(bill.dueDate)}
                </p>
              </div>
            )}
          </div>

          {/* Bill Image Preview */}
          {bill.billImagePath && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Bill Image</p>
              <div className="bg-gray-100 rounded-lg p-4">
                {bill.billImagePath.endsWith('.pdf') ? (
                  <a
                    href={bill.billImagePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    📄 View PDF
                  </a>
                ) : (
                  <img
                    src={bill.billImagePath}
                    alt="Bill"
                    className="max-w-full h-auto rounded"
                  />
                )}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatINR(bill.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatINR(bill.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatINR(balanceRemaining)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Payment Progress</p>
                <p className="text-sm font-semibold text-gray-700">
                  {progressPercent.toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Payments History */}
          {bill.payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment History
              </h3>
              <div className="space-y-3">
                {bill.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center border-b border-gray-200 pb-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDateDDMMYYYY(payment.paymentDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.paymentMode}
                        {payment.referenceNo && ` • ${payment.referenceNo}`}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatINR(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Record Payment Button */}
          {!isGuest && balanceRemaining > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {showPaymentForm ? '✕ Cancel' : '+ Record Payment'}
              </button>
            </div>
          )}
        </div>

        {/* Payment Form */}
        {showPaymentForm && !isGuest && balanceRemaining > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Payment
            </h3>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    max={balanceRemaining}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Max: {formatINR(balanceRemaining)}
                  </p>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="GPAY">G-Pay</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="IMPS">IMPS</option>
                  </select>
                </div>

                {/* Reference No */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference No (Optional)
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g., Transaction ID, Cheque No"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {submittingPayment ? 'Recording...' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
              </div>
            )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
