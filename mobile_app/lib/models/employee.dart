class Employee {
  final int id;
  final String name;
  final String? etype;
  final double? salary;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Employee({
    required this.id,
    required this.name,
    this.etype,
    this.salary,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'],
      name: json['name'],
      etype: json['etype'],
      salary: json['salary'] != null ? (json['salary'] as num).toDouble() : null,
      status: json['status'] ?? 'Active',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'etype': etype,
      'salary': salary,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
