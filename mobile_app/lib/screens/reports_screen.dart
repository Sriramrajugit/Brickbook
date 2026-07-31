import 'package:flutter/material.dart';
import '../models/account.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../services/api_service.dart';
import '../widgets/drawer_menu.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  int _selectedTab = 0; // 0: Transactions, 1: Attendance
  
  // Transaction Report States
  List<Account> accounts = [];
  List<Transaction> transactions = [];
  List<Category> categories = [];
  Account? selectedAccount;
  Category? selectedCategory;
  DateTime? transStartDate;
  DateTime? transEndDate;
  bool transLoading = true;
  String transError = '';
  
  // Attendance Report States
  DateTime? attStartDate;
  DateTime? attEndDate;
  bool attLoading = false;
  String attError = '';
  
  double totalIncome = 0;
  double totalExpenses = 0;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final thirtyDaysAgo = now.subtract(const Duration(days: 30));
    
    transStartDate = thirtyDaysAgo;
    transEndDate = now;
    attStartDate = thirtyDaysAgo;
    attEndDate = now;
    
    fetchTransactionData();
  }

  Future<void> fetchTransactionData() async {
    try {
      final accountList = await ApiService.getAccounts();
      final transactionList = await ApiService.getTransactions();
      final categoryList = await ApiService.getCategories();
      
      setState(() {
        accounts = accountList;
        transactions = transactionList;
        categories = categoryList;
        if (accountList.isNotEmpty) {
          selectedAccount = accountList.first;
        }
        if (categoryList.isNotEmpty) {
          selectedCategory = categoryList.first;
        }
        transLoading = false;
      });
      
      calculateTotals();
    } catch (e) {
      setState(() {
        transError = 'Failed to load data: ${e.toString()}';
        transLoading = false;
      });
    }
  }

  void calculateTotals() {
    setState(() {
      totalIncome = 0;
      totalExpenses = 0;
      
      for (final trans in transactions) {
        final transDate = trans.date;
        final inRange = (transStartDate == null || transDate.isAfter(transStartDate!)) &&
            (transEndDate == null || transDate.isBefore(transEndDate!.add(const Duration(days: 1))));
        
        final accountMatch = selectedAccount == null || trans.accountId == selectedAccount!.id;
        
        if (inRange && accountMatch) {
          if (trans.type == 'Cash-In' || trans.type == 'Cash-in') {
            totalIncome += trans.amount;
          } else {
            totalExpenses += trans.amount;
          }
        }
      }
    });
  }

  List<Transaction> getFilteredTransactions() {
    return transactions.where((trans) {
      final transDate = trans.date;
      final inRange = (transStartDate == null || transDate.isAfter(transStartDate!)) &&
          (transEndDate == null || transDate.isBefore(transEndDate!.add(const Duration(days: 1))));
      final accountMatch = selectedAccount == null || trans.accountId == selectedAccount!.id;
      
      return inRange && accountMatch;
    }).toList();
  }

  String formatCurrency(double amount) {
    if (amount >= 10000000) {
      return '₹${(amount / 10000000).toStringAsFixed(2)}Cr';
    } else if (amount >= 100000) {
      return '₹${(amount / 100000).toStringAsFixed(2)}L';
    }
    return '₹${amount.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const DrawerMenu(currentRoute: '/reports'),
      appBar: AppBar(
        title: const Text('📊 Reports'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Tab buttons
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTab = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _selectedTab == 0 ? Colors.blue : Colors.transparent,
                            width: 3,
                          ),
                        ),
                      ),
                      child: Text(
                        '💰 Transactions',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: _selectedTab == 0 ? Colors.blue : Colors.grey,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTab = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _selectedTab == 1 ? Colors.blue : Colors.transparent,
                            width: 3,
                          ),
                        ),
                      ),
                      child: Text(
                        '📋 Attendance',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: _selectedTab == 1 ? Colors.blue : Colors.grey,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Tab content
          Expanded(
            child: _selectedTab == 0
                ? buildTransactionTab()
                : buildAttendanceTab(),
          ),
        ],
      ),
    );
  }

  Widget buildTransactionTab() {
    if (transLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final filtered = getFilteredTransactions();
    
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Range Filter
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: transStartDate ?? DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setState(() {
                          transStartDate = picked;
                          calculateTotals();
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Start Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text(
                            transStartDate?.toIso8601String().split('T')[0] ?? 'Select',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: transEndDate ?? DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setState(() {
                          transEndDate = picked;
                          calculateTotals();
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('End Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text(
                            transEndDate?.toIso8601String().split('T')[0] ?? 'Select',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Account Filter
            if (accounts.isNotEmpty)
              DropdownButtonFormField<Account>(
                value: selectedAccount,
                items: accounts.map((acc) {
                  return DropdownMenuItem(
                    value: acc,
                    child: Text(acc.name),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    selectedAccount = value;
                    calculateTotals();
                  });
                },
                decoration: InputDecoration(
                  labelText: 'Select Account',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            const SizedBox(height: 16),
            
            // Summary Cards
            if (filtered.isNotEmpty)
              Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            border: Border.all(color: Colors.blue.shade200),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Cash In', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              const SizedBox(height: 4),
                              Text(
                                formatCurrency(totalIncome),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            border: Border.all(color: Colors.red.shade200),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Cash Out', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              const SizedBox(height: 4),
                              Text(
                                formatCurrency(totalExpenses),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.red),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      border: Border.all(color: Colors.green.shade200),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Net Balance', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text(
                          formatCurrency(totalIncome - totalExpenses),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 16),
            
            // Transaction List
            if (filtered.isNotEmpty)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Transactions (${filtered.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  ...filtered.map((trans) {
                    final isIncome = trans.type == 'Cash-In' || trans.type == 'Cash-in';
                    return Container(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  trans.description ?? '-',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Text(
                                formatCurrency(trans.amount),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isIncome ? Colors.green : Colors.red,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                trans.date.toString().split(' ')[0],
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                              Text(
                                trans.category,
                                style: const TextStyle(fontSize: 12, color: Colors.blue),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            
            if (transError.isNotEmpty)
              Text(transError, style: const TextStyle(color: Colors.red)),
            
            if (filtered.isEmpty && !transLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Text('No transactions found', style: TextStyle(color: Colors.grey)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget buildAttendanceTab() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Range Filter
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: attStartDate ?? DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setState(() => attStartDate = picked);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Start Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text(
                            attStartDate?.toIso8601String().split('T')[0] ?? 'Select',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: attEndDate ?? DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setState(() => attEndDate = picked);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('End Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text(
                            attEndDate?.toIso8601String().split('T')[0] ?? 'Select',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            ElevatedButton(
              onPressed: attLoading ? null : () async {
                setState(() {
                  attLoading = true;
                  attError = '';
                });
                
                try {
                  // TODO: Fetch attendance report from API when endpoint is available
                  // For now, show placeholder
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Attendance report feature coming soon')),
                  );
                } catch (e) {
                  setState(() => attError = e.toString());
                } finally {
                  setState(() => attLoading = false);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                minimumSize: const Size.fromHeight(48),
              ),
              child: Text(
                attLoading ? '⏳ Loading...' : '🔍 Generate Report',
                style: const TextStyle(color: Colors.white),
              ),
            ),
            
            if (attError.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(attError, style: const TextStyle(color: Colors.red)),
              ),
            
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(
                child: Text(
                  'Attendance report feature under development',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
