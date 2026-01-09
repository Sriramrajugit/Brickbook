import 'package:flutter/material.dart';

class DrawerMenu extends StatelessWidget {
  final String currentRoute;
  final String? currentPage; // Alternative parameter name for flexibility

  const DrawerMenu({
    super.key,
    required this.currentRoute,
    this.currentPage,
  });

  @override
  Widget build(BuildContext context) {
    final activeRoute = currentPage ?? currentRoute;
    
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Ledger',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Financial Management',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
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
            isSelected: activeRoute == '/',
          ),
          _buildMenuItem(
            context,
            icon: Icons.account_balance,
            title: 'Accounts',
            route: '/accounts',
            isSelected: activeRoute == '/accounts',
          ),
          _buildMenuItem(
            context,
            icon: Icons.people,
            title: 'Employees',
            route: '/employees',
            isSelected: activeRoute == '/employees',
          ),
          _buildMenuItem(
            context,
            icon: Icons.receipt,
            title: 'Transactions',
            route: '/transactions',
            isSelected: activeRoute == '/transactions',
          ),
          _buildMenuItem(
            context,
            icon: Icons.calendar_today,
            title: 'Attendance',
            route: '/attendance',
            isSelected: activeRoute == '/attendance',
          ),
          _buildMenuItem(
            context,
            icon: Icons.payment,
            title: 'Payroll',
            route: '/payroll',
            isSelected: activeRoute == '/payroll',
          ),
          _buildMenuItem(
            context,
            icon: Icons.bar_chart,
            title: 'Reports',
            route: '/reports',
            isSelected: activeRoute == '/reports',
          ),
          const Divider(height: 24),
          _buildMenuItem(
            context,
            icon: Icons.logout,
            title: 'Logout',
            route: '/login',
            isSelected: false,
            isLogout: true,
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
    required bool isSelected,
    bool isLogout = false,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected
            ? Theme.of(context).colorScheme.primary
            : Colors.grey[600],
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected
              ? Theme.of(context).colorScheme.primary
              : Colors.grey[800],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        ),
      ),
      tileColor: isSelected
          ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
          : null,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      onTap: () {
        Navigator.pop(context); // Close drawer
        if (!isSelected) {
          if (isLogout) {
            // Handle logout
            Navigator.pushNamedAndRemoveUntil(context, route, (route) => false);
          } else {
            Navigator.pushReplacementNamed(context, route);
          }
        }
      },
    );
  }
}
