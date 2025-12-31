import 'package:flutter/material.dart';
import '../widgets/drawer_menu.dart';

class PayrollScreen extends StatefulWidget {
  const PayrollScreen({super.key});

  @override
  State<PayrollScreen> createState() => _PayrollScreenState();
}

class _PayrollScreenState extends State<PayrollScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payroll'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      drawer: const DrawerMenu(currentRoute: '/payroll'),
      body: const Center(
        child: Text('Payroll Screen - Coming Soon'),
      ),
    );
  }
}
