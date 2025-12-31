import 'package:flutter/material.dart';

class DrawerMenu extends StatelessWidget {
  final String currentRoute;

  const DrawerMenu({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Colors.blue,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Ledger App',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Expense Tracker',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          _buildMenuItem(
            context,
            icon: Icons.dashboard,
            title: 'Dashboard',
            route: '/',
          ),
          _buildMenuItem(
            context,
            icon: Icons.account_balance,
            title: 'Accounts',
            route: '/accounts',
          ),
          _buildMenuItem(
            context,
            icon: Icons.people,
            title: 'Employees',
            route: '/employees',
          ),
          _buildMenuItem(
            context,
            icon: Icons.receipt,
            title: 'Transactions',
            route: '/transactions',
          ),
          _buildMenuItem(
            context,
            icon: Icons.calendar_today,
            title: 'Attendance',
            route: '/attendance',
          ),
          _buildMenuItem(
            context,
            icon: Icons.payment,
            title: 'Payroll',
            route: '/payroll',
          ),
          _buildMenuItem(
            context,
            icon: Icons.bar_chart,
            title: 'Reports',
            route: '/reports',
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String route,
  }) {
    final bool isSelected = currentRoute == route;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? Colors.blue : Colors.grey[700],
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? Colors.blue : Colors.grey[700],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      tileColor: isSelected ? Colors.blue.withOpacity(0.1) : null,
      onTap: () {
        Navigator.pop(context); // Close drawer
        if (!isSelected) {
          Navigator.pushReplacementNamed(context, route);
        }
      },
    );
  }
}
