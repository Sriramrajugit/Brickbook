import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/bill.dart';
import '../models/employee.dart';
import '../models/account.dart';
import '../widgets/drawer_menu.dart';

class BillsScreen extends StatefulWidget {
  const BillsScreen({super.key});

  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  List<Bill> bills = [];
  List<Employee> suppliers = [];
  List<Account> accounts = [];
  bool isLoading = true;
  String? error;

  // Filter states
  DateTime? filterStartDate;
  DateTime? filterEndDate;
  int? filterEmployeeId;
  String filterStatus = 'All';
  String searchText = '';

  // Pagination states
  int currentPage = 1;
  int totalPages = 1;
  int totalRecords = 0;
  final int limit = 10;

  // Sorting states
  String sortBy = 'billDate';
  String sortOrder = 'desc';

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    await loadSuppliers();
    await loadAccounts();
    await loadBills();
  }

  Future<void> loadSuppliers() async {
    try {
      final allEmployees = await ApiService.getEmployees();
      final suppliersList = allEmployees
          .where((emp) => emp.partnerType == 'Supplier')
          .toList();
      setState(() => suppliers = suppliersList);
      print('✅ Loaded ${suppliersList.length} suppliers');
    } catch (e) {
      print('❌ Error loading suppliers: $e');
      setState(() => error = 'Error loading suppliers: $e');
    }
  }

  Future<void> loadAccounts() async {
    try {
      final accountsList = await ApiService.getAccounts();
      setState(() => accounts = accountsList);
      print('✅ Loaded ${accountsList.length} accounts');
    } catch (e) {
      print('❌ Error loading accounts: $e');
      setState(() => error = 'Error loading accounts: $e');
    }
  }

  Future<void> loadBills() async {
    try {
      setState(() => isLoading = true);

      final response = await ApiService.getBills(
        page: currentPage,
        limit: limit,
        startDate: filterStartDate?.toIso8601String().split('T')[0],
        endDate: filterEndDate?.toIso8601String().split('T')[0],
        employeeId: filterEmployeeId,
        status: filterStatus != 'All' ? filterStatus : null,
        sortBy: sortBy,
        sortOrder: sortOrder,
      );

      final billsList = response['bills'] as List<Bill>;
      final pagination = response['pagination'] as Map<String, dynamic>;

      setState(() {
        bills = billsList;
        totalPages = pagination['totalPages'] ?? 1;
        totalRecords = pagination['total'] ?? 0;
        isLoading = false;
        error = null;
      });

      print('✅ Loaded ${billsList.length} bills');
    } catch (e) {
      print('❌ Error loading bills: $e');
      setState(() {
        error = 'Error loading bills: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  String formatCurrency(double amount) {
    return NumberFormat.currency(
      symbol: '₹',
      decimalDigits: 2,
    ).format(amount);
  }

  String formatDate(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'UNPAID':
        return const Color(0xFFE53935); // Red
      case 'PARTIALLY_PAID':
        return const Color(0xFFFDD835); // Yellow
      case 'FULLY_PAID':
        return const Color(0xFF43A047); // Green
      default:
        return const Color(0xFF90A4AE); // Grey
    }
  }

  String getStatusLabel(String status) {
    switch (status) {
      case 'UNPAID':
        return 'Unpaid';
      case 'PARTIALLY_PAID':
        return 'Partially Paid';
      case 'FULLY_PAID':
        return 'Fully Paid';
      default:
        return status;
    }
  }

  void showAddBillDialog() {
    final invoiceController = TextEditingController();
    final amountController = TextEditingController();
    final notesController = TextEditingController();
    DateTime selectedBillDate = DateTime.now();
    DateTime? selectedDueDate;
    int? selectedSupplierId;
    int? selectedAccountId;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Bill'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: invoiceController,
                  decoration: const InputDecoration(
                    labelText: 'Invoice No',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  value: selectedSupplierId,
                  decoration: const InputDecoration(
                    labelText: 'Supplier',
                    border: OutlineInputBorder(),
                  ),
                  items: suppliers.map((sup) {
                    return DropdownMenuItem(
                      value: sup.id,
                      child: Text(sup.name),
                    );
                  }).toList(),
                  onChanged: (value) => setState(() => selectedSupplierId = value),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  value: selectedAccountId,
                  decoration: const InputDecoration(
                    labelText: 'Account (Required)',
                    border: OutlineInputBorder(),
                  ),
                  items: accounts.map((acc) {
                    return DropdownMenuItem(
                      value: acc.id,
                      child: Text(acc.name),
                    );
                  }).toList(),
                  onChanged: (value) => setState(() => selectedAccountId = value),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: selectedBillDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setState(() => selectedBillDate = picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Bill Date'),
                        Text(formatDate(selectedBillDate)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: selectedDueDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setState(() => selectedDueDate = picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Due Date (Optional)'),
                        Text(selectedDueDate != null ? formatDate(selectedDueDate!) : 'Not Set'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountController,
                  decoration: const InputDecoration(
                    labelText: 'Amount',
                    prefixText: '₹ ',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes (Optional)',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
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
              onPressed: () async {
                if (invoiceController.text.isEmpty ||
                    amountController.text.isEmpty ||
                    selectedSupplierId == null ||
                    selectedAccountId == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please fill all required fields (Invoice, Supplier, Account, Amount)')),
                  );
                  return;
                }

                try {
                  await ApiService.createBill(
                    invoiceNo: invoiceController.text,
                    billDate: selectedBillDate,
                    dueDate: selectedDueDate,
                    amount: double.parse(amountController.text),
                    employeeId: selectedSupplierId!,
                    accountId: selectedAccountId!,
                  );

                  if (mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Bill created successfully')),
                    );
                    loadBills();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: ${e.toString()}')),
                    );
                  }
                }
              },
              child: const Text('Add Bill'),
            ),
          ],
        ),
      ),
    );
  }

  void showDeleteDialog(Bill bill) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Bill'),
        content: Text('Are you sure you want to delete bill ${bill.invoiceNo}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await ApiService.deleteBill(bill.id);
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Bill deleted successfully')),
                  );
                  loadBills();
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
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bills & Invoices'),
        elevation: 2,
        backgroundColor: const Color(0xFF1976D2),
      ),
      drawer: const DrawerMenu(currentRoute: '/bills'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: loadBills,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // Filters
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          // Status Filter
                          DropdownButtonFormField<String>(
                            value: filterStatus,
                            decoration: const InputDecoration(
                              labelText: 'Status',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.filter_list),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'All', child: Text('All')),
                              DropdownMenuItem(value: 'UNPAID', child: Text('Unpaid')),
                              DropdownMenuItem(
                                  value: 'PARTIALLY_PAID',
                                  child: Text('Partially Paid')),
                              DropdownMenuItem(value: 'FULLY_PAID', child: Text('Fully Paid')),
                            ],
                            onChanged: (value) {
                              setState(() {
                                filterStatus = value ?? 'All';
                                currentPage = 1;
                              });
                              loadBills();
                            },
                          ),
                          const SizedBox(height: 12),
                          // Supplier Filter
                          DropdownButtonFormField<int?>(
                            value: filterEmployeeId,
                            decoration: const InputDecoration(
                              labelText: 'Supplier',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.business),
                            ),
                            items: [
                              const DropdownMenuItem(
                                  value: null, child: Text('All Suppliers')),
                              ...suppliers.map((sup) {
                                return DropdownMenuItem(
                                  value: sup.id,
                                  child: Text(sup.name),
                                );
                              }).toList(),
                            ],
                            onChanged: (value) {
                              setState(() {
                                filterEmployeeId = value;
                                currentPage = 1;
                              });
                              loadBills();
                            },
                          ),
                        ],
                      ),
                    ),
                    // Bills List
                    Expanded(
                      child: bills.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Icon(Icons.receipt, size: 48, color: Colors.grey),
                                  SizedBox(height: 12),
                                  Text('No bills found'),
                                ],
                              ),
                            )
                          : ListView.builder(
                              itemCount: bills.length,
                              itemBuilder: (context, index) {
                                final bill = bills[index];
                                return Card(
                                  margin: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  child: ListTile(
                                    leading: Container(
                                      width: 50,
                                      height: 50,
                                      decoration: BoxDecoration(
                                        color: getStatusColor(bill.status)
                                            .withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Center(
                                        child: Icon(
                                          bill.isFullyPaid
                                              ? Icons.check_circle
                                              : bill.isPartiallyPaid
                                                  ? Icons.schedule
                                                  : Icons.pending,
                                          color: getStatusColor(bill.status),
                                        ),
                                      ),
                                    ),
                                    title: Text(
                                      bill.invoiceNo,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          bill.employeeName,
                                          style: TextStyle(
                                            color: Colors.grey[600],
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              'Amount: ${formatCurrency(bill.amount)}',
                                              style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold),
                                            ),
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: getStatusColor(
                                                    bill.status),
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                              ),
                                              child: Text(
                                                getStatusLabel(bill.status),
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    trailing: PopupMenuButton(
                                      itemBuilder: (context) => [
                                        PopupMenuItem(
                                          child: const Text('Edit'),
                                          onTap: () {
                                            // TODO: Implement edit functionality
                                          },
                                        ),
                                        PopupMenuItem(
                                          child: const Text('Payment'),
                                          onTap: () {
                                            // TODO: Implement payment functionality
                                          },
                                        ),
                                        PopupMenuItem(
                                          child: const Text('Delete'),
                                          onTap: () => showDeleteDialog(bill),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                    // Pagination
                    if (totalPages > 1)
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            ElevatedButton(
                              onPressed: currentPage > 1
                                  ? () {
                                      setState(() => currentPage--);
                                      loadBills();
                                    }
                                  : null,
                              child: const Text('Previous'),
                            ),
                            Text(
                              'Page $currentPage of $totalPages (Total: $totalRecords)',
                            ),
                            ElevatedButton(
                              onPressed: currentPage < totalPages
                                  ? () {
                                      setState(() => currentPage++);
                                      loadBills();
                                    }
                                  : null,
                              child: const Text('Next'),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: showAddBillDialog,
        backgroundColor: const Color(0xFF1976D2),
        child: const Icon(Icons.add),
      ),
    );
  }
}
