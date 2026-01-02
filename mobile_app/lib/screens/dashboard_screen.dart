import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/account.dart';
import '../models/transaction.dart';
import '../models/company.dart';
import '../services/api_service.dart';
import '../widgets/drawer_menu.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Account> accounts = [];
  List<Transaction> transactions = [];
  Company? company;
  bool isLoading = true;
  String error = '';

  @override
  void initState() {
    super.initState();
    loadData();
  }

  // Refactored data fetching following web app pattern
  Future<void> fetchAccounts() async {
    try {
      final data = await ApiService.getAccounts();
      setState(() => accounts = data);
    } catch (err) {
      print('Error fetching accounts: $err');
    }
  }

  Future<void> fetchTransactions() async {
    try {
      final data = await ApiService.getTransactions();
      setState(() => transactions = data);
    } catch (err) {
      print('Error fetching transactions: $err');
    }
  }

  Future<void> fetchCompany() async {
    try {
      final companies = await ApiService.getCompanies();
      if (companies.isNotEmpty) {
        setState(() => company = companies.first);
      }
    } catch (err) {
      print('Error fetching company: $err');
    }
  }

  Future<void> loadData() async {
    try {
      setState(() => isLoading = true);
      
      // Load all data in parallel
      await Future.wait([
        fetchAccounts(),
        fetchTransactions(),
        fetchCompany(),
      ]);
      
      setState(() => isLoading = false);
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  // Calculate summary metrics from transactions
  double getTotalBudget() {
    return accounts.fold(0.0, (sum, acc) => sum + acc.budget);
  }

  double getTotalIncome() {
    return transactions
        .where((t) => t.type == 'Cash-in' || t.type == 'Cash-In')
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  double getTotalExpenses() {
    return transactions
        .where((t) => t.type == 'Cash-out' || t.type == 'Cash-Out')
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  // Get account-level summary
  Map<String, double> getAccountSummary(int accountId) {
    final accountTransactions =
        transactions.where((t) => t.accountId == accountId).toList();

    final income = accountTransactions
        .where((t) => t.type == 'Cash-in' || t.type == 'Cash-In')
        .fold(0.0, (sum, t) => sum + t.amount);

    final expenses = accountTransactions
        .where((t) => t.type == 'Cash-out' || t.type == 'Cash-Out')
        .fold(0.0, (sum, t) => sum + t.amount);

    return {'income': income, 'expenses': expenses};
  }

  // Format currency as INR
  String formatINR(double amount) {
    return NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 2,
    ).format(amount);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          if (company != null)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    company!.name,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.blue[700],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      drawer: const DrawerMenu(currentRoute: '/'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error.isNotEmpty
              ? Center(child: Text('Error: $error'))
              : RefreshIndicator(
                  onRefresh: loadData,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Overall Summary Cards
                        const Text(
                          'Summary',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildSummaryCards(),
                        const SizedBox(height: 24),

                        // Account Summaries
                        const Text(
                          'Account Summaries',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (accounts.isEmpty)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: Text('No accounts found'),
                            ),
                          )
                        else
                          ...accounts.map((account) =>
                              _buildAccountCard(account)),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSummaryCards() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildSummaryCard(
                title: 'Total Budget',
                amount: getTotalBudget(),
                color: Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSummaryCard(
                title: 'Cash In',
                amount: getTotalIncome(),
                color: Colors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildSummaryCard(
                title: 'Cash Out',
                amount: getTotalExpenses(),
                color: Colors.red,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSummaryCard(
                title: 'Net',
                amount: getTotalIncome() - getTotalExpenses(),
                color: (getTotalIncome() - getTotalExpenses()) >= 0
                    ? Colors.green
                    : Colors.red,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required double amount,
    required Color color,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              formatINR(amount),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountCard(Account account) {
    final summary = getAccountSummary(account.id);
    final netAmount = summary['income']! - summary['expenses']!;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      account.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      account.type,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: netAmount >= 0 ? Colors.green[50] : Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    formatINR(netAmount),
                    style: TextStyle(
                      color: netAmount >= 0 ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Budget',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      formatINR(account.budget),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cash In',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      formatINR(summary['income']!),
                      style: const TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cash Out',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      formatINR(summary['expenses']!),
                      style: const TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
