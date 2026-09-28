class Employee {
  final int id;
  final String name;
  final String? etype;
  final double? salary;
  final String status;
  final String? partnerType; // For filtering: Employee, Supplier, Contractor
  final String? phone;
  final String? email;
  final String? address;
  final String? gstNumber;
  final int? creditPeriodDays;
  final String? salaryFrequency; // M = Monthly, D = Daily/Piece Rate
  final DateTime createdAt;
  final DateTime updatedAt;

  Employee({
    required this.id,
    required this.name,
    this.etype,
    this.salary,
    required this.status,
    this.partnerType,
    this.phone,
    this.email,
    this.address,
    this.gstNumber,
    this.creditPeriodDays,
    this.salaryFrequency,
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
        phone: json['phone'] as String?,
        email: json['email'] as String?,
        address: json['address'] as String?,
        gstNumber: json['gstNumber'] as String?,
        creditPeriodDays: json['creditPeriodDays'] as int?,
        salaryFrequency: json['salaryFrequency'] as String?,
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
      'phone': phone,
      'email': email,
      'address': address,
      'gstNumber': gstNumber,
      'creditPeriodDays': creditPeriodDays,
      'salaryFrequency': salaryFrequency,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
