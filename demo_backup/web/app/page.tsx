export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Expense Tracker</h2>
        </div>
        <nav className="mt-6">
          <a href="/" className="block px-6 py-3 text-gray-700 hover:bg-gray-200 bg-gray-100">Dashboard</a>
          <a href="/transactions" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Transactions</a>
          <a href="/accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Accounts</a>
          <a href="/reports" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Reports</a>
          <a href="/employees" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Employees</a>
          <a href="/attendance" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Attendance</a>
          <a href="/payroll" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">Payroll</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Total Balance</h3>
                  <p className="text-2xl font-bold text-green-600">$50.00</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Income This Month</h3>
                  <p className="text-2xl font-bold text-blue-600">$100.00</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Expenses This Month</h3>
                  <p className="text-2xl font-bold text-red-600">$50.00</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Lunch</span>
                    <span className="text-red-600">-$50.00</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Salary</span>
                    <span className="text-green-600">+$100.00</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
