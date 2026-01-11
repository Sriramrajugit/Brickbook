import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'local_database.dart';
import 'api_service.dart';
import '../models/transaction.dart';
import '../models/employee.dart';
import '../models/account.dart';

class SyncManager {
  static final SyncManager _instance = SyncManager._internal();
  factory SyncManager() => _instance;
  SyncManager._internal();

  final LocalDatabase _localDb = LocalDatabase();
  bool _isSyncing = false;
  Timer? _syncTimer;

  // Start periodic sync check
  void startAutoSync() {
    // Check connectivity and sync every 30 seconds
    _syncTimer = Timer.periodic(Duration(seconds: 30), (timer) {
      syncIfOnline();
    });

    // Also sync on connectivity change
    Connectivity().onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        syncIfOnline();
      }
    });
  }

  void stopAutoSync() {
    _syncTimer?.cancel();
  }

  // Check if online and trigger sync
  Future<void> syncIfOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult != ConnectivityResult.none) {
      await syncWithServer();
    }
  }

  // Main sync function
  Future<bool> syncWithServer() async {
    if (_isSyncing) return false;

    _isSyncing = true;
    try {
      print('Starting sync...');

      // Step 1: Upload unsynced local data to server
      await _uploadUnsyncedData();

      // Step 2: Download fresh data from server
      await _downloadServerData();

      print('Sync completed successfully');
      return true;
    } catch (e) {
      print('Sync failed: $e');
      return false;
    } finally {
      _isSyncing = false;
    }
  }

  // Upload unsynced transactions to server
  Future<void> _uploadUnsyncedData() async {
    try {
      final unsyncedTransactions = await _localDb.getUnsyncedTransactions();

      for (var txMap in unsyncedTransactions) {
        try {
          final transaction = Transaction(
            id: txMap['id'],
            amount: txMap['amount'],
            description: txMap['description'],
            category: txMap['category'],
            type: txMap['type'],
            date: DateTime.parse(txMap['date']),
            accountId: txMap['accountId'],
            paymentMode: txMap['paymentMode'],
            companyId: txMap['companyId'] ?? 1,
            createdAt: DateTime.parse(txMap['createdAt'] ?? DateTime.now().toIso8601String()),
            updatedAt: DateTime.now(),
          );

          // Upload to server
          final serverTransaction = await ApiService.createTransaction(transaction);

          // Mark as synced in local DB
          await _localDb.markTransactionSynced(
            txMap['id'],
            serverTransaction.id!,
          );

          print('Synced transaction ${txMap['id']} -> Server ID ${serverTransaction.id}');
        } catch (e) {
          print('Failed to sync transaction ${txMap['id']}: $e');
          // Continue with next transaction
        }
      }
    } catch (e) {
      print('Upload failed: $e');
    }
  }

  // Download fresh data from server
  Future<void> _downloadServerData() async {
    try {
      // Fetch data from server
      final transactions = await ApiService.getTransactions();
      final employees = await ApiService.getEmployees();
      final accounts = await ApiService.getAccounts();

      // Save to local database
      await _localDb.saveServerData(transactions, employees, accounts);

      print('Downloaded ${transactions.length} transactions, '
          '${employees.length} employees, ${accounts.length} accounts');
    } catch (e) {
      print('Download failed: $e');
    }
  }

  // Force full sync
  Future<void> forceSync() async {
    await syncWithServer();
  }

  // Check if there are unsynced changes
  Future<bool> hasUnsyncedChanges() async {
    final unsynced = await _localDb.getUnsyncedTransactions();
    return unsynced.isNotEmpty;
  }
}
