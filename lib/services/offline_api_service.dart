import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'api_service.dart';
import 'local_database.dart';
import '../models/transaction.dart';
import '../models/employee.dart';
import '../models/account.dart';
import '../models/category.dart';
import '../models/bill.dart';

class OfflineApiService {
  static final LocalDatabase _localDb = LocalDatabase();

  // Check if device is online
  static Future<bool> isOnline() async {
    if (kIsWeb) return true; // Web client is assumed to be online
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  // TRANSACTIONS - Works offline
  static Future<List<Transaction>> getTransactions() async {
    if (kIsWeb) {
      return await ApiService.getTransactions();
    }
    if (await isOnline()) {
      try {
        // Try to fetch from server
        final transactions = await ApiService.getTransactions();
        // Save to local DB
        await _localDb.saveServerData(transactions, [], []);
        return transactions;
      } catch (e) {
        print('API call failed, using local data: $e');
        return await _localDb.getLocalTransactions();
      }
    } else {
      // Offline - use local data
      return await _localDb.getLocalTransactions();
    }
  }

  static Future<Transaction> createTransaction(Transaction transaction) async {
    if (kIsWeb) {
      return await ApiService.createTransaction(transaction);
    }
    // Always save locally first
    final localId = await _localDb.insertTransaction(transaction);
    final updatedTx = Transaction(
      id: localId,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: transaction.date,
      accountId: transaction.accountId,
      paymentMode: transaction.paymentMode,
      companyId: transaction.companyId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    );

    if (await isOnline()) {
      try {
        // Try to sync to server immediately
        final serverTransaction = await ApiService.createTransaction(updatedTx);
        await _localDb.markTransactionSynced(localId, serverTransaction.id);
        return serverTransaction;
      } catch (e) {
        print('Failed to sync immediately, will sync later: $e');
        return updatedTx;
      }
    } else {
      // Offline - will sync later
      print('Offline: Transaction saved locally, will sync when online');
      return updatedTx;
    }
  }

  static Future<Transaction> updateTransaction(
    int transactionId,
    Transaction transaction,
  ) async {
    if (kIsWeb) {
      return await ApiService.updateTransaction(transactionId, transaction);
    }
    // Always update locally first
    await _localDb.updateTransaction(transactionId, transaction);
    
    if (await isOnline()) {
      try {
        // Try to sync to server immediately
        final serverTransaction = await ApiService.updateTransaction(transactionId, transaction);
        await _localDb.markTransactionSynced(transactionId, serverTransaction.id);
        return serverTransaction;
      } catch (e) {
        print('Failed to sync update, will sync later: $e');
        return transaction;
      }
    } else {
      // Offline - will sync later
      print('Offline: Transaction updated locally, will sync when online');
      return transaction;
    }
  }

  static Future<void> deleteTransaction(int transactionId) async {
    if (kIsWeb) {
      return await ApiService.deleteTransaction(transactionId);
    }
    // Always delete locally first
    await _localDb.deleteTransaction(transactionId);
    
    if (await isOnline()) {
      try {
        // Try to sync to server immediately
        await ApiService.deleteTransaction(transactionId);
      } catch (e) {
        print('Failed to sync delete, will sync later: $e');
      }
    } else {
      // Offline - will sync later
      print('Offline: Transaction deleted locally, will sync when online');
    }
  }

  // EMPLOYEES - Works offline
  static Future<List<Employee>> getEmployees() async {
    if (kIsWeb) {
      return await ApiService.getEmployees();
    }
    if (await isOnline()) {
      try {
        final employees = await ApiService.getEmployees();
        await _localDb.saveServerData([], employees, []);
        return employees;
      } catch (e) {
        print('API call failed, using local data: $e');
        return await _localDb.getLocalEmployees();
      }
    } else {
      return await _localDb.getLocalEmployees();
    }
  }

  static Future<Employee> createEmployee(String name, double? salary) async {
    if (kIsWeb) {
      return await ApiService.createEmployee(name, salary);
    }
    // Save locally first
    final employee = Employee(
      id: 0,
      name: name,
      etype: 'Full-time',
      salary: salary,
      status: 'Active',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    
    final localId = await _localDb.insertEmployee(employee);
    
    if (await isOnline()) {
      try {
        final serverEmployee = await ApiService.createEmployee(name, salary);
        return serverEmployee;
      } catch (e) {
        print('Failed to sync employee: $e');
        return Employee(
          id: localId,
          name: name,
          etype: 'Full-time',
          salary: salary,
          status: 'Active',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }
    } else {
      return Employee(
        id: localId,
        name: name,
        etype: 'Full-time',
        salary: salary,
        status: 'Active',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
    }
  }

  // ACCOUNTS - Works offline
  static Future<List<Account>> getAccounts() async {
    if (kIsWeb) {
      try {
        print('🌐 Fetching accounts from web API...');
        final accounts = await ApiService.getAccounts();
        print('✅ Fetched ${accounts.length} accounts from web API');
        return accounts;
      } catch (e) {
        print('❌ Failed to fetch accounts from web: $e');
        rethrow;
      }
    }
    if (await isOnline()) {
      try {
        print('🌐 Device is online, fetching accounts from API...');
        final accounts = await ApiService.getAccounts();
        print('✅ Fetched ${accounts.length} accounts, saving to local DB');
        await _localDb.saveServerData([], [], accounts);
        return accounts;
      } catch (e) {
        print('❌ API call failed, using local data: $e');
        return await _localDb.getLocalAccounts();
      }
    } else {
      print('⚠️ Device is offline, using local accounts');
      return await _localDb.getLocalAccounts();
    }
  }

  // CATEGORIES - Works offline
  static Future<List<Category>> getCategories() async {
    if (kIsWeb) {
      try {
        final categories = await ApiService.getCategories();
        print('✅ Fetched ${categories.length} categories from server');
        return categories;
      } catch (e) {
        print('❌ Failed to fetch categories: $e');
        return _getDefaultCategories();
      }
    }
    if (await isOnline()) {
      try {
        final categories = await ApiService.getCategories();
        print('✅ Fetched ${categories.length} categories from server');
        return categories;
      } catch (e) {
        print('❌ Failed to fetch categories, using defaults: $e');
        return _getDefaultCategories();
      }
    } else {
      print('⚠️ Offline: Using default categories');
      return _getDefaultCategories();
    }
  }

  static Future<void> createCategory(Category category) async {
    if (kIsWeb) {
      await ApiService.createCategory(category);
      return;
    }
    if (await isOnline()) {
      try {
        await ApiService.createCategory(category);
        print('✅ Category created on server: ${category.name}');
      } catch (e) {
        print('❌ Failed to create category on server: $e');
      }
    } else {
      print('⚠️ Offline: Category saved locally: ${category.name}');
    }
  }

  // BILLS - Online only (not cached locally yet)
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
      if (await isOnline()) {
        return await ApiService.getBills(
          page: page,
          limit: limit,
          startDate: startDate,
          endDate: endDate,
          employeeId: employeeId,
          status: status,
          sortBy: sortBy,
          sortOrder: sortOrder,
        );
      } else {
        print('⚠️ Offline: Bills data not available offline');
        return {
          'bills': <Bill>[],
          'pagination': {
            'page': page,
            'limit': limit,
            'total': 0,
            'totalPages': 0,
          }
        };
      }
    } catch (e) {
      print('❌ Error fetching bills: $e');
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
    if (await isOnline()) {
      return await ApiService.createBill(
        invoiceNo: invoiceNo,
        billDate: billDate,
        dueDate: dueDate,
        amount: amount,
        employeeId: employeeId,
        accountId: accountId,
        billImagePath: billImagePath,
        notes: notes,
      );
    } else {
      throw Exception('Cannot create bills offline');
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
    if (await isOnline()) {
      return await ApiService.updateBill(
        billId,
        invoiceNo: invoiceNo,
        billDate: billDate,
        dueDate: dueDate,
        amount: amount,
        paidAmount: paidAmount,
        status: status,
        accountId: accountId,
        billImagePath: billImagePath,
        notes: notes,
      );
    } else {
      throw Exception('Cannot update bills offline');
    }
  }

  static Future<void> deleteBill(int billId) async {
    if (await isOnline()) {
      await ApiService.deleteBill(billId);
    } else {
      throw Exception('Cannot delete bills offline');
    }
  }

  static Future<Bill> recordBillPayment(
    int billId, {
    required double paymentAmount,
    required DateTime paymentDate,
  }) async {
    if (await isOnline()) {
      return await ApiService.recordBillPayment(
        billId,
        paymentAmount: paymentAmount,
        paymentDate: paymentDate,
      );
    } else {
      throw Exception('Cannot record bill payments offline');
    }
  }

  // PAYROLL - Online only (batch payroll processing requires server logic)
  static Future<Map<String, dynamic>> getPayrollPreview({
    required String fromDate,
    required String toDate,
  }) async {
    if (await isOnline()) {
      try {
        return await ApiService.getPayrollPreview(
          fromDate: fromDate,
          toDate: toDate,
        );
      } catch (e) {
        print('❌ Error fetching payroll preview: $e');
        // Return empty data when offline/error
        return {
          'preview': <Map<String, dynamic>>[],
          'paid': <int>[],
        };
      }
    } else {
      print('⚠️ Offline: Payroll data not available offline');
      return {
        'preview': <Map<String, dynamic>>[],
        'paid': <int>[],
      };
    }
  }

  static Future<void> createPayrollRecord({
    required int employeeId,
    required int accountId,
    required DateTime fromDate,
    required DateTime toDate,
    required double amount,
    String? remarks,
  }) async {
    if (await isOnline()) {
      return await ApiService.createPayrollRecord(
        employeeId: employeeId,
        accountId: accountId,
        fromDate: fromDate,
        toDate: toDate,
        amount: amount,
        remarks: remarks,
      );
    } else {
      throw Exception('Cannot create payroll offline - payroll requires server-side validation');
    }
  }

  // Default categories for offline use
  static List<Category> _getDefaultCategories() {
    return [
      Category(id: 1, name: 'Salary', description: 'Employee salaries', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 2, name: 'Office Supplies', description: 'Office related items', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 3, name: 'Utilities', description: 'Electricity, water, etc', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 4, name: 'Transportation', description: 'Travel and transport', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 5, name: 'Food & Meals', description: 'Food and meal expenses', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 6, name: 'Entertainment', description: 'Entertainment expenses', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 7, name: 'Medical', description: 'Medical expenses', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 8, name: 'Other Income', description: 'Miscellaneous income', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
      Category(id: 9, name: 'Other Expenses', description: 'Other expenses', companyId: 1, createdAt: DateTime.now(), updatedAt: DateTime.now()),
    ];
  }
}

