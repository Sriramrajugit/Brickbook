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
import '../models/bill.dart';

class ApiService {
  // Update this to your backend API URL
  // For local development:
 //static const String baseUrl = 'http://localhost:3000/api';
 //static const String baseUrl = 'http://192.168.1.7:3000/api';
  // For production:
  static const String baseUrl = 'https://www.brickbook.in/api';
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
      final decoded = json.decode(response.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('error')) {
          return [];
        }
        return [Company.fromJson(decoded)];
      } else if (decoded is List) {
        return decoded.map((json) => Company.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    }
    throw Exception('Failed to load companies');
  }
  
  // Accounts
  static Future<List<Account>> getAccounts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/accounts'),
        headers: _getHeaders(),
      );
      print('📊 getAccounts response: ${response.statusCode} - ${response.body}');
      
      if (response.statusCode == 200) {
        try {
          final Map<String, dynamic> result = json.decode(response.body);
          final List<dynamic> data = result['data'] ?? [];
          print('✅ Fetched ${data.length} accounts from API');
          
          final accounts = data.map((json) {
            print('📦 Processing account JSON: $json');
            return Account.fromJson(json as Map<String, dynamic>);
          }).toList();
          
          print('✅ Successfully parsed ${accounts.length} accounts');
          return accounts;
        } catch (parseError) {
          print('❌ Error parsing accounts response: $parseError');
          print('❌ Response body: ${response.body}');
          rethrow;
        }
      } else {
        print('❌ Accounts API returned status: ${response.statusCode}');
        throw Exception('Failed to load accounts: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Exception in getAccounts: $e');
      rethrow;
    }
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

  static Future<Transaction> updateTransaction(
    int transactionId,
    Transaction transaction,
  ) async {
    try {
      final transactionJson = transaction.toJson();
      print('📝 Updating transaction $transactionId with data: $transactionJson');
      final response = await http.put(
        Uri.parse('$baseUrl/transactions/$transactionId'),
        headers: _getHeaders(),
        body: json.encode(transactionJson),
      );

      print('📝 updateTransaction response status: ${response.statusCode}');
      print('📝 updateTransaction response body: ${response.body}');

      if (response.statusCode == 200) {
        return Transaction.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to update transaction');
      }
    } catch (e) {
      print('❌ Error in updateTransaction: $e');
      rethrow;
    }
  }

  static Future<void> deleteTransaction(int transactionId) async {
    try {
      print('🗑️ Deleting transaction $transactionId');
      final response = await http.delete(
        Uri.parse('$baseUrl/transactions/$transactionId'),
        headers: _getHeaders(),
      );

      print('🗑️ deleteTransaction response status: ${response.statusCode}');

      if (response.statusCode != 200 && response.statusCode != 204) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to delete transaction');
      }
    } catch (e) {
      print('❌ Error in deleteTransaction: $e');
      rethrow;
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

  // Get payroll preview for date range
  static Future<Map<String, dynamic>> getPayrollPreview({
    required String fromDate,
    required String toDate,
  }) async {
    try {
      print('📊 Fetching payroll preview from $fromDate to $toDate');
      final response = await http.get(
        Uri.parse('$baseUrl/payroll?fromDate=$fromDate&toDate=$toDate'),
        headers: _getHeaders(),
      );

      if (response.statusCode == 200) {
        final preview = json.decode(response.body) as List<dynamic>;
        print('✅ Fetched ${preview.length} payroll records');
        
        // Also fetch already paid employees
        final paidResponse = await http.get(
          Uri.parse('$baseUrl/payroll/paid?fromDate=$fromDate&toDate=$toDate'),
          headers: _getHeaders(),
        );
        
        List<int> paidEmployees = [];
        if (paidResponse.statusCode == 200) {
          final paidData = json.decode(paidResponse.body) as List<dynamic>;
          paidEmployees = paidData.map((p) => (p as Map<String, dynamic>)['employeeId'] as int).toList();
          print('✅ Found ${paidEmployees.length} already paid employees');
        }
        
        return {
          'preview': preview.cast<Map<String, dynamic>>(),
          'paid': paidEmployees,
        };
      } else {
        print('❌ Payroll preview API returned ${response.statusCode}');
        throw Exception('Failed to fetch payroll preview');
      }
    } catch (e) {
      print('❌ Error in getPayrollPreview: $e');
      rethrow;
    }
  }

  // Create payroll record
  static Future<void> createPayrollRecord({
    required int employeeId,
    required int accountId,
    required DateTime fromDate,
    required DateTime toDate,
    required double amount,
    String? remarks,
  }) async {
    try {
      final body = {
        'employeeId': employeeId,
        'accountId': accountId,
        'fromDate': fromDate.toIso8601String().split('T')[0],
        'toDate': toDate.toIso8601String().split('T')[0],
        'amount': amount,
        'remarks': remarks,
      };

      print('💾 Creating payroll record: $body');
      final response = await http.post(
        Uri.parse('$baseUrl/payroll'),
        headers: _getHeaders(),
        body: json.encode(body),
      );

      if (response.statusCode != 201 && response.statusCode != 200) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to create payroll record');
      }

      print('✅ Payroll record created successfully');
    } catch (e) {
      print('❌ Error in createPayrollRecord: $e');
      rethrow;
    }
  }

  // Categories
  static Future<List<Category>> getCategories() async {
    final response = await http.get(
      Uri.parse('$baseUrl/categories'),
      headers: _getHeaders(),
    );
    print('📋 getCategories response status: ${response.statusCode}');
    print('📋 getCategories response body: ${response.body}');
    
    if (response.statusCode == 200) {
      try {
        final responseBody = json.decode(response.body);
        
        // Handle array response (web API returns array directly)
        if (responseBody is List) {
          return responseBody
              .map((json) => Category.fromJson(json as Map<String, dynamic>))
              .toList();
        } 
        // Handle object response with data field
        else if (responseBody is Map<String, dynamic>) {
          if (responseBody['data'] != null) {
            final List<dynamic> data = responseBody['data'];
            return data
                .map((json) => Category.fromJson(json as Map<String, dynamic>))
                .toList();
          }
          // Single category returned as object
          return [Category.fromJson(responseBody)];
        }
        
        throw Exception('Unexpected response format');
      } catch (e) {
        print('❌ Error parsing categories: $e');
        throw Exception('Failed to parse categories: $e');
      }
    }
    throw Exception('Failed to load categories - Status: ${response.statusCode}');
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

  // Bills (Invoice Management)
  static Future<Map<String, dynamic>> getBills({
    int page = 1,
    int limit = 10,
    String? startDate,
    String? endDate,
    int? employeeId,
    String? status,
    String? sortBy = 'billDate',
    String? sortOrder = 'desc',
  }) async {
    try {
      String query = '$baseUrl/bills?page=$page&limit=$limit';
      if (startDate != null) query += '&startDate=$startDate';
      if (endDate != null) query += '&endDate=$endDate';
      if (employeeId != null) query += '&employeeId=$employeeId';
      if (status != null) query += '&status=$status';
      if (sortBy != null) query += '&sortBy=$sortBy';
      if (sortOrder != null) query += '&sortOrder=$sortOrder';

      print('📋 getBills URL: $query');
      final response = await http.get(
        Uri.parse(query),
        headers: _getHeaders(),
      );

      print('📋 getBills response status: ${response.statusCode}');
      print('📋 getBills response: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> result = json.decode(response.body);
        final List<dynamic> data = result['data'] ?? [];
        
        return {
          'bills': data.map((json) => Bill.fromJson(json as Map<String, dynamic>)).toList(),
          'pagination': result['pagination'] ?? {
            'page': page,
            'limit': limit,
            'total': data.length,
            'totalPages': 1,
          }
        };
      }
      throw Exception('Failed to load bills - Status: ${response.statusCode}');
    } catch (e) {
      print('❌ Error in getBills: $e');
      rethrow;
    }
  }

  static Future<Bill> createBill({
    required String invoiceNo,
    required DateTime billDate,
    DateTime? dueDate,
    required double amount,
    required int employeeId,
    required int accountId,
    String? billImagePath,
    String? notes,
  }) async {
    try {
      final body = {
        'invoiceNo': invoiceNo,
        'billDate': billDate.toIso8601String(),
        'dueDate': dueDate?.toIso8601String(),
        'amount': amount,
        'paidAmount': 0,
        'status': 'UNPAID',
        'employeeId': employeeId,
        'accountId': accountId,
        'billImagePath': billImagePath,
        'notes': notes,
      };

      print('📤 Creating bill with data: $body');
      final response = await http.post(
        Uri.parse('$baseUrl/bills'),
        headers: _getHeaders(),
        body: json.encode(body),
      );

      print('📤 createBill response status: ${response.statusCode}');
      print('📤 createBill response: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Bill.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to create bill');
      }
    } catch (e) {
      print('❌ Error in createBill: $e');
      rethrow;
    }
  }

  static Future<Bill> updateBill(
    int billId, {
    String? invoiceNo,
    DateTime? billDate,
    DateTime? dueDate,
    double? amount,
    double? paidAmount,
    String? status,
    int? accountId,
    String? billImagePath,
    String? notes,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (invoiceNo != null) body['invoiceNo'] = invoiceNo;
      if (billDate != null) body['billDate'] = billDate.toIso8601String();
      if (dueDate != null) body['dueDate'] = dueDate.toIso8601String();
      if (amount != null) body['amount'] = amount;
      if (paidAmount != null) body['paidAmount'] = paidAmount;
      if (status != null) body['status'] = status;
      if (accountId != null) body['accountId'] = accountId;
      if (billImagePath != null) body['billImagePath'] = billImagePath;
      if (notes != null) body['notes'] = notes;

      print('📝 Updating bill $billId with data: $body');
      final response = await http.put(
        Uri.parse('$baseUrl/bills/$billId'),
        headers: _getHeaders(),
        body: json.encode(body),
      );

      print('📝 updateBill response status: ${response.statusCode}');
      print('📝 updateBill response: ${response.body}');

      if (response.statusCode == 200) {
        return Bill.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to update bill');
      }
    } catch (e) {
      print('❌ Error in updateBill: $e');
      rethrow;
    }
  }

  static Future<void> deleteBill(int billId) async {
    try {
      print('🗑️ Deleting bill $billId');
      final response = await http.delete(
        Uri.parse('$baseUrl/bills/$billId'),
        headers: _getHeaders(),
      );

      print('🗑️ deleteBill response status: ${response.statusCode}');

      if (response.statusCode != 200 && response.statusCode != 204) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to delete bill');
      }
    } catch (e) {
      print('❌ Error in deleteBill: $e');
      rethrow;
    }
  }

  static Future<Bill> recordBillPayment(
    int billId, {
    required double paymentAmount,
    required DateTime paymentDate,
  }) async {
    try {
      final body = {
        'paymentAmount': paymentAmount,
        'paymentDate': paymentDate.toIso8601String(),
      };

      print('💰 Recording payment for bill $billId: $body');
      final response = await http.post(
        Uri.parse('$baseUrl/bills/$billId/payment'),
        headers: _getHeaders(),
        body: json.encode(body),
      );

      print('💰 recordBillPayment response status: ${response.statusCode}');
      print('💰 recordBillPayment response: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return Bill.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to record payment');
      }
    } catch (e) {
      print('❌ Error in recordBillPayment: $e');
      rethrow;
    }
  }
}

