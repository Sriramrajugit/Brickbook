export default function Accounts() {
  const accounts = [
    { id: 1, name: 'Main Account', balance: 50.00, type: 'Checking' },
    { id: 2, name: 'Savings', balance: 1000.00, type: 'Savings' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Expense Tracker</h2>
        </div>
        <nav className="mt-6">
          <a href="/" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Dashboard</a>
          <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">Accounts</a>
          <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Employees</a>
          <a href="/transactions" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Transactions</a>
          <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Attendance</a>
          <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Payroll</a>
          <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Reports</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Overview</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${account.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}