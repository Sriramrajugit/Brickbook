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
  
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  int? _selectedAccountId;
  String _selectedType = 'Cash-Out';
  String? _selectedCategory;
  DateTime _selectedDate = DateTime.now();
  int? _selectedEmployeeId;

  // Categories that require employee/partner selection
  final List<String> employeeRequiredCategories = ['Salary Advance', 'Salary', 'To Contractor'];

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
        categories = catData;  // Already a List<Category> from API
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

  // Auto-select transaction type based on category (matching web logic)
  void _updateTypeBasedOnCategory(String categoryName) {
    setState(() {
      // Capital = Cash-In, everything else = Cash-Out (web logic)
      if (categoryName == 'Capital') {
        _selectedType = 'Cash-In';
      } else {
        _selectedType = 'Cash-Out';
      }
      // Reset employee selection when category changes
      _selectedEmployeeId = null;
    });
  }

  // Get filtered employees based on category
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

  Future<void> createTransaction() async {
    // Validate required fields
    if (_amountController.text.isEmpty || _selectedAccountId == null || _selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    // Validate employee selection for categories that require it
    if (employeeRequiredCategories.contains(_selectedCategory) && _selectedEmployeeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a Partner/Employee')),
      );
      return;
    }

    try {
      final transaction = Transaction(
        id: 0,
        amount: double.parse(_amountController.text),
        description: _descriptionController.text,
        category: _selectedCategory ?? 'Other',  // Use default if null
        type: _selectedType,
        date: _selectedDate,
        accountId: _selectedAccountId!,
        paymentMode: 'G-Pay',
        companyId: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await OfflineApiService.createTransaction(transaction);
      
      _amountController.clear();
      _descriptionController.clear();
      _selectedEmployeeId = null;
      loadData();
      
      if (mounted) {
        Navigator.pop(context);
        final isOnline = await OfflineApiService.isOnline();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isOnline 
              ? 'Transaction saved successfully' 
              : 'Transaction saved offline (will sync when online)'),
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

  void showAddDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Transaction'),
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
                // Category selector
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
                        _selectedEmployeeId = null; // Reset employee selection
                      });
                    }
                  },
                ),
                const SizedBox(height: 16),
                // Show employee/partner dropdown ONLY for specific categories
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
                          // Auto-populate description with employee name + category
                          _descriptionController.text = '${selectedEmp.name} - $_selectedCategory';
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                ],
                // Type is auto-selected based on category - display as read-only
                InputDecorator(
                  decoration: const InputDecoration(labelText: 'Type (Auto-selected)'),
                  child: Text(_selectedType, style: const TextStyle(fontSize: 16)),
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
                      lastDate: DateTime.now(),
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
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: createTransaction,
              child: const Text('Add'),
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
              : ListView.builder(
                  itemCount: transactions.length,
                  itemBuilder: (context, index) {
                    final transaction = transactions[index];
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
                          '${account.name} • ${transaction.category}\n${transaction.date}',
                        ),
                        trailing: Text(
                          currencyFormat.format(transaction.amount),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: transaction.type == 'Cash-In'
                                ? Colors.green
                                : Colors.red,
                          ),
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: showAddDialog,
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
