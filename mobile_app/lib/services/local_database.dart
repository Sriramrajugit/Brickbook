import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/transaction.dart';
import '../models/employee.dart';
import '../models/account.dart';

class LocalDatabase {
  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await initDatabase();
    return _database!;
  }

  Future<Database> initDatabase() async {
    String path = join(await getDatabasesPath(), 'ledger_local.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: (Database db, int version) async {
        // Create transactions table
        await db.execute('''
          CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serverId INTEGER,
            amount REAL NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            accountId INTEGER NOT NULL,
            paymentMode TEXT,
            synced INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL
          )
        ''');

        // Create employees table
        await db.execute('''
          CREATE TABLE employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serverId INTEGER,
            name TEXT NOT NULL,
            etype TEXT,
            salary REAL,
            status TEXT NOT NULL,
            synced INTEGER DEFAULT 0
          )
        ''');

        // Create accounts table
        await db.execute('''
          CREATE TABLE accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serverId INTEGER,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            budget REAL NOT NULL,
            synced INTEGER DEFAULT 0
          )
        ''');

        // Create sync_queue table for pending operations
        await db.execute('''
          CREATE TABLE sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entityType TEXT NOT NULL,
            entityId INTEGER NOT NULL,
            operation TEXT NOT NULL,
            data TEXT NOT NULL,
            createdAt TEXT NOT NULL
          )
        ''');
      },
    );
  }

  // TRANSACTIONS
  Future<List<Transaction>> getLocalTransactions() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'transactions',
      orderBy: 'date DESC',
    );
    return List.generate(maps.length, (i) {
      return Transaction(
        id: maps[i]['serverId'] ?? maps[i]['id'],
        amount: maps[i]['amount'],
        description: maps[i]['description'],
        category: maps[i]['category'],
        type: maps[i]['type'],
        date: maps[i]['date'],
        accountId: maps[i]['accountId'],
        paymentMode: maps[i]['paymentMode'],
      );
    });
  }

  Future<int> insertTransaction(Transaction transaction) async {
    final db = await database;
    return await db.insert('transactions', {
      'amount': transaction.amount,
      'description': transaction.description,
      'category': transaction.category,
      'type': transaction.type,
      'date': transaction.date,
      'accountId': transaction.accountId,
      'paymentMode': transaction.paymentMode,
      'synced': 0,
      'createdAt': DateTime.now().toIso8601String(),
    });
  }

  Future<void> markTransactionSynced(int localId, int serverId) async {
    final db = await database;
    await db.update(
      'transactions',
      {'synced': 1, 'serverId': serverId},
      where: 'id = ?',
      whereArgs: [localId],
    );
  }

  Future<List<Map<String, dynamic>>> getUnsyncedTransactions() async {
    final db = await database;
    return await db.query(
      'transactions',
      where: 'synced = ?',
      whereArgs: [0],
    );
  }

  // EMPLOYEES
  Future<List<Employee>> getLocalEmployees() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('employees');
    return List.generate(maps.length, (i) {
      return Employee(
        id: maps[i]['serverId'] ?? maps[i]['id'],
        name: maps[i]['name'],
        etype: maps[i]['etype'],
        salary: maps[i]['salary'],
        status: maps[i]['status'],
      );
    });
  }

  Future<int> insertEmployee(Employee employee) async {
    final db = await database;
    return await db.insert('employees', {
      'name': employee.name,
      'etype': employee.etype,
      'salary': employee.salary,
      'status': employee.status,
      'synced': 0,
    });
  }

  // ACCOUNTS
  Future<List<Account>> getLocalAccounts() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('accounts');
    return List.generate(maps.length, (i) {
      return Account(
        id: maps[i]['serverId'] ?? maps[i]['id'],
        name: maps[i]['name'],
        type: maps[i]['type'],
        budget: maps[i]['budget'],
      );
    });
  }

  Future<int> insertAccount(Account account) async {
    final db = await database;
    return await db.insert('accounts', {
      'name': account.name,
      'type': account.type,
      'budget': account.budget,
      'synced': 0,
    });
  }

  // SYNC OPERATIONS
  Future<void> clearAllData() async {
    final db = await database;
    await db.delete('transactions');
    await db.delete('employees');
    await db.delete('accounts');
  }

  Future<void> saveServerData(List<Transaction> transactions, 
      List<Employee> employees, List<Account> accounts) async {
    final db = await database;
    
    // Clear and insert fresh data from server
    await db.delete('transactions', where: 'synced = ?', whereArgs: [1]);
    await db.delete('employees', where: 'synced = ?', whereArgs: [1]);
    await db.delete('accounts', where: 'synced = ?', whereArgs: [1]);

    for (var transaction in transactions) {
      await db.insert('transactions', {
        'serverId': transaction.id,
        'amount': transaction.amount,
        'description': transaction.description,
        'category': transaction.category,
        'type': transaction.type,
        'date': transaction.date,
        'accountId': transaction.accountId,
        'paymentMode': transaction.paymentMode,
        'synced': 1,
        'createdAt': DateTime.now().toIso8601String(),
      });
    }

    for (var employee in employees) {
      await db.insert('employees', {
        'serverId': employee.id,
        'name': employee.name,
        'etype': employee.etype,
        'salary': employee.salary,
        'status': employee.status,
        'synced': 1,
      });
    }

    for (var account in accounts) {
      await db.insert('accounts', {
        'serverId': account.id,
        'name': account.name,
        'type': account.type,
        'budget': account.budget,
        'synced': 1,
      });
    }
  }
}
