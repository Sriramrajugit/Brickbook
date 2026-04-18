import 'account.dart';

class Transaction {
  final int id;
  final double amount;
  final String? description;
  final String category;
  final String type;
  final String paymentMode;
  final DateTime date;
  final int accountId;
  final int? categoryId;
  final int? createdBy;
  final int companyId;
  final int? siteId;
  final Account? account;
  final DateTime createdAt;
  final DateTime updatedAt;

  Transaction({
    required this.id,
    required this.amount,
    this.description,
    required this.category,
    required this.type,
    required this.paymentMode,
    required this.date,
    required this.accountId,
    this.categoryId,
    this.createdBy,
    required this.companyId,
    this.siteId,
    this.account,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as int? ?? 0,
      amount: (json['amount'] as num).toDouble(),
      description: json['description'] as String?,
      category: json['category'] as String? ?? '',
      type: json['type'] as String? ?? '',
      paymentMode: json['paymentMode'] as String? ?? 'G-Pay',
      date: json['date'] != null ? DateTime.parse(json['date'].toString()) : DateTime.now(),
      accountId: json['accountId'] as int? ?? 0,
      categoryId: json['categoryId'] as int?,
      createdBy: json['createdBy'] as int?,
      companyId: json['companyId'] as int? ?? 1,
      siteId: json['siteId'] as int?,
      account: json['account'] != null ? Account.fromJson(json['account']) : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'].toString()) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'].toString()) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = {
      'amount': amount,
      'description': description,
      'category': category,
      'type': type,
      'paymentMode': paymentMode,
      'date': date.toIso8601String().split('T')[0],  // Format as YYYY-MM-DD
      'accountId': accountId,
      'companyId': companyId,
    };
    print('📤 Transaction.toJson(): $json');
    return json;
  }
}
