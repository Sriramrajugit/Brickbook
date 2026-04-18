import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/account.dart';
import '../models/company.dart';
import '../models/employee.dart';
import '../models/transaction.dart';
import '../models/attendance.dart';
import '../models/category.dart';
import '../models/user.dart';

class ApiService {
  // Update this to your backend API URL
  static const String baseUrl = 'http://localhost:3000/api';
  static String? _token;
  
  // Set token (called after login)
  static void setToken(String token) {
    _token = token;
  }
  
  // Get token from shared preferences on app startup
  static Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }
  
  // Get authorization headers
  static Map<String, String> _getHeaders() {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
      print('✅ Token sent in header: $_token');
    } else {
      print('❌ No token available!');
    }
    return headers;
  }
  
  // Companies
  static Future<List<Company>> getCompanies() async {
    final response = await http.get(
      Uri.parse('$baseUrl/companies'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Company.fromJson(json)).toList();
    }
    throw Exception('Failed to load companies');
  }
  
  // Accounts
  static Future<List<Account>> getAccounts() async {
    final response = await http.get(
      Uri.parse('$baseUrl/accounts'),
      headers: _getHeaders(),
    );
    print('📊 getAccounts response: ${response.statusCode} - ${response.body}');
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Account.fromJson(json)).toList();
    }
    throw Exception('Failed to load accounts');
  }

  static Future<Account> createAccount(String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/accounts'),
      headers: _getHeaders(),
      body: json.encode({'name': name}),
    );
    if (response.statusCode == 201) {
      return Account.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to create account');
  }

  // Employees
  static Future<List<Employee>> getEmployees() async {
    final response = await http.get(
      Uri.parse('$baseUrl/employees'),
      headers: _getHeaders(),
    );
    print('👥 getEmployees response: ${response.statusCode} - ${response.body}');
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Employee.fromJson(json)).toList();
    }
    throw Exception('Failed to load employees');
  }

  static Future<Employee> createEmployee(String name, double? salary) async {
    final response = await http.post(
      Uri.parse('$baseUrl/employees'),
      headers: _getHeaders(),
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
    final response = await http.get(
      Uri.parse('$baseUrl/transactions?limit=1000'),
      headers: _getHeaders(),
    );
    print('📈 getTransactions request: $baseUrl/transactions?limit=1000');
    print('📈 getTransactions response status: ${response.statusCode}');
    print('📈 getTransactions response body: ${response.body}');
    
    if (response.statusCode == 200) {
      final Map<String, dynamic> result = json.decode(response.body);
      // API returns { data: [...], pagination: {...} }
      final List<dynamic> data = result['data'] ?? [];
      return data.map((json) => Transaction.fromJson(json)).toList();
    }
    throw Exception('Failed to load transactions - Status: ${response.statusCode}');
  }

  static Future<Transaction> createTransaction(Transaction transaction) async {
    final transactionJson = transaction.toJson();
    print('📤 Creating transaction with data: $transactionJson');
    final response = await http.post(
      Uri.parse('$baseUrl/transactions'),
      headers: _getHeaders(),
      body: json.encode(transactionJson),
    );
    print('📤 createTransaction response status: ${response.statusCode}');
    print('📤 createTransaction response body: ${response.body}');
    
    if (response.statusCode == 201) {
      return Transaction.fromJson(json.decode(response.body));
    } else {
      final error = json.decode(response.body);
      print('❌ createTransaction error: $error');
      throw Exception(error['error'] ?? 'Failed to create transaction');
    }
  }

  // Attendance
  static Future<List<Attendance>> getAttendance({String? date}) async {
    String url = '$baseUrl/attendance';
    if (date != null) {
      url += '?date=$date';
    }
    final response = await http.get(
      Uri.parse(url),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Attendance.fromJson(json)).toList();
    }
    throw Exception('Failed to load attendance');
  }

  static Future<Attendance> markAttendance(int employeeId, String date, double status) async {
    final response = await http.post(
      Uri.parse('$baseUrl/attendance'),
      headers: _getHeaders(),
      body: json.encode({
        'employeeId': employeeId,
        'date': date,
        'status': status, // 1=Present, 0=Absent, 1.5=OT4Hrs, 2=OT8Hrs
      }),
    );
    if (response.statusCode == 201 || response.statusCode == 200) {
      return Attendance.fromJson(json.decode(response.body));
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Failed to mark attendance');
    }
  }

  // Payroll
  static Future<List<Map<String, dynamic>>> getPayroll({
    required int employeeId,
    required int accountId,
    required String fromDate,
    required String toDate,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/payroll?employeeId=$employeeId&fromDate=$fromDate&toDate=$toDate'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      final Map<String, dynamic> result = json.decode(response.body);
      final List<dynamic> data = result['data'] ?? [];
      return data.cast<Map<String, dynamic>>();
    }
    throw Exception('Failed to load payroll');
  }

  // Categories
  static Future<List<dynamic>> getCategories() async {
    final response = await http.get(
      Uri.parse('$baseUrl/categories'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      final responseBody = json.decode(response.body);
      // Handle both array and object response formats
      if (responseBody is List) {
        return responseBody;
      } else if (responseBody is Map && responseBody['data'] != null) {
        return responseBody['data'];
      }
      return responseBody as List;
    }
    throw Exception('Failed to load categories');
  }

  static Future<void> createCategory(Category category) async {
    final response = await http.post(
      Uri.parse('$baseUrl/categories'),
      headers: _getHeaders(),
      body: json.encode(category.toJson()),
    );
    if (response.statusCode != 201 && response.statusCode != 200) {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Failed to create category');
    }
  }

  // Users
  static Future<User> getCurrentUser() async {
    final response = await http.get(
      Uri.parse('$baseUrl/users/me'),
      headers: _getHeaders(),
    );
    print('👤 getCurrentUser response: ${response.statusCode} - ${response.body}');
    if (response.statusCode == 200) {
      return User.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to load user profile');
  }

  static Future<void> updateUserProfile(String userId, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/users/$userId'),
      headers: _getHeaders(),
      body: json.encode(data),
    );
    if (response.statusCode != 200) {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Failed to update profile');
    }
  }
}

