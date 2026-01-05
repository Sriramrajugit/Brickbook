import 'package:flutter/material.dart';
import '../models/account.dart';
import '../models/transaction.dart';
import '../services/api_service.dart';
import '../widgets/drawer_menu.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  List<Account> accounts = [];
  List<Transaction> transactions = [];
  Account? selectedAccount;
  DateTime? startDate;
  DateTime? endDate;
  bool loading = true;
  bool generatingReport = false;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    fetchAccounts();
  }

  Future<void> fetchAccounts() async {
    try {
      final accountList = await ApiService.getAccounts();
      setState(() {
        accounts = accountList;
        if (accountList.isNotEmpty) {
          selectedAccount = accountList.first;
        }
        loading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load accounts: ${e.toString()}';
        loading = false;
      });
    }
  }

  Future<void> generateReport() async {
    if (selectedAccount == null || startDate == null || endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select account and date range'),
        ),
      );
      return;
    }

    setState(() => generatingReport = true);

    try {
      final transactionList = await ApiService.getTransactions();
      
      // Filter transactions
      final filtered = transactionList.where((t) {
        final tDate = DateTime.parse(t.date);
        return t.accountId == selectedAccount!.id &&
            tDate.isAfter(startDate!) &&
            tDate.isBefore(endDate!.add(const Duration(days: 1)));
      }).toList();

      setState(() {
        transactions = filtered;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Report generated: ${filtered.length} transactions'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      setState(() => generatingReport = false);
    }
  }

  String formatCurrency(double amount) {
    return '₹${amount.toStringAsFixed(2).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      drawer: const DrawerMenu(currentRoute: '/reports'),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Report Filters
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Report Filters',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            
                            // Account Selection
                            DropdownButton<Account>(
                              isExpanded: true,
                              value: selectedAccount,
                              hint: const Text('Select Account'),
                              items: accounts.map((account) {
                                return DropdownMenuItem<Account>(
                                  value: account,
                                  child: Text(account.name),
                                );
                              }).toList(),
                              onChanged: (Account? newValue) {
                                setState(() => selectedAccount = newValue);
                              },
                            ),
                            const SizedBox(height: 16),

                            // Date Range
                            Row(
                              children: [
                                Expanded(
                                  child: ListTile(
                                    title: const Text('Start Date'),
                                    subtitle: Text(
                                      startDate?.toLocal().toString().split(' ')[0] ?? 'Select',
                                    ),
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: startDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime.now(),
                                      );
                                      if (picked != null) {
                                        setState(() => startDate = picked);
                                      }
                                    },
                                  ),
                                ),
                                Expanded(
                                  child: ListTile(
                                    title: const Text('End Date'),
                                    subtitle: Text(
                                      endDate?.toLocal().toString().split(' ')[0] ?? 'Select',
                                    ),
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: endDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime.now(),
                                      );
                                      if (picked != null) {
                                        setState(() => endDate = picked);
                                      }
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Generate Report Button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: generatingReport ? null : generateReport,
                                child: generatingReport
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Text('Generate Report'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Report Summary
                    if (transactions.isNotEmpty) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Summary',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceAround,
                                children: [
                                  _buildSummaryCard(
                                    label: 'Total Cash In',
                                    amount: transactions
                                        .where((t) => t.type == 'Cash-in')
                                        .fold(0.0,
                                            (sum, t) => sum + t.amount),
                                    color: Colors.green,
                                  ),
                                  _buildSummaryCard(
                                    label: 'Total Cash Out',
                                    amount: transactions
                                        .where((t) => t.type == 'Cash-Out')
                                        .fold(0.0,
                                            (sum, t) => sum + t.amount),
                                    color: Colors.red,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Transactions Table
                      const Text(
                        'Transaction Details',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Card(
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            columns: const [
                              DataColumn(label: Text('Date')),
                              DataColumn(label: Text('Category')),
                              DataColumn(label: Text('Type')),
                              DataColumn(label: Text('Amount')),
                            ],
                            rows: transactions.map((t) {
                              return DataRow(
                                cells: [
                                  DataCell(
                                    Text(
                                      DateTime.parse(t.date)
                                          .toLocal()
                                          .toString()
                                          .split(' ')[0],
                                    ),
                                  ),
                                  DataCell(Text(t.category)),
                                  DataCell(Text(t.type)),
                                  DataCell(
                                    Text(formatCurrency(t.amount)),
                                  ),
                                ],
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ],

                    if (errorMessage.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 16.0),
                        child: Text(
                          errorMessage,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryCard({
    required String label,
    required double amount,
    required Color color,
  }) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.grey),
        ),
        const SizedBox(height: 4),
        Text(
          formatCurrency(amount),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}
