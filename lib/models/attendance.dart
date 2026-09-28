import 'employee.dart';

class Attendance {
  final int id;
  final int employeeId;
  final DateTime date;
  final double status; // 1=Present, 0=Absent, 1.5=OT4Hrs, 2=OT8Hrs
  final Employee? employee;

  Attendance({
    required this.id,
    required this.employeeId,
    required this.date,
    required this.status,
    this.employee,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'],
      employeeId: json['employeeId'],
      date: DateTime.parse(json['date']),
      status: (json['status'] is double) ? json['status'] : (json['status'] as int).toDouble(),
      employee: json['employee'] != null ? Employee.fromJson(json['employee']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'employeeId': employeeId,
      'date': date.toIso8601String().split('T')[0],
      'status': status,
    };
  }

  // Helper to get status label
  String getStatusLabel() {
    switch (status) {
      case 1.0:
        return 'Present';
      case 0.0:
        return 'Absent';
      case 1.5:
        return 'OT 4 Hours';
      case 2.0:
        return 'OT 8 Hours';
      default:
        return 'Unknown';
    }
  }
}
