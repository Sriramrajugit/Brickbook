import 'package:flutter/material.dart';
import '../models/payroll.dart';
import '../models/employee.dart';
import '../models/account.dart';
import '../services/api_service.dart';
import '../widgets/drawer_menu.dart';

class PayrollScreen extends StatefulWidget {
  const PayrollScreen({super.key});

  @override
  State<PayrollScreen> createState() => _PayrollScreenState();
}

class _PayrollScreenState extends State<PayrollScreen> {
  List<PayrollRecord> payrollRecords = [];
  List<Employee> employees = [];
  List<Account> accounts = [];
  Employee? selectedEmployee;
  Account? selectedAccount;
  DateTime? fromDate;
  DateTime? toDate;
  bool loading = true;
  bool calculating = false;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    fetchInitialData();
  }

  Future<void> fetchInitialData() async {
    try {
      final [employeeList, accountList] = await Future.wait([
        ApiService.getEmployees(),
        ApiService.getAccounts(),
      ]);

      setState(() {
        employees = employeeList;
        accounts = accountList;
        if (employeeList.isNotEmpty) {
          selectedEmployee = employeeList.first;
        }
        if (accountList.isNotEmpty) {
          selectedAccount = accountList.first;
        }
        loading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load data: ${e.toString()}';
        loading = false;
      });
    }
  }

  Future<void> calculatePayroll() async {
    if (selectedEmployee == null ||
        selectedAccount == null ||
        fromDate == null ||
        toDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    setState(() => calculating = true);

    try {
      final records = await ApiService.getPayroll(
        employeeId: selectedEmployee!.id,
        accountId: selectedAccount!.id,
        fromDate: fromDate!.toIso8601String().split('T')[0],
        toDate: toDate!.toIso8601String().split('T')[0],
      );

      setState(() {
        payrollRecords = records;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Calculated payroll for ${records.length} periods'),
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
      setState(() => calculating = false);
    }
  }

  String formatCurrency(double amount) {
    return '₹${amount.toStringAsFixed(2).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payroll'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      drawer: const DrawerMenu(currentPage: '/payroll'),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Calculation Filters
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Calculate Payroll',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Employee Selection
                            const Text(
                              'Select Employee',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            DropdownButton<Employee>(
                              isExpanded: true,
                              value: selectedEmployee,
                              hint: const Text('Select Employee'),
                              items: employees.map((employee) {
                                return DropdownMenuItem<Employee>(
                                  value: employee,
                                  child: Text(employee.name),
                                );
                              }).toList(),
                              onChanged: (Employee? newValue) {
                                setState(() => selectedEmployee = newValue);
                              },
                            ),
                            const SizedBox(height: 16),

                            // Account Selection
                            const Text(
                              'Select Account',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
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
                                    title: const Text('From Date'),
                                    subtitle: Text(
                                      fromDate?.toLocal().toString().split(' ')[0] ??
                                          'Select',
                                    ),
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate:
                                            fromDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime.now(),
                                      );
                                      if (picked != null) {
                                        setState(() => fromDate = picked);
                                      }
                                    },
                                  ),
                                ),
                                Expanded(
                                  child: ListTile(
                                    title: const Text('To Date'),
                                    subtitle: Text(
                                      toDate?.toLocal().toString().split(' ')[0] ??
                                          'Select',
                                    ),
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate:
                                            toDate ?? DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime.now(),
                                      );
                                      if (picked != null) {
                                        setState(() => toDate = picked);
                                      }
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Calculate Button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed:
                                    calculating ? null : calculatePayroll,
                                child: calculating
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Text('Calculate Payroll'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Results
                    if (payrollRecords.isNotEmpty) ...[
                      const Text(
                        'Payroll Results',
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
                              DataColumn(label: Text('Days')),
                              DataColumn(label: Text('Daily Rate')),
                              DataColumn(label: Text('Gross Pay')),
                              DataColumn(label: Text('Advances')),
                              DataColumn(label: Text('Net Pay')),
                            ],
                            rows: payrollRecords.map((record) {
                              return DataRow(
                                cells: [
                                  DataCell(
                                    Text(record.daysWorked.toString()),
                                  ),
                                  DataCell(
                                    Text(formatCurrency(record.dailyRate)),
                                  ),
                                  DataCell(
                                    Text(formatCurrency(record.grossPay)),
                                  ),
                                  DataCell(
                                    Text(formatCurrency(record.advances)),
                                  ),
                                  DataCell(
                                    Text(
                                      formatCurrency(record.netPay),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green,
                                      ),
                                    ),
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
}
