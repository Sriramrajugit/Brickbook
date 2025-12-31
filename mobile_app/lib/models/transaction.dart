class Transaction {
  final int id;
  final double amount;
  final String? description;
  final String category;
  final String type;
  final DateTime date;
  final int accountId;
  final Account? account;
  final DateTime createdAt;
  final DateTime updatedAt;

  Transaction({
    required this.id,
    required this.amount,
    this.description,
    required this.category,
    required this.type,
    required this.date,
    required this.accountId,
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
      date: DateTime.parse(json['date']),
      accountId: json['accountId'],
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
