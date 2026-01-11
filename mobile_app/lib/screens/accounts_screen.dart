import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/offline_api_service.dart';
import '../models/account.dart';
import '../widgets/drawer_menu.dart';

class AccountsScreen extends StatefulWidget {
  const AccountsScreen({super.key});

  @override
  State<AccountsScreen> createState() => _AccountsScreenState();
}

class _AccountsScreenState extends State<AccountsScreen> {
  List<Account> accounts = [];
  bool isLoading = true;
  final TextEditingController _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadAccounts();
  }

  Future<void> loadAccounts() async {
    try {
      setState(() => isLoading = true);
      final data = await OfflineApiService.getAccounts();
      setState(() {
        accounts = data;
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

  Future<void> createAccount() async {
    if (_nameController.text.isEmpty) return;

    try {
      // Note: Account creation currently not implemented in OfflineApiService
      // This would need backend API support for creating accounts
      _nameController.clear();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account creation - contact admin')),
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
        title: const Text('Add Account'),
        content: TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: 'Account Name',
            hintText: 'Enter account name',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: createAccount,
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: '\$');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Accounts'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      drawer: const DrawerMenu(currentRoute: '/accounts'),
      floatingActionButton: FloatingActionButton(
        onPressed: showAddDialog,
        child: const Icon(Icons.add),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadAccounts,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: accounts.length,
                itemBuilder: (context, index) {
                  final account = accounts[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: const CircleAvatar(
                        child: Icon(Icons.account_balance),
                      ),
                      title: Text(
                        account.name,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        'Created: ${DateFormat('MMM d, yyyy').format(account.createdAt)}',
                      ),
                      trailing: Text(
                        currencyFormat.format(account.budget),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: account.budget >= 0 ? Colors.green : Colors.red,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
