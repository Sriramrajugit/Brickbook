class Attendance {
  final int id;
  final int employeeId;
  final DateTime date;
  final String status;
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
      status: json['status'],
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
}

class Employee {
  final int id;
  final String name;

  Employee({required this.id, required this.name});

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'],
      name: json['name'],
    );
  }
}
