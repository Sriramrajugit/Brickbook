class Company {
  final int id;
  final String name;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String package; // FOUNDATION, STRUCTURE, LANDMARK

  Company({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
    this.package = 'FOUNDATION',
  });

  factory Company.fromJson(Map<String, dynamic> json) {
    return Company(
      id: json['id'],
      name: json['name'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
      package: json['package'] ?? 'FOUNDATION',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'package': package,
    };
  }
}
