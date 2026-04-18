import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/offline_api_service.dart';
import '../models/transaction.dart';
import '../models/account.dart';
import '../models/category.dart';
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
  bool isLoading = true;
  
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  int? _selectedAccountId;
  String _selectedType = 'Cash-Out';
  String? _selectedCategory;
  DateTime _selectedDate = DateTime.now();

  // Income categories (these will auto-select Cash-In)
  final List<String> incomeCategories = ['Salary', 'Bonus', 'Commission', 'Interest', 'Dividend', 'Refund'];

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      setState(() => isLoading = true);
      final txData = await OfflineApiService.getTransactions();
      final accData = await OfflineApiService.getAccounts();
      final catData = await OfflineApiService.getCategories();
      
      // Convert dynamic list to Category list
      final categoryList = <Category>[];
      for (var cat in catData) {
        if (cat is Map<String, dynamic>) {
          categoryList.add(Category.fromJson(cat));
        }
      }
      
      setState(() {
        transactions = txData;
        accounts = accData;
        categories = categoryList;
        if (accounts.isNotEmpty && _selectedAccountId == null) {
          _selectedAccountId = accounts.first.id;
        }
        if (categories.isNotEmpty && _selectedCategory == null) {
          _selectedCategory = categories.first.name;
          _updateTypeBasedOnCategory(categories.first.name);
        }
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  // Auto-select transaction type based on category
  void _updateTypeBasedOnCategory(String categoryName) {
    setState(() {
      if (incomeCategories.contains(categoryName)) {
        _selectedType = 'Cash-In';
      } else {
        _selectedType = 'Cash-Out';
      }
    });
  }

  Future<void> createTransaction() async {
    if (_amountController.text.isEmpty || _selectedAccountId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
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
      builder: (context) => AlertDialog(
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
                    _updateTypeBasedOnCategory(value);
                    setState(() => _selectedCategory = value);
                  }
                },
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
