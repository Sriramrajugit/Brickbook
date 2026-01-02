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
      id: json['id'],
      amount: (json['amount'] as num).toDouble(),
      description: json['description'],
      category: json['category'],
      type: json['type'],
      paymentMode: json['paymentMode'] ?? 'G-Pay',
      date: DateTime.parse(json['date']),
      accountId: json['accountId'],
      categoryId: json['categoryId'],
      createdBy: json['createdBy'],
      companyId: json['companyId'],
      siteId: json['siteId'],
      account: json['account'] != null ? Account.fromJson(json['account']) : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'description': description,
      'category': category,
      'type': type,
      'paymentMode': paymentMode,
      'date': date.toIso8601String().split('T')[0],
      'accountId': accountId,
    };
  }
}

class Account {
  final int id;
  final String name;

  Account({required this.id, required this.name});

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'],
      name: json['name'],
    );
  }
}
