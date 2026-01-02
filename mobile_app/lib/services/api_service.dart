import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/account.dart';
import '../models/company.dart';
import '../models/employee.dart';
import '../models/transaction.dart';
import '../models/attendance.dart';

class ApiService {
  // Update this to your backend API URL
  static const String baseUrl = 'http://192.168.0.102:3000/api';
  
  // Companies
  static Future<List<Company>> getCompanies() async {
    final response = await http.get(Uri.parse('$baseUrl/companies'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Company.fromJson(json)).toList();
    }
    throw Exception('Failed to load companies');
  }
  
  // Accounts
  static Future<List<Account>> getAccounts() async {
    final response = await http.get(Uri.parse('$baseUrl/accounts'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Account.fromJson(json)).toList();
    }
    throw Exception('Failed to load accounts');
  }

  static Future<Account> createAccount(String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/accounts'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'name': name}),
    );
    if (response.statusCode == 201) {
      return Account.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to create account');
  }

  // Employees
  static Future<List<Employee>> getEmployees() async {
    final response = await http.get(Uri.parse('$baseUrl/employees'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Employee.fromJson(json)).toList();
    }
    throw Exception('Failed to load employees');
  }

  static Future<Employee> createEmployee(String name, double? salary) async {
    final response = await http.post(
      Uri.parse('$baseUrl/employees'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'name': name,
        'salary': salary,
        'status': 'Active',
      }),
    );
    if (response.statusCode == 201) {
      return Employee.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to create employee');
  }

  // Transactions
  static Future<List<Transaction>> getTransactions() async {
    final response = await http.get(Uri.parse('$baseUrl/transactions?limit=1000'));
    if (response.statusCode == 200) {
      final Map<String, dynamic> result = json.decode(response.body);
      // API returns { data: [...], pagination: {...} }
      final List<dynamic> data = result['data'] ?? [];
      return data.map((json) => Transaction.fromJson(json)).toList();
    }
    throw Exception('Failed to load transactions');
  }

  static Future<Transaction> createTransaction(Transaction transaction) async {
    final response = await http.post(
      Uri.parse('$baseUrl/transactions'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(transaction.toJson()),
    );
    if (response.statusCode == 201) {
      return Transaction.fromJson(json.decode(response.body));
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Failed to create transaction');
    }
  }

  // Attendance
  static Future<List<Attendance>> getAttendance({String? date}) async {
    String url = '$baseUrl/attendance';
    if (date != null) {
      url += '?date=$date';
    }
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Attendance.fromJson(json)).toList();
    }
    throw Exception('Failed to load attendance');
  }

  static Future<Attendance> markAttendance(int employeeId, String date, String status) async {
    final response = await http.post(
      Uri.parse('$baseUrl/attendance'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'employeeId': employeeId,
        'date': date,
        'status': status,
      }),
    );
    if (response.statusCode == 201 || response.statusCode == 200) {
      return Attendance.fromJson(json.decode(response.body));
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Failed to mark attendance');
    }
  }
}

