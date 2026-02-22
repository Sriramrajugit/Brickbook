'use client';

import { useState, useRef } from 'react';
import MobileNav from '../components/MobileNav';
import ProfileMenu from '../components/ProfileMenu';
import { useAuth } from '../components/AuthProvider';
import { formatINR } from '@/lib/formatters';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  details: any[];
}

export default function ImportTransactions() {
  const { user, canEdit } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        Date: '19-02-2026',
        Amount: 1500.50,
        Type: 'Cash-In',
        Account: 'Main Cash',
        Category: 'Sales',
        Description: 'Sample transaction 1',
        PaymentMode: 'G-Pay'
      },
      {
        Date: '18-02-2026',
        Amount: 500.00,
        Type: 'Cash-Out',
        Account: 'Main Cash',
        Category: 'Expenses',
        Description: 'Sample transaction 2',
        PaymentMode: 'Bank Transfer'
      }
    ];

    // Dynamically import XLSX for client-side usage
    import('xlsx').then(XLSX => {
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      XLSX.writeFile(workbook, 'transaction-template.xlsx');
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      // Show preview on file select
      await previewExcelFile(selectedFile);
    }
  };

  const previewExcelFile = async (excelFile: File) => {
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('preview', 'true');

      const res = await fetch('/api/import-transactions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.preview) {
        setPreviewData(data.preview);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Preview error:', error);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import-transactions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Import response:', { status: res.status, ok: res.ok, data });
      setResult(data);

      if (res.ok) {
        setFile(null);
        setShowPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: 0,
        failed: 0,
        errors: ['An unexpected error occurred during import'],
        details: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit()) {
    return (
      <div className="bg-gray-50">
        <MobileNav currentPage="/import" />
        <ProfileMenu />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">You do not have permission to import transactions. Only Owner and Site Manager roles can access this feature.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <MobileNav currentPage="/import" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">📥</span>
              Import Transactions
            </h1>
            <div className="hidden lg:block">
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">File Format Guide</h2>
          <p className="text-blue-800 mb-4">
            Your Excel file should contain the following columns:
          </p>
          <div className="bg-white rounded p-4 mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Column Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Format</th>
                  <th className="px-4 py-2 text-left font-semibold">Required</th>
                  <th className="px-4 py-2 text-left font-semibold">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-mono">Date</td>
                  <td className="px-4 py-2">DD-MM-YYYY</td>
                  <td className="px-4 py-2">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Yes</span>
                  </td>
                  <td className="px-4 py-2">19-02-2026</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">Amount</td>
                  <td className="px-4 py-2">Number</td>
                  <td className="px-4 py-2">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Yes</span>
                  </td>
                  <td className="px-4 py-2">1500.50</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">Type</td>
                  <td className="px-4 py-2">Cash-In or Cash-Out</td>
                  <td className="px-4 py-2">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Yes</span>
                  </td>
                  <td className="px-4 py-2">Cash-In</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">Account</td>
                  <td className="px-4 py-2">Account name</td>
                  <td className="px-4 py-2">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Yes</span>
                  </td>
                  <td className="px-4 py-2">Main Cash</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">Category</td>
                  <td className="px-4 py-2">Category name</td>
                  <td className="px-4 py-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">No</span>
                  </td>
                  <td className="px-4 py-2">Sales</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">Description</td>
                  <td className="px-4 py-2">Text</td>
                  <td className="px-4 py-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">No</span>
                  </td>
                  <td className="px-4 py-2">Monthly expenses</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">PaymentMode</td>
                  <td className="px-4 py-2">Text (defaults to G-Pay)</td>
                  <td className="px-4 py-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">No</span>
                  </td>
                  <td className="px-4 py-2">Bank Transfer</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Ensure your Excel file has headers in the first row matching the column names above.
          </p>
          <button
            onClick={downloadTemplate}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition inline-flex items-center gap-2"
          >
            📥 Download Template
          </button>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer block"
            >
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {file ? file.name : 'Choose Excel file'}
              </h3>
              <p className="text-gray-600">
                {file ? 'File selected. Click to change.' : 'Click to select an Excel file'}
              </p>
            </label>
          </div>

          {file && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Importing...' : 'Import Transactions'}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setShowPreview(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={loading}
                className="px-6 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        {showPreview && previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Preview ({previewData.length} rows)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Account</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{row.Date || '-'}</td>
                      <td className="px-4 py-2">{formatINR(row.Amount || 0)}</td>
                      <td className="px-4 py-2">{row.Type || '-'}</td>
                      <td className="px-4 py-2">{row.Account || '-'}</td>
                      <td className="px-4 py-2">{row.Category || '-'}</td>
                      <td className="px-4 py-2">{row.Description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 10 && (
              <p className="text-gray-600 mt-4">
                ... and {previewData.length - 10} more rows
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Import Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-green-600 font-semibold mb-1">Successful</p>
                <p className="text-2xl font-bold text-green-700">{result.success}</p>
              </div>
              <div className={`${result.failed > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded p-4`}>
                <p className={`${result.failed > 0 ? 'text-red-600' : 'text-gray-600'} font-semibold mb-1`}>Failed</p>
                <p className={`text-2xl font-bold ${result.failed > 0 ? 'text-red-700' : 'text-gray-700'}`}>{result.failed}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-600 font-semibold mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-700">{result.success + result.failed}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                <h3 className="font-semibold text-red-900 mb-3">Errors</h3>
                <ul className="space-y-2">
                  {result.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx} className="text-red-800 text-sm">
                      • {error}
                    </li>
                  ))}
                </ul>
                {result.errors.length > 5 && (
                  <p className="text-red-800 text-sm mt-2">... and {result.errors.length - 5} more errors</p>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setResult(null);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Import Another File
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
