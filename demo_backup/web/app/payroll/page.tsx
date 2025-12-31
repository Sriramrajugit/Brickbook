export default function Payroll() {
  const payrolls = [
    { id: 1, employee: 'John Doe', period: 'Dec 16-22, 2025', daysWorked: 5, grossPay: 250.00, advances: 50.00, netPay: 200.00 },
    { id: 2, employee: 'Jane Smith', period: 'Dec 16-22, 2025', daysWorked: 6, grossPay: 360.00, advances: 0.00, netPay: 360.00 }
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
          <a href="/transactions" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Transactions</a>
          <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Accounts</a>
          <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Reports</a>
          <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Employees</a>
          <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Attendance</a>
          <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">Payroll</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Records</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advances</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrolls.map((payroll) => (
                      <tr key={payroll.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payroll.employee}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payroll.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payroll.daysWorked}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payroll.grossPay.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payroll.advances.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payroll.netPay.toFixed(2)}</td>
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