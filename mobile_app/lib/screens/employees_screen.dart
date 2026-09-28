import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/offline_api_service.dart';
import '../models/employee.dart';
import '../widgets/drawer_menu.dart';

class EmployeesScreen extends StatefulWidget {
  const EmployeesScreen({super.key});

  @override
  State<EmployeesScreen> createState() => _EmployeesScreenState();
}

class _EmployeesScreenState extends State<EmployeesScreen> {
  List<Employee> employees = [];
  Employee? editingEmployee;
  bool isLoading = true;
  String error = '';
  String sortBy = 'name'; // name or partnerType
  String sortOrder = 'asc'; // asc or desc

  // Form controllers
  late TextEditingController nameController;
  late TextEditingController emailController;
  late TextEditingController phoneController;
  late TextEditingController addressController;
  late TextEditingController gstController;
  late TextEditingController creditPeriodController;
  late TextEditingController etypeController;
  late TextEditingController salaryController;

  String partnerType = 'Employee'; // Employee, Supplier, Contractor
  String salaryFrequency = 'Monthly'; // Monthly, Daily
  String status = 'Active'; // Active, Inactive

  @override
  void initState() {
    super.initState();
    nameController = TextEditingController();
    emailController = TextEditingController();
    phoneController = TextEditingController();
    addressController = TextEditingController();
    gstController = TextEditingController();
    creditPeriodController = TextEditingController(text: '30');
    etypeController = TextEditingController();
    salaryController = TextEditingController();
    loadEmployees();
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    addressController.dispose();
    gstController.dispose();
    creditPeriodController.dispose();
    etypeController.dispose();
    salaryController.dispose();
    super.dispose();
  }

  Future<void> loadEmployees() async {
    try {
      setState(() => isLoading = true);
      final data = await OfflineApiService.getEmployees();
      setState(() {
        employees = data;
        _sortEmployees();
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  void _sortEmployees() {
    employees.sort((a, b) {
      int comparison = 0;
      if (sortBy == 'name') {
        comparison = a.name.toLowerCase().compareTo(b.name.toLowerCase());
      } else {
        comparison = (a.partnerType ?? '').toLowerCase().compareTo((b.partnerType ?? '').toLowerCase());
        if (comparison == 0) {
          comparison = a.name.toLowerCase().compareTo(b.name.toLowerCase());
        }
      }
      return sortOrder == 'asc' ? comparison : -comparison;
    });
  }

  void handleSort(String field) {
    if (sortBy == field) {
      sortOrder = sortOrder == 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = 'asc';
    }
    setState(() {
      _sortEmployees();
    });
  }

  void resetForm() {
    nameController.clear();
    emailController.clear();
    phoneController.clear();
    addressController.clear();
    gstController.clear();
    creditPeriodController.text = '30';
    etypeController.clear();
    salaryController.clear();
    partnerType = 'Employee';
    salaryFrequency = 'Monthly';
    status = 'Active';
    editingEmployee = null;
  }

  void startEdit(Employee employee) {
    setState(() {
      editingEmployee = employee;
      nameController.text = employee.name;
      emailController.text = employee.email ?? '';
      phoneController.text = employee.phone ?? '';
      addressController.text = employee.address ?? '';
      gstController.text = employee.gstNumber ?? '';
      creditPeriodController.text = employee.creditPeriodDays?.toString() ?? '30';
      etypeController.text = employee.etype ?? '';
      salaryController.text = employee.salary?.toString() ?? '';
      partnerType = employee.partnerType ?? 'Employee';
      salaryFrequency = (employee.salaryFrequency == 'D' || employee.salaryFrequency == 'Daily') ? 'Daily' : 'Monthly';
      status = employee.status;
    });
  }

  Future<void> saveEmployee() async {
    if (nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter employee name')),
      );
      return;
    }

    try {
      final salary = salaryController.text.isNotEmpty
          ? double.tryParse(salaryController.text)
          : null;

      if (editingEmployee == null) {
        await OfflineApiService.createEmployee(nameController.text, salary);
      }
      // Update functionality not available in current API
      // TODO: Implement update when API supports it

      resetForm();
      loadEmployees();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(editingEmployee != null ? 'Employee updated' : 'Employee created'),
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

  Future<void> deleteEmployee(int id) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Employee'),
        content: const Text('Are you sure you want to delete this employee?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                // Delete functionality not available in current API
                // TODO: Implement delete when API supports it
                loadEmployees();
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Delete functionality coming soon')),
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
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees & Partners'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      drawer: const DrawerMenu(currentRoute: '/employees'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Add/Edit Form
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            editingEmployee != null ? 'Edit Partner' : 'Add New Partner',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: nameController,
                            decoration: const InputDecoration(
                              labelText: 'Name',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            value: partnerType,
                            decoration: const InputDecoration(
                              labelText: 'Partner Type',
                              border: OutlineInputBorder(),
                            ),
                            items: ['Employee', 'Supplier', 'Contractor']
                                .map((type) => DropdownMenuItem(
                                      value: type,
                                      child: Text(type),
                                    ))
                                .toList(),
                            onChanged: (value) {
                              setState(() => partnerType = value ?? 'Employee');
                            },
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: etypeController,
                            decoration: InputDecoration(
                              labelText: partnerType == 'Employee' ? 'Designation' : 'Type',
                              border: const OutlineInputBorder(),
                            ),
                          ),
                          if (partnerType == 'Supplier') ...[
                            const SizedBox(height: 12),
                            TextField(
                              controller: emailController,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: phoneController,
                              decoration: const InputDecoration(
                                labelText: 'Phone',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: addressController,
                              decoration: const InputDecoration(
                                labelText: 'Address',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: gstController,
                              decoration: const InputDecoration(
                                labelText: 'GST Number',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: creditPeriodController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Credit Period (Days)',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ],
                          if (partnerType == 'Employee') ...[
                            const SizedBox(height: 12),
                            DropdownButtonFormField<String>(
                              value: salaryFrequency,
                              decoration: const InputDecoration(
                                labelText: 'Salary Frequency',
                                border: OutlineInputBorder(),
                              ),
                              items: ['Monthly', 'Daily']
                                  .map((freq) => DropdownMenuItem(
                                        value: freq,
                                        child: Text(freq),
                                      ))
                                  .toList(),
                              onChanged: (value) {
                                setState(() => salaryFrequency = value ?? 'Monthly');
                              },
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: salaryController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Salary',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ],
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            value: status,
                            decoration: const InputDecoration(
                              labelText: 'Status',
                              border: OutlineInputBorder(),
                            ),
                            items: ['Active', 'Inactive']
                                .map((s) => DropdownMenuItem(
                                      value: s,
                                      child: Text(s),
                                    ))
                                .toList(),
                            onChanged: (value) {
                              setState(() => status = value ?? 'Active');
                            },
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              ElevatedButton(
                                onPressed: saveEmployee,
                                child: Text(editingEmployee != null ? 'Update' : 'Add'),
                              ),
                              if (editingEmployee != null)
                                OutlinedButton(
                                  onPressed: () {
                                    resetForm();
                                    setState(() {});
                                  },
                                  child: const Text('Cancel'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Employees List
                  Text(
                    'Partners List',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (isLoading)
                    const Center(child: CircularProgressIndicator())
                  else if (employees.isEmpty)
                    const Center(child: Text('No employees found'))
                  else
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: DataTable(
                        columns: [
                          DataColumn(
                            label: GestureDetector(
                              onTap: () => handleSort('name'),
                              child: Row(
                                children: [
                                  const Text('Name'),
                                  if (sortBy == 'name')
                                    Text(sortOrder == 'asc' ? ' ▲' : ' ▼'),
                                ],
                              ),
                            ),
                          ),
                          DataColumn(
                            label: GestureDetector(
                              onTap: () => handleSort('partnerType'),
                              child: Row(
                                children: [
                                  const Text('Type'),
                                  if (sortBy == 'partnerType')
                                    Text(sortOrder == 'asc' ? ' ▲' : ' ▼'),
                                ],
                              ),
                            ),
                          ),
                          const DataColumn(label: Text('Designation')),
                          const DataColumn(label: Text('Salary Freq')),
                          const DataColumn(label: Text('Salary')),
                          const DataColumn(label: Text('Status')),
                        ],
                        rows: employees
                            .map((employee) => DataRow(
                                  cells: [
                                    DataCell(Text(employee.name)),
                                    DataCell(
                                      Chip(
                                        label: Text(employee.partnerType ?? ''),
                                        backgroundColor: employee.partnerType == 'Employee'
                                            ? Colors.blue[100]
                                            : employee.partnerType == 'Supplier'
                                                ? Colors.green[100]
                                                : Colors.purple[100],
                                      ),
                                    ),
                                    DataCell(Text(employee.etype ?? '-')),
                                    DataCell(
                                      Text(employee.partnerType == 'Employee'
                                          ? (employee.salaryFrequency == 'M' || employee.salaryFrequency == 'Monthly'
                                              ? 'Monthly'
                                              : 'Daily')
                                          : 'N/A'),
                                    ),
                                    DataCell(
                                      Text(employee.partnerType == 'Employee'
                                          ? (employee.salary != null
                                              ? currencyFormat.format(employee.salary)
                                              : 'N/A')
                                          : 'N/A'),
                                    ),
                                    DataCell(Text(employee.status)),
                                  ],
                                ))
                            .toList(),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
