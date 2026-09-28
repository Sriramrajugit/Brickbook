import 'package:flutter/material.dart';
import '../models/company.dart';

class DrawerMenu extends StatelessWidget {
  final String? currentRoute;
  final String? currentPage; // Alternative parameter name for flexibility
  final Company? company;

  const DrawerMenu({
    super.key,
    this.currentRoute = '/',
    this.currentPage,
    this.company,
  });

  @override
  Widget build(BuildContext context) {
    final activeRoute = currentPage ?? currentRoute ?? '/';
    
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
                  'BrickBook',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Financial Management App',
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
          _buildMenuItem(
            context,
            icon: Icons.category,
            title: 'Categories',
            route: '/categories',
            isSelected: activeRoute == '/categories',
          ),
          // Bills & Invoices - Only show for STRUCTURE+ packages
          if (_hasModuleAccess('Bills & Invoices'))
            _buildMenuItem(
              context,
              icon: Icons.receipt_long,
              title: 'Bills & Invoices',
              route: '/bills',
              isSelected: activeRoute == '/bills',
            ),
          const Divider(height: 24),
          _buildMenuItem(
            context,
            icon: Icons.person,
            title: 'My Profile',
            route: '/profile',
            isSelected: activeRoute == '/profile',
          ),
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

  bool _hasModuleAccess(String moduleName) {
    if (company == null) return true; // Show by default if no package info
    
    final package = company!.package;
    final foundationModules = ['Dashboard', 'Accounts', 'Transactions', 'Attendance', 'Payroll', 'Reports', 'Categories', 'Employees', 'My Profile'];
    final structureModules = [...foundationModules, 'Bills & Invoices', 'Import Data'];
    final landmarkModules = [...structureModules, 'BOQ', 'Future Modules'];
    
    if (package == 'LANDMARK') return landmarkModules.contains(moduleName);
    if (package == 'STRUCTURE') return structureModules.contains(moduleName);
    return foundationModules.contains(moduleName); // Default to FOUNDATION
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
