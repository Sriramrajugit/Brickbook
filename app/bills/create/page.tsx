'use client';

import { useState, useEffect } from 'react';
import MobileNav from '@/app/components/MobileNav';
import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  name: string;
  partnerType: string;
}

interface OCRResult {
  supplierName: string | null;
  invoiceNumber: string | null;
  date: string | null;
  amount: string | null;
}

interface Account {
  id: number;
  name: string;
}

export default function CreateBillPage() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('GPAY');
  const [remarks, setRemarks] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Calculate balance
  const totalAmount = parseFloat(amount) || 0;
  const paid = parseFloat(paidAmount) || 0;
  const balance = totalAmount - paid;

  // OCR states
  const [ocrProcessing, setOCRProcessing] = useState(false);
  const [ocrResults, setOCRResults] = useState<OCRResult | null>(null);
  const [showOCRResults, setShowOCRResults] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

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

  // Fetch accounts for payment selection
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          const accountsList = data.data || data;
          setAccounts(Array.isArray(accountsList) ? accountsList : []);
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, []);

  const processOCR = async (file: File) => {
    setOCRProcessing(true);
    setError('');
    setShowOCRResults(false);
    
    // Note: Manual OCR reminder instead of automatic processing
    // If you want to extract data from the image, you can:
    // 1. Look at the image preview below
    // 2. Manually enter the extracted information
    
    console.log('Image selected for reference. Please manually enter bill details above.');
    setOCRProcessing(false);
    
    // Show a helpful message instead of processing
    setOCRResults(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, GIF, and PDF files are allowed');
        return;
      }
      setBillFile(file);
      setError('');

      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Auto-process OCR
      processOCR(file);
    }
  };

  const applyOCRData = () => {
    if (!ocrResults) return;

    if (ocrResults.invoiceNumber) {
      setInvoiceNo(ocrResults.invoiceNumber);
    }
    if (ocrResults.date) {
      // Try to parse date format
      const dateStr = ocrResults.date.replace(/\//g, '-').replace(/\s/g, '');
      // Assume DD-MM-YYYY or MM-DD-YYYY format
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        let formatted: string;
        if (parseInt(parts[0]) > 12) {
          // First part is day
          formatted = `2026-${parts[1]}-${parts[0]}`;
        } else if (parseInt(parts[1]) > 12) {
          // Second part is day
          formatted = `2026-${parts[0]}-${parts[1]}`;
        } else {
          // Assume MM-DD-YYYY
          formatted = `2026-${parts[0]}-${parts[1]}`;
        }
        setBillDate(formatted);
      }
    }
    if (ocrResults.amount) {
      setAmount(ocrResults.amount);
    }
    if (ocrResults.supplierName) {
      // Try to match supplier name
      const matchedSupplier = employees.find(emp =>
        emp.name.toLowerCase().includes(ocrResults.supplierName?.toLowerCase() || '')
      );
      if (matchedSupplier) {
        setEmployeeId(matchedSupplier.id.toString());
      }
    }

    setShowOCRResults(false);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/bills/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.data.filepath;
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'File upload failed');
        return null;
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Error uploading file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!employeeId || !accountId || !invoiceNo || !billDate || !amount) {
        setError('Please fill in all required fields (including Account)');
        setLoading(false);
        return;
      }

      let billImagePath = null;

      // Upload file if selected
      if (billFile) {
        billImagePath = await uploadFile(billFile);
        if (!billImagePath) {
          setLoading(false);
          return;
        }
      }

      // Create bill
      const billData = {
        employeeId: parseInt(employeeId),
        accountId: parseInt(accountId),
        invoiceNo,
        billDate,
        dueDate: dueDate || null,
        amount: parseFloat(amount),
        paidAmount: parseFloat(paidAmount) || 0,
        billImagePath,
        paymentMode,
        remarks: remarks || null,
      };

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage('Bill created successfully!');
        setTimeout(() => {
          router.push(`/bills/${data.data.id}`);
        }, 1000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to create bill');
      }
    } catch (err) {
      console.error('Error creating bill:', err);
      setError('Error creating bill');
    } finally {
      setLoading(false);
    }
  };

  if (isGuest()) {
    return <div className="p-8 text-center">You don't have permission to create bills</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/bills" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Bill</h1>
          </div>
        </header>

        <main>
          <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a supplier</option>
                {employees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Amount Section */}
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
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Balance (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Balance <span className="text-gray-500">(Calculated)</span>
              </label>
              <input
                type="text"
                value={balance >= 0 ? balance.toFixed(2) : '-' + Math.abs(balance).toFixed(2)}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Account for Bill Payments - Always Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account for Payments <span className="text-red-500">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">All payments for this bill will use this account</p>
            </div>

            {/* Payment Mode - Show only if paidAmount > 0 */}
            {parseFloat(paidAmount) > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GPAY">G-Pay</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            )}

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

            {/* File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Bill Image/PDF (Max 2MB)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  {billFile ? (
                    <div>
                      <p className="text-green-600 font-medium">{billFile.name}</p>
                      <p className="text-sm text-gray-600">
                        ({(billFile.size / 1024 / 1024).toFixed(2)}MB)
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-600">
                        PNG, JPG, GIF or PDF (up to 2MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* OCR Processing Status */}
          {ocrProcessing && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">� Image received</p>
              <p className="text-xs text-blue-700 mt-2">You can now manually fill in the bill details by referencing the image preview</p>
            </div>
          )}

          {/* OCR Results Modal */}
          {showOCRResults && ocrResults && (
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                ✅ OCR Extraction Results
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Preview */}
                {preview && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Bill Preview</p>
                    <img
                      src={preview}
                      alt="Bill preview"
                      className="max-h-48 rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                {/* Extracted Data */}
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Invoice Number</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {ocrResults.invoiceNumber || '(Not detected)'}
                  </p>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {ocrResults.date || '(Not detected)'}
                  </p>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Amount</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {ocrResults.amount || '(Not detected)'}
                  </p>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Supplier Name</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {ocrResults.supplierName || '(Not detected)'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyOCRData}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  ✓ Apply to Form
                </button>
                <button
                  type="button"
                  onClick={() => setShowOCRResults(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
                >
                  ✗ Dismiss
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-3">
                💡 Tip: Review the extracted data. You can still edit the fields manually after applying.
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading || uploading || ocrProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading || uploading ? 'Creating...' : ocrProcessing ? 'Scanning...' : 'Create Bill'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
