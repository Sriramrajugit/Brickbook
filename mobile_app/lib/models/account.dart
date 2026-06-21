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
    try {
      print('📦 Parsing Account from: $json');
      final account = Account(
        id: json['id'] as int? ?? 0,
        name: json['name'] as String? ?? 'Unknown',
        type: json['type'] as String? ?? 'General',
        budget: (json['budget'] as num?)?.toDouble() ?? 0.0,
        startDate: json['startDate'] != null ? DateTime.parse(json['startDate'].toString()) : null,
        endDate: json['endDate'] != null ? DateTime.parse(json['endDate'].toString()) : null,
        companyId: json['companyId'] as int? ?? 1,
        createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'].toString()) : DateTime.now(),
        updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'].toString()) : DateTime.now(),
      );
      print('✅ Account parsed successfully: id=${account.id}, name=${account.name}');
      return account;
    } catch (e) {
      print('❌ Error parsing Account: $e');
      print('❌ JSON received: $json');
      print('❌ Stack trace: ${StackTrace.current}');
      rethrow;
    }
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
