class PayrollRecord {
  final int employeeId;
  final String employeeName;
  final int accountId;
  final String accountName;
  final int daysWorked;
  final double dailyRate;
  final double grossPay;
  final double advances;
  final double netPay;

  PayrollRecord({
    required this.employeeId,
    required this.employeeName,
    required this.accountId,
    required this.accountName,
    required this.daysWorked,
    required this.dailyRate,
    required this.grossPay,
    required this.advances,
    required this.netPay,
  });

  factory PayrollRecord.fromJson(Map<String, dynamic> json) {
    return PayrollRecord(
      employeeId: json['employeeId'],
      employeeName: json['employeeName'],
      accountId: json['accountId'],
      accountName: json['accountName'],
      daysWorked: json['daysWorked'],
      dailyRate: (json['dailyRate'] as num).toDouble(),
      grossPay: (json['grossPay'] as num).toDouble(),
      advances: (json['advances'] as num).toDouble(),
      netPay: (json['netPay'] as num).toDouble(),
    );
  }
}
