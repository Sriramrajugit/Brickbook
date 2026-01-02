class Account {
  final int id;
  final String name;
  final String type;
  final double budget;
  final DateTime? startDate;
  final DateTime? endDate;
  final int companyId;
  final DateTime createdAt;
  final DateTime updatedAt;

  Account({
    required this.id,
    required this.name,
    required this.type,
    required this.budget,
    this.startDate,
    this.endDate,
    required this.companyId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'],
      name: json['name'],
      type: json['type'] ?? 'General',
      budget: (json['budget'] as num).toDouble(),
      startDate: json['startDate'] != null ? DateTime.parse(json['startDate']) : null,
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
      companyId: json['companyId'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'budget': budget,
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'companyId': companyId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
