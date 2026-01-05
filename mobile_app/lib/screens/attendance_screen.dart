import 'package:flutter/material.dart';
import '../models/employee.dart';
import '../models/attendance.dart';
import '../services/api_service.dart';
import '../widgets/drawer_menu.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<Employee> employees = [];
  List<Attendance> attendanceRecords = [];
  DateTime selectedDate = DateTime.now();
  bool loading = true;
  Map<int, bool> saving = {};
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    fetchEmployees();
  }

  Future<void> fetchEmployees() async {
    try {
      final employeeList = await ApiService.getEmployees();
      setState(() {
        employees = employeeList;
        loading = false;
      });
      await fetchAttendance();
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load employees: ${e.toString()}';
        loading = false;
      });
    }
  }

  Future<void> fetchAttendance() async {
    try {
      final dateStr = selectedDate.toIso8601String().split('T')[0];
      final records = await ApiService.getAttendance(date: dateStr);
      setState(() {
        attendanceRecords = records;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load attendance: ${e.toString()}';
        attendanceRecords = [];
      });
    }
  }

  Future<void> markAttendance(
    int employeeId,
    String employeeName,
    double status,
  ) async {
    // Validate: No future dates allowed
    final today = DateTime.now();
    if (selectedDate.isAfter(today)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Future date attendance is not allowed')),
      );
      return;
    }

    setState(() => saving[employeeId] = true);

    try {
      final dateStr = selectedDate.toIso8601String().split('T')[0];
      await ApiService.markAttendance(employeeId, dateStr, status);
      await fetchAttendance();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Attendance marked successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => saving[employeeId] = false);
      }
    }
  }

  String getStatusDisplay(double status) {
    if (status == 1.0) return 'Present';
    if (status == 1.5) return 'OT 4 Hrs';
    if (status == 2.0) return 'OT 8 Hrs';
    if (status == 0.0) return 'Absent';
    return 'Not Marked';
  }

  Color getStatusColor(double status) {
    if (status == 1.0) return Colors.green;
    if (status == 1.5 || status == 2.0) return Colors.purple;
    if (status == 0.0) return Colors.red;
    return Colors.grey;
  }

  double? getAttendanceStatus(int employeeId) {
    final record = attendanceRecords.firstWhere(
      (r) =>
          r.employeeId == employeeId &&
          r.date.toIso8601String().split('T')[0] ==
              selectedDate.toIso8601String().split('T')[0],
      orElse: () => Attendance(
        id: -1,
        employeeId: -1,
        date: DateTime.now(),
        status: -1,
      ),
    );
    return record.id == -1 ? null : record.status;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      drawer: const DrawerMenu(currentRoute: '/attendance'),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Date Picker
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Mark Daily Attendance',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                const Text('Select Date: '),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextButton(
                                    onPressed: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: selectedDate,
                                        firstDate:
                                            DateTime(2020),
                                        lastDate: DateTime.now(),
                                      );
                                      if (picked != null) {
                                        setState(() => selectedDate = picked);
                                        await fetchAttendance();
                                      }
                                    },
                                    child: Text(
                                      selectedDate
                                          .toLocal()
                                          .toString()
                                          .split(' ')[0],
                                      style: const TextStyle(
                                          fontSize: 16),
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

                    // Employees Attendance Marking
                    ...employees.map((employee) {
                      final currentStatus =
                          getAttendanceStatus(employee.id);
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        employee.name,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Status: ${currentStatus != null ? getStatusDisplay(currentStatus) : 'Not Marked'}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: currentStatus !=
                                                  null
                                              ? getStatusColor(
                                                  currentStatus)
                                              : Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                children: [
                                  _buildStatusButton(
                                    label: 'Present',
                                    status: 1.0,
                                    employee: employee,
                                    isSelected: currentStatus == 1.0,
                                    color: Colors.green,
                                  ),
                                  _buildStatusButton(
                                    label: 'OT 4H',
                                    status: 1.5,
                                    employee: employee,
                                    isSelected: currentStatus == 1.5,
                                    color: Colors.purple,
                                  ),
                                  _buildStatusButton(
                                    label: 'OT 8H',
                                    status: 2.0,
                                    employee: employee,
                                    isSelected: currentStatus == 2.0,
                                    color: Colors.deepPurple,
                                  ),
                                  _buildStatusButton(
                                    label: 'Absent',
                                    status: 0.0,
                                    employee: employee,
                                    isSelected: currentStatus == 0.0,
                                    color: Colors.red,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),

                    const SizedBox(height: 24),

                    // Recent Records
                    if (attendanceRecords.isNotEmpty) ...[
                      const Text(
                        'Recent Attendance Records',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Card(
                        child: DataTable(
                          columns: const [
                            DataColumn(label: Text('Employee')),
                            DataColumn(label: Text('Date')),
                            DataColumn(label: Text('Status')),
                          ],
                          rows: attendanceRecords.map((record) {
                            return DataRow(
                              cells: [
                                DataCell(Text(record.employee?.name ??
                                    'Unknown')),
                                DataCell(Text(
                                  record.date
                                      .toLocal()
                                      .toString()
                                      .split(' ')[0],
                                )),
                                DataCell(
                                  Chip(
                                    label: Text(
                                      getStatusDisplay(
                                          record.status),
                                      style: const TextStyle(
                                          color: Colors.white),
                                    ),
                                    backgroundColor: getStatusColor(
                                        record.status),
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
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

  Widget _buildStatusButton({
    required String label,
    required double status,
    required Employee employee,
    required bool isSelected,
    required Color color,
  }) {
    return OutlinedButton(
      onPressed: () => markAttendance(employee.id, employee.name, status),
      style: OutlinedButton.styleFrom(
        foregroundColor: isSelected ? Colors.white : color,
        backgroundColor: isSelected ? color : Colors.transparent,
        side: BorderSide(color: color),
      ),
      child: Text(label),
    );
  }
}
