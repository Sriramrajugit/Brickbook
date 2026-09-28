class Bill {
  final int id;
  final String invoiceNo;
  final DateTime billDate;
  final DateTime? dueDate;
  final double amount;
  final double paidAmount;
  final String status; // UNPAID, PARTIALLY_PAID, FULLY_PAID
  final int employeeId;
  final String employeeName;
  final int accountId;
  final String? accountName;
  final String? partnerType;
  final String? billImagePath;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Bill({
    required this.id,
    required this.invoiceNo,
    required this.billDate,
    this.dueDate,
    required this.amount,
    required this.paidAmount,
    required this.status,
    required this.employeeId,
    required this.employeeName,
    required this.accountId,
    this.accountName,
    this.partnerType,
    this.billImagePath,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  double get pendingAmount => amount - paidAmount;
  double get paymentPercentage => amount > 0 ? (paidAmount / amount) * 100 : 0;
  bool get isFullyPaid => status == 'FULLY_PAID';
  bool get isPartiallyPaid => status == 'PARTIALLY_PAID';
  bool get isUnpaid => status == 'UNPAID';
  bool get isOverdue => dueDate != null && dueDate!.isBefore(DateTime.now()) && !isFullyPaid;

  factory Bill.fromJson(Map<String, dynamic> json) {
    try {
      return Bill(
        id: json['id'] as int? ?? 0,
        invoiceNo: json['invoiceNo'] as String? ?? '',
        billDate: json['billDate'] != null ? DateTime.parse(json['billDate'].toString()) : DateTime.now(),
        dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate'].toString()) : null,
        amount: json['amount'] != null ? (json['amount'] as num).toDouble() : 0.0,
        paidAmount: json['paidAmount'] != null ? (json['paidAmount'] as num).toDouble() : 0.0,
        status: json['status'] as String? ?? 'UNPAID',
        employeeId: json['employeeId'] as int? ?? 0,
        employeeName: json['employee'] != null && json['employee'] is Map
            ? (json['employee']['name'] as String? ?? 'Unknown')
            : (json['employeeName'] as String? ?? 'Unknown'),
        accountId: json['accountId'] as int? ?? 0,
        accountName: json['account'] != null && json['account'] is Map
            ? (json['account']['name'] as String?)
            : (json['accountName'] as String?),
        partnerType: json['employee'] != null && json['employee'] is Map
            ? (json['employee']['partnerType'] as String?)
            : (json['partnerType'] as String?),
        billImagePath: json['billImagePath'] as String?,
        notes: json['notes'] as String?,
        createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'].toString()) : DateTime.now(),
        updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'].toString()) : DateTime.now(),
      );
    } catch (e) {
      print('❌ Error parsing Bill: $e');
      print('❌ JSON: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'invoiceNo': invoiceNo,
      'billDate': billDate.toIso8601String(),
      'dueDate': dueDate?.toIso8601String(),
      'amount': amount,
      'paidAmount': paidAmount,
      'status': status,
      'employeeId': employeeId,
      'accountId': accountId,
      'billImagePath': billImagePath,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
