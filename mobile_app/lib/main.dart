import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';
import 'screens/accounts_screen.dart';
import 'screens/employees_screen.dart';
import 'screens/transactions_screen.dart';
import 'screens/attendance_screen.dart';
import 'screens/payroll_screen.dart';
import 'screens/reports_screen.dart';
import 'services/sync_manager.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Start automatic background sync
  SyncManager().startAutoSync();
  
  runApp(const LedgerApp());
}

class LedgerApp extends StatelessWidget {
  const LedgerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ledger App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const DashboardScreen(),
        '/accounts': (context) => const AccountsScreen(),
        '/employees': (context) => const EmployeesScreen(),
        '/transactions': (context) => const TransactionsScreen(),
        '/attendance': (context) => const AttendanceScreen(),
        '/payroll': (context) => const PayrollScreen(),
        '/reports': (context) => const ReportsScreen(),
      },
    );
  }
}
