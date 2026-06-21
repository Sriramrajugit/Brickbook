import 'package:flutter/material.dart';
import '../models/employee.dart';
import '../models/attendance.dart';
import '../models/user.dart';
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
  bool isMonthlyView = false; // Toggle between daily (false) and monthly (true) view
  User? currentUser;

  @override
  void initState() {
    super.initState();
    fetchCurrentUser();
    fetchEmployees();
  }

  Future<void> fetchCurrentUser() async {
    try {
      final user = await ApiService.getCurrentUser();
      setState(() {
        currentUser = user;
      });
    } catch (e) {
      print('Failed to fetch current user: ${e.toString()}');
    }
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
    // Check if user is a guest
    if (currentUser?.role == 'GUEST') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Permission denied. Guest users cannot mark attendance.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

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
                    // Permission warning for guest users
                    if (currentUser?.role == 'GUEST')
                      Card(
                        color: Colors.red.shade50,
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Row(
                            children: [
                              Icon(Icons.lock, color: Colors.red.shade700),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'You do not have permission to mark attendance as a guest user.',
                                  style: TextStyle(
                                    color: Colors.red.shade700,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    // Date Picker
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // View Toggle
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Attendance Management',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                // Toggle button for monthly/daily view
                                SegmentedButton<bool>(
                                  segments: const [
                                    ButtonSegment(label: Text('Daily'), value: false),
                                    ButtonSegment(label: Text('Monthly'), value: true),
                                  ],
                                  selected: {isMonthlyView},
                                  onSelectionChanged: (Set<bool> newSelection) {
                                    setState(() => isMonthlyView = newSelection.first);
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            // Conditional content based on view mode
                            if (!isMonthlyView) ...[
                              // Daily view
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
                                          firstDate: DateTime(2020),
                                          lastDate: DateTime.now(),
                                        );
                                        if (picked != null) {
                                          setState(() => selectedDate = picked);
                                          await fetchAttendance();
                                        }
                                      },
                                      child: Text(
                                        selectedDate.toLocal().toString().split(' ')[0],
                                        style: const TextStyle(fontSize: 16),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ] else ...[
                              // Monthly view
                              Row(
                                children: [
                                  const Text('Select Month: '),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextButton(
                                      onPressed: () async {
                                        final picked = await showDatePicker(
                                          context: context,
                                          initialDate: selectedDate,
                                          firstDate: DateTime(2020),
                                          lastDate: DateTime.now(),
                                        );
                                        if (picked != null) {
                                          setState(() => selectedDate = picked);
                                          await fetchAttendance();
                                        }
                                      },
                                      child: Text(
                                        '${selectedDate.month}/${selectedDate.year}',
                                        style: const TextStyle(fontSize: 16),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
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
                                    enabled: currentUser?.role != 'GUEST',
                                  ),
                                  _buildStatusButton(
                                    label: 'OT 4H',
                                    status: 1.5,
                                    employee: employee,
                                    isSelected: currentStatus == 1.5,
                                    color: Colors.purple,
                                    enabled: currentUser?.role != 'GUEST',
                                  ),
                                  _buildStatusButton(
                                    label: 'OT 8H',
                                    status: 2.0,
                                    employee: employee,
                                    isSelected: currentStatus == 2.0,
                                    color: Colors.deepPurple,
                                    enabled: currentUser?.role != 'GUEST',
                                  ),
                                  _buildStatusButton(
                                    label: 'Absent',
                                    status: 0.0,
                                    employee: employee,
                                    isSelected: currentStatus == 0.0,
                                    color: Colors.red,
                                    enabled: currentUser?.role != 'GUEST',
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
    required bool enabled,
  }) {
    return OutlinedButton(
      onPressed: enabled ? () => markAttendance(employee.id, employee.name, status) : null,
      style: OutlinedButton.styleFrom(
        foregroundColor: isSelected ? Colors.white : (enabled ? color : Colors.grey),
        backgroundColor: isSelected ? color : Colors.transparent,
        side: BorderSide(color: enabled ? color : Colors.grey),
      ),
      child: Text(label),
    );
  }
}
