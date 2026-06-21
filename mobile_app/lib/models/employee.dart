class Employee {
  final int id;
  final String name;
  final String? etype;
  final double? salary;
  final String status;
  final String? partnerType; // For filtering: Employee, Supplier, Contractor
  final DateTime createdAt;
  final DateTime updatedAt;

  Employee({
    required this.id,
    required this.name,
    this.etype,
    this.salary,
    required this.status,
    this.partnerType,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    try {
      return Employee(
        id: json['id'] as int? ?? 0,
        name: json['name'] as String? ?? 'Unknown',
        etype: json['etype'] as String?,
        salary: json['salary'] != null ? (json['salary'] as num).toDouble() : null,
        status: json['status'] as String? ?? 'Active',
        partnerType: json['partnerType'] as String?,
        createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'].toString()) : DateTime.now(),
        updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'].toString()) : DateTime.now(),
      );
    } catch (e) {
      print('❌ Error parsing Employee: $e');
      print('❌ JSON: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'etype': etype,
      'salary': salary,
      'status': status,
      'partnerType': partnerType,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
