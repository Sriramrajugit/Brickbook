import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import 'local_database.dart';
import '../models/transaction.dart';
import '../models/employee.dart';
import '../models/account.dart';

class OfflineApiService {
  static final LocalDatabase _localDb = LocalDatabase();

  // Check if device is online
  static Future<bool> isOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  // TRANSACTIONS - Works offline
  static Future<List<Transaction>> getTransactions() async {
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

  // EMPLOYEES - Works offline
  static Future<List<Employee>> getEmployees() async {
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
    if (await isOnline()) {
      try {
        final accounts = await ApiService.getAccounts();
        await _localDb.saveServerData([], [], accounts);
        return accounts;
      } catch (e) {
        print('API call failed, using local data: $e');
        return await _localDb.getLocalAccounts();
      }
    } else {
      return await _localDb.getLocalAccounts();
    }
  }
}
