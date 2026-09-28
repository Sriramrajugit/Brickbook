import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/employee.dart';
import '../models/account.dart';
import '../services/api_service.dart';
import '../services/offline_api_service.dart';
import '../widgets/drawer_menu.dart';

class PayrollScreen extends StatefulWidget {
  const PayrollScreen({super.key});

  @override
  State<PayrollScreen> createState() => _PayrollScreenState();
}

class _PayrollScreenState extends State<PayrollScreen> {
  // Data
  List<Map<String, dynamic>> payrollPreview = [];
  List<Employee> employees = [];
  List<Account> accounts = [];
  
  // Filter states
  DateTime? fromDate;
  DateTime? toDate;
  String selectedAccount = 'All';
  
  // Selection states
  Set<int> selectedEmployees = {};
  Set<int> alreadyPaidEmployees = {};
  
  // UI states
  bool loading = true;
  bool saving = false;
  String error = '';
  String? successMessage;
  
  // Form states
  TextEditingController remarksController = TextEditingController();


  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    try {
      // Load accounts
      final accountList = await ApiService.getAccounts();
      
      // Set default dates (Monday to Saturday of current week)
      final today = DateTime.now();
      int dayOfWeek = today.weekday; // Monday=1, Sunday=7
      DateTime monday = today.subtract(Duration(days: dayOfWeek - 1));
      DateTime saturday = monday.add(const Duration(days: 5));
      
      setState(() {
        accounts = accountList;
        fromDate = monday;
        toDate = saturday;
        loading = false;
      });
      
      // Fetch initial payroll preview
      await _fetchPayrollPreview();
    } catch (e) {
      setState(() {
        error = 'Error initializing: ${e.toString()}';
        loading = false;
      });
    }
  }

  Future<void> _fetchPayrollPreview() async {
    if (fromDate == null || toDate == null) return;
    
    try {
      setState(() => loading = true);
      
      final response = await OfflineApiService.getPayrollPreview(
        fromDate: fromDate!.toIso8601String().split('T')[0],
        toDate: toDate!.toIso8601String().split('T')[0],
      );
      
      final preview = response['preview'] as List<Map<String, dynamic>>;
      final paid = response['paid'] as List<int>;
      
      // Auto-select unpaid employees
      Set<int> unpaid = {};
      for (var record in preview) {
        int empId = record['employeeId'] as int;
        if (!paid.contains(empId)) {
          unpaid.add(empId);
        }
      }
      
      setState(() {
        payrollPreview = preview;
        alreadyPaidEmployees = Set.from(paid);
        selectedEmployees = unpaid;
        error = '';
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load payroll: ${e.toString()}';
        payrollPreview = [];
      });
    } finally {
      setState(() => loading = false);
    }
  }

  // Separate employees by salary frequency
  List<Map<String, dynamic>> get monthlyEmployees => 
    payrollPreview.where((e) => e['salaryFrequency'] == 'M' || e['salaryFrequency'] == 'Monthly').toList();
  
  List<Map<String, dynamic>> get dailyEmployees =>
    payrollPreview.where((e) => e['salaryFrequency'] == 'D' || e['salaryFrequency'] == 'Daily').toList();

  // Calculate totals
  Map<String, double> _calculateTotals(List<Map<String, dynamic>> employees) {
    double grossPay = 0;
    double advances = 0;
    double salaryPaid = 0;
    
    for (var emp in employees) {
      if (selectedEmployees.contains(emp['employeeId'])) {
        grossPay += (emp['salary'] as num?)?.toDouble() ?? 0;
        advances += (emp['totalAdvance'] as num?)?.toDouble() ?? 0;
        salaryPaid += (emp['totalSalaryPaid'] as num?)?.toDouble() ?? 0;
      }
    }
    
    return {
      'grossPay': grossPay,
      'advances': advances,
      'salaryPaid': salaryPaid,
    };
  }

  String _formatCurrency(double amount) {
    return NumberFormat.currency(symbol: '₹', locale: 'en_IN', decimalDigits: 2)
        .format(amount);
  }

  void _handleSelectAllMonthly(bool? value) {
    setState(() {
      if (value == true) {
        for (var emp in monthlyEmployees) {
          if (!alreadyPaidEmployees.contains(emp['employeeId'])) {
            selectedEmployees.add(emp['employeeId'] as int);
          }
        }
      } else {
        for (var emp in monthlyEmployees) {
          selectedEmployees.remove(emp['employeeId']);
        }
      }
    });
  }

  void _handleSelectAllDaily(bool? value) {
    setState(() {
      if (value == true) {
        for (var emp in dailyEmployees) {
          if (!alreadyPaidEmployees.contains(emp['employeeId'])) {
            selectedEmployees.add(emp['employeeId'] as int);
          }
        }
      } else {
        for (var emp in dailyEmployees) {
          selectedEmployees.remove(emp['employeeId']);
        }
      }
    });
  }

  Future<void> _handleSavePayroll() async {
    // Validations
    if (fromDate == null || toDate == null) {
      setState(() => error = 'Please select a date range');
      return;
    }

    if (fromDate!.isAfter(toDate!)) {
      setState(() => error = 'From Date must be before To Date');
      return;
    }

    if (payrollPreview.isEmpty) {
      setState(() => error = 'No payroll records to save');
      return;
    }

    if (selectedEmployees.isEmpty) {
      setState(() => error = 'Please select at least one employee');
      return;
    }

    // Check for future dates
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    if (toDate!.isAfter(tomorrow)) {
      setState(() => error = 'Cannot save payroll for future dates');
      return;
    }

    // For monthly employees, validate date range is within same month
    final monthlySelected = monthlyEmployees
        .where((e) => selectedEmployees.contains(e['employeeId']))
        .toList();
    
    if (monthlySelected.isNotEmpty) {
      if (fromDate!.month != toDate!.month || fromDate!.year != toDate!.year) {
        setState(() => error = 'For monthly employees, date range must be within same month');
        return;
      }
    }

    // Get account ID
    int? accountId;
    if (selectedAccount != 'All') {
      try {
        accountId = int.parse(selectedAccount);
      } catch (e) {
        accountId = accounts.first.id;
      }
    } else {
      if (accounts.isEmpty) {
        setState(() => error = 'No account available');
        return;
      }
      accountId = accounts.first.id;
    }

    // Filter to selected, unpaid employees
    final recordsToSave = payrollPreview
        .where((r) => selectedEmployees.contains(r['employeeId']) && 
                      !alreadyPaidEmployees.contains(r['employeeId']))
        .toList();

    if (recordsToSave.isEmpty) {
      setState(() => error = 'All selected employees already have payroll processed');
      return;
    }

    // Save each record
    setState(() {
      saving = true;
      error = '';
      successMessage = null;
    });

    try {
      int savedCount = 0;
      String failedEmployees = '';
      
      for (var record in recordsToSave) {
        try {
          await OfflineApiService.createPayrollRecord(
            employeeId: record['employeeId'] as int,
            accountId: accountId!,
            fromDate: fromDate!,
            toDate: toDate!,
            amount: (record['salary'] as num?)?.toDouble() ?? 0,
            remarks: remarksController.text.isEmpty ? null : remarksController.text,
          );
          savedCount++;
        } catch (e) {
          failedEmployees += '${record['employeeName']}, ';
        }
      }

      if (failedEmployees.isNotEmpty) {
        failedEmployees = failedEmployees.substring(0, failedEmployees.length - 2);
      }

      setState(() {
        String message = 'Saved payroll for $savedCount employee(s)';
        if (failedEmployees.isNotEmpty) {
          message += '\nFailed: $failedEmployees';
        }
        successMessage = message;
        remarksController.clear();
      });

      // Refresh data
      await Future.delayed(const Duration(milliseconds: 500));
      await _fetchPayrollPreview();
    } catch (e) {
      setState(() => error = 'Error saving payroll: ${e.toString()}');
    } finally {
      setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final monthlyTotals = _calculateTotals(monthlyEmployees);
    final dailyTotals = _calculateTotals(dailyEmployees);
    final grandTotals = _calculateTotals(payrollPreview);
    
    final monthlySelectedCount = monthlyEmployees.where((e) => selectedEmployees.contains(e['employeeId'])).length;
    final dailySelectedCount = dailyEmployees.where((e) => selectedEmployees.contains(e['employeeId'])).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payroll'),
        backgroundColor: const Color(0xFF1976D2),
        elevation: 2,
      ),
      drawer: const DrawerMenu(currentRoute: '/payroll'),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Date Range Selection
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Select Period',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: fromDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime.now(),
                                      );
                                      if (picked != null) {
                                        setState(() => fromDate = picked);
                                        await _fetchPayrollPreview();
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.grey),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('From Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                          const SizedBox(height: 4),
                                          Text(
                                            fromDate != null ? DateFormat('dd/MM/yyyy').format(fromDate!) : 'Select',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: toDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime.now(),
                                      );
                                      if (picked != null) {
                                        setState(() => toDate = picked);
                                        await _fetchPayrollPreview();
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.grey),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('To Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                          const SizedBox(height: 4),
                                          Text(
                                            toDate != null ? DateFormat('dd/MM/yyyy').format(toDate!) : 'Select',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Error Messages
                    if (error.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          border: Border.all(color: Colors.red[300]!),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          error,
                          style: TextStyle(color: Colors.red[700], fontSize: 14),
                        ),
                      ),
                    
                    if (successMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.green[50],
                          border: Border.all(color: Colors.green[300]!),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          successMessage!,
                          style: TextStyle(color: Colors.green[700], fontSize: 14),
                        ),
                      ),
                    
                    if (error.isNotEmpty || successMessage != null)
                      const SizedBox(height: 16),

                    // Monthly Employees Section
                    if (monthlyEmployees.isNotEmpty) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Monthly Employees',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Checkbox(
                                    value: monthlySelectedCount == monthlyEmployees.length,
                                    onChanged: _handleSelectAllMonthly,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ...monthlyEmployees.map((emp) {
                                final empId = emp['employeeId'] as int;
                                final isPaid = alreadyPaidEmployees.contains(empId);
                                final isSelected = selectedEmployees.contains(empId);
                                
                                return Column(
                                  children: [
                                    ListTile(
                                      enabled: !isPaid,
                                      leading: Checkbox(
                                        value: isSelected && !isPaid,
                                        onChanged: isPaid ? null : (value) {
                                          setState(() {
                                            if (value == true) {
                                              selectedEmployees.add(empId);
                                            } else {
                                              selectedEmployees.remove(empId);
                                            }
                                          });
                                        },
                                      ),
                                      title: Text(
                                        emp['employeeName'] as String,
                                        style: TextStyle(
                                          color: isPaid ? Colors.grey : Colors.black,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      subtitle: Text(
                                        isPaid ? 'Already Paid' : _formatCurrency((emp['salary'] as num?)?.toDouble() ?? 0),
                                        style: TextStyle(
                                          color: isPaid ? Colors.red : Colors.grey[600],
                                        ),
                                      ),
                                    ),
                                    const Divider(height: 1),
                                  ],
                                );
                              }).toList(),
                              const SizedBox(height: 12),
                              // Monthly Totals
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.blue[50],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Gross Pay:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text(_formatCurrency(monthlyTotals['grossPay']!), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Advances:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text(_formatCurrency(monthlyTotals['advances']!), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Paid:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text(_formatCurrency(monthlyTotals['salaryPaid']!), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Daily Employees Section
                    if (dailyEmployees.isNotEmpty) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Daily Employees',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Checkbox(
                                    value: dailySelectedCount == dailyEmployees.length,
                                    onChanged: _handleSelectAllDaily,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ...dailyEmployees.map((emp) {
                                final empId = emp['employeeId'] as int;
                                final isPaid = alreadyPaidEmployees.contains(empId);
                                final isSelected = selectedEmployees.contains(empId);
                                
                                return Column(
                                  children: [
                                    ListTile(
                                      enabled: !isPaid,
                                      leading: Checkbox(
                                        value: isSelected && !isPaid,
                                        onChanged: isPaid ? null : (value) {
                                          setState(() {
                                            if (value == true) {
                                              selectedEmployees.add(empId);
                                            } else {
                                              selectedEmployees.remove(empId);
                                            }
                                          });
                                        },
                                      ),
                                      title: Text(
                                        emp['employeeName'] as String,
                                        style: TextStyle(
                                          color: isPaid ? Colors.grey : Colors.black,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      subtitle: Text(
                                        isPaid ? 'Already Paid' : _formatCurrency((emp['salary'] as num?)?.toDouble() ?? 0),
                                        style: TextStyle(
                                          color: isPaid ? Colors.red : Colors.grey[600],
                                        ),
                                      ),
                                    ),
                                    const Divider(height: 1),
                                  ],
                                );
                              }).toList(),
                              const SizedBox(height: 12),
                              // Daily Totals
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.blue[50],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Gross Pay:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text(_formatCurrency(dailyTotals['grossPay']!), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Advances:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text(_formatCurrency(dailyTotals['advances']!), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Paid:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text(_formatCurrency(dailyTotals['salaryPaid']!), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Grand Totals
                    if (payrollPreview.isNotEmpty)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Total Summary',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Gross Pay:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                      Text(_formatCurrency(grandTotals['grossPay']!), 
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green)),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Advances:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                      Text(_formatCurrency(grandTotals['advances']!),
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.orange)),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Already Paid:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                      Text(_formatCurrency(grandTotals['salaryPaid']!),
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue)),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                    if (payrollPreview.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      // Remarks
                      TextField(
                        controller: remarksController,
                        decoration: InputDecoration(
                          labelText: 'Remarks (Optional)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),
                          contentPadding: const EdgeInsets.all(12),
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      // Save Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: saving ? null : _handleSavePayroll,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1976D2),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: saving
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                                )
                              : const Text('Save Payroll', style: TextStyle(fontSize: 16, color: Colors.white)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    remarksController.dispose();
    super.dispose();
  }
}
