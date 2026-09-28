import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/offline_api_service.dart';
import '../models/transaction.dart';
import '../models/account.dart';
import '../models/category.dart';
import '../models/employee.dart';
import '../widgets/drawer_menu.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  List<Transaction> transactions = [];
  List<Account> accounts = [];
  List<Category> categories = [];
  List<Employee> employees = [];
  bool isLoading = true;
  int? filterAccountId; // Account filter
  
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  int? _selectedAccountId;
  String _selectedType = 'Cash-Out';
  String? _selectedCategory;
  String _selectedPaymentMode = 'G-Pay';
  DateTime _selectedDate = DateTime.now();
  int? _selectedEmployeeId;
  int? _editingTransactionId;

  // Categories that require employee/partner selection
  final List<String> employeeRequiredCategories = ['Salary Advance', 'Salary', 'To Contractor'];
  final List<String> paymentModes = ['G-Pay', 'Cash', 'Cheque'];

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      setState(() => isLoading = true);
      print('📥 Loading transactions, accounts, categories, employees...');
      
      final txData = await OfflineApiService.getTransactions();
      print('✅ Loaded ${txData.length} transactions');
      
      final accData = await OfflineApiService.getAccounts();
      print('✅ Loaded ${accData.length} accounts: ${accData.map((a) => a.name).join(", ")}');
      
      final catData = await OfflineApiService.getCategories();
      print('✅ Loaded ${catData.length} categories: ${catData.map((c) => c.name).join(", ")}');
      
      // Fetch employees for partner selection
      List<Employee> empData = [];
      try {
        empData = await OfflineApiService.getEmployees();
        print('✅ Loaded ${empData.length} employees');
      } catch (e) {
        print('⚠️ Warning loading employees: $e');
      }
      
      setState(() {
        transactions = txData;
        accounts = accData;
        categories = catData;
        employees = empData;
        if (accounts.isNotEmpty && _selectedAccountId == null) {
          _selectedAccountId = accounts.first.id;
          print('📍 Selected account: ${accounts.first.name} (id: ${accounts.first.id})');
        }
        if (categories.isNotEmpty && _selectedCategory == null) {
          _selectedCategory = categories.first.name;
          _updateTypeBasedOnCategory(categories.first.name);
          print('📍 Selected category: ${categories.first.name}');
        }
        isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading data: $e');
      print('❌ Stack trace: ${StackTrace.current}');
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  void _updateTypeBasedOnCategory(String categoryName) {
    setState(() {
      if (categoryName == 'Capital') {
        _selectedType = 'Cash-In';
      } else {
        _selectedType = 'Cash-Out';
      }
      _selectedEmployeeId = null;
    });
  }

  List<Employee> _getFilteredEmployees() {
    if (_selectedCategory == null) return [];
    
    return employees.where((emp) {
      if (_selectedCategory == 'Salary' || _selectedCategory == 'Salary Advance') {
        return emp.partnerType == 'Employee';
      }
      if (_selectedCategory == 'To Contractor') {
        return emp.partnerType == 'Supplier' || emp.partnerType == 'Contractor';
      }
      return false;
    }).toList();
  }

  List<Transaction> _getFilteredTransactions() {
    var filtered = transactions;
    if (filterAccountId != null && filterAccountId != 0) {
      filtered = filtered.where((t) => t.accountId == filterAccountId).toList();
    }
    return filtered;
  }

  void _resetFormFields() {
    _amountController.clear();
    _descriptionController.clear();
    _selectedEmployeeId = null;
    _selectedPaymentMode = 'G-Pay';
    _selectedDate = DateTime.now();
    _editingTransactionId = null;
    if (categories.isNotEmpty && _selectedCategory == null) {
      _selectedCategory = categories.first.name;
      _updateTypeBasedOnCategory(categories.first.name);
    }
  }

  Future<void> saveTransaction() async {
    if (_amountController.text.isEmpty || _selectedAccountId == null || _selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    if (employeeRequiredCategories.contains(_selectedCategory) && _selectedEmployeeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a Partner/Employee')),
      );
      return;
    }

    try {
      final transaction = Transaction(
        id: _editingTransactionId ?? 0,
        amount: double.parse(_amountController.text),
        description: _descriptionController.text,
        category: _selectedCategory ?? 'Other',
        type: _selectedType,
        date: _selectedDate,
        accountId: _selectedAccountId!,
        paymentMode: _selectedPaymentMode,
        companyId: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      if (_editingTransactionId != null) {
        // Update existing transaction
        await OfflineApiService.updateTransaction(_editingTransactionId!, transaction);
      } else {
        // Create new transaction
        await OfflineApiService.createTransaction(transaction);
      }
      
      _resetFormFields();
      loadData();
      
      if (mounted) {
        Navigator.pop(context);
        final isOnline = await OfflineApiService.isOnline();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_editingTransactionId != null
              ? (isOnline ? 'Transaction updated successfully' : 'Transaction updated (will sync when online)')
              : (isOnline ? 'Transaction saved successfully' : 'Transaction saved offline (will sync when online)')),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> deleteTransaction(int transactionId) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Transaction'),
        content: const Text('Are you sure you want to delete this transaction?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await OfflineApiService.deleteTransaction(transactionId);
                if (mounted) {
                  Navigator.pop(context);
                  loadData();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Transaction deleted')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: ${e.toString()}')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void showTransactionDialog({Transaction? transaction}) {
    if (transaction != null) {
      _editingTransactionId = transaction.id;
      _amountController.text = transaction.amount.toString();
      _descriptionController.text = transaction.description ?? '';
      _selectedAccountId = transaction.accountId;
      _selectedCategory = transaction.category;
      _selectedPaymentMode = transaction.paymentMode;
      _selectedDate = transaction.date;
      _selectedType = transaction.type;
    } else {
      _resetFormFields();
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(_editingTransactionId != null ? 'Edit Transaction' : 'Add Transaction'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  value: _selectedAccountId,
                  decoration: const InputDecoration(labelText: 'Account'),
                  items: accounts.map((account) {
                    return DropdownMenuItem(
                      value: account.id,
                      child: Text(account.name),
                    );
                  }).toList(),
                  onChanged: (value) => setState(() => _selectedAccountId = value),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(labelText: 'Category *'),
                  items: categories.map((cat) {
                    return DropdownMenuItem<String>(
                      value: cat.name,
                      child: Text(cat.name),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedCategory = value;
                        _updateTypeBasedOnCategory(value);
                        _selectedEmployeeId = null;
                      });
                    }
                  },
                ),
                const SizedBox(height: 16),
                if (employeeRequiredCategories.contains(_selectedCategory)) ...[
                  DropdownButtonFormField<int>(
                    value: _selectedEmployeeId,
                    decoration: const InputDecoration(
                      labelText: 'Partner *',
                      hintText: 'Select employee/contractor',
                    ),
                    items: _getFilteredEmployees().map((emp) {
                      return DropdownMenuItem<int>(
                        value: emp.id,
                        child: Text(emp.name),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        final selectedEmp = employees.firstWhere((e) => e.id == value);
                        setState(() {
                          _selectedEmployeeId = value;
                          _descriptionController.text = '${selectedEmp.name} - $_selectedCategory';
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                ],
                InputDecorator(
                  decoration: const InputDecoration(labelText: 'Type (Auto-selected)'),
                  child: Text(_selectedType, style: const TextStyle(fontSize: 16)),
                ),
                const SizedBox(height: 16),
                // Payment Mode Dropdown
                DropdownButtonFormField<String>(
                  value: _selectedPaymentMode,
                  decoration: const InputDecoration(labelText: 'Payment Mode'),
                  items: paymentModes.map((mode) {
                    return DropdownMenuItem<String>(
                      value: mode,
                      child: Text(mode),
                    );
                  }).toList(),
                  onChanged: (value) => setState(() => _selectedPaymentMode = value ?? 'G-Pay'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Amount *',
                    hintText: 'Enter amount',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    hintText: 'Enter description',
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  title: const Text('Date'),
                  subtitle: Text(DateFormat('yyyy-MM-dd').format(_selectedDate)),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setState(() => _selectedDate = picked);
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                _resetFormFields();
                Navigator.pop(context);
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: saveTransaction,
              child: Text(_editingTransactionId != null ? 'Update' : 'Add'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: '₹');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      drawer: const DrawerMenu(currentRoute: '/transactions'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : transactions.isEmpty
              ? const Center(child: Text('No transactions found'))
              : Column(
                  children: [
                    // Account Filter Dropdown
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: DropdownButton<int?>(
                        value: filterAccountId,
                        isExpanded: true,
                        items: [
                          const DropdownMenuItem<int?>(
                            value: null,
                            child: Text('All Accounts'),
                          ),
                          ...accounts.map((account) =>
                            DropdownMenuItem<int?>(
                              value: account.id,
                              child: Text(account.name),
                            ),
                          ).toList(),
                        ],
                        onChanged: (value) {
                          setState(() {
                            filterAccountId = value;
                          });
                        },
                      ),
                    ),
                    // Transactions List
                    Expanded(
                      child: ListView.builder(
                        itemCount: _getFilteredTransactions().length,
                        itemBuilder: (context, index) {
                          final transaction = _getFilteredTransactions()[index];
                    final account = accounts.firstWhere(
                      (a) => a.id == transaction.accountId,
                      orElse: () => Account(
                        id: 0,
                        name: 'Unknown',
                        type: '',
                        budget: 0,
                        companyId: 1,
                        createdAt: DateTime.now(),
                        updatedAt: DateTime.now(),
                      ),
                    );

                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: transaction.type == 'Cash-In'
                              ? Colors.green
                              : Colors.red,
                          child: Icon(
                            transaction.type == 'Cash-In'
                                ? Icons.arrow_downward
                                : Icons.arrow_upward,
                            color: Colors.white,
                          ),
                        ),
                        title: Text(
                          transaction.description ?? 'No description',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          '${account.name} • ${transaction.category}\n${DateFormat('yyyy-MM-dd').format(transaction.date)} • ${transaction.paymentMode}',
                        ),
                        trailing: Wrap(
                          spacing: 8,
                          children: [
                            Text(
                              currencyFormat.format(transaction.amount),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: transaction.type == 'Cash-In'
                                    ? Colors.green
                                    : Colors.red,
                              ),
                            ),
                            PopupMenuButton(
                              itemBuilder: (context) => [
                                PopupMenuItem(
                                  child: const Text('Edit'),
                                  onTap: () => showTransactionDialog(transaction: transaction),
                                ),
                                PopupMenuItem(
                                  child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                  onTap: () => deleteTransaction(transaction.id),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                    ),
                  ],
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showTransactionDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
}

