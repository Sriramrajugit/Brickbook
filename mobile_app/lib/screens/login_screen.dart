import 'package:flutter/material.dart';
import '../models/company.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController userIdController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  
  List<Company> companies = [];
  Company? selectedCompany;
  bool isLoading = false;
  bool isLoadingCompanies = true;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    loadCompanies();
  }

  Future<void> loadCompanies() async {
    try {
      setState(() => isLoadingCompanies = true);
      final companiesList = await ApiService.getCompanies();
      setState(() {
        companies = companiesList;
        if (companiesList.isNotEmpty) {
          selectedCompany = companiesList.first;
        }
        isLoadingCompanies = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load companies: ${e.toString()}';
        isLoadingCompanies = false;
      });
    }
  }

  Future<void> handleLogin() async {
    if (userIdController.text.isEmpty || passwordController.text.isEmpty) {
      setState(() => errorMessage = 'Please enter both User ID and password');
      return;
    }

    if (selectedCompany == null) {
      setState(() => errorMessage = 'Please select a company');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    try {
      // Call login API endpoint
      // This is a placeholder - implement based on your backend
      // For now, we'll store the company selection and navigate
      
      // TODO: Implement actual login API call
      // For testing, we'll just navigate to dashboard
      
      if (!mounted) return;
      
      Navigator.of(context).pushReplacementNamed('/');
    } catch (e) {
      setState(() {
        errorMessage = 'Login failed: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                
                // Logo and Title
                Icon(
                  Icons.receipt_long,
                  size: 64,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 24),
                
                const Text(
                  'BrickBook',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  'Welcome Back',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                  ),
                ),
                
                const SizedBox(height: 40),
                
                // Company Selection
                if (!isLoadingCompanies) ...[
                  Text(
                    'Select Company',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<Company>(
                    value: selectedCompany,
                    items: companies.map((company) {
                      return DropdownMenuItem(
                        value: company,
                        child: Text(company.name),
                      );
                    }).toList(),
                    onChanged: (Company? newValue) {
                      setState(() => selectedCompany = newValue);
                    },
                    decoration: InputDecoration(
                      hintText: 'Choose your company',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor: Colors.grey[50],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                
                // User ID
                Text(
                  'User ID or Email',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: userIdController,
                  decoration: InputDecoration(
                    hintText: 'Enter your user ID or email',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Password
                Text(
                  'Password',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Enter your password',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Error Message
                if (errorMessage.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      border: Border.all(color: Colors.red[200]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      errorMessage,
                      style: TextStyle(color: Colors.red[700]),
                    ),
                  ),
                
                const SizedBox(height: 24),
                
                // Login Button
                ElevatedButton(
                  onPressed: isLoading ? null : handleLogin,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Theme.of(context).colorScheme.primary,
                  ),
                  child: isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text(
                          'Login',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    userIdController.dispose();
    passwordController.dispose();
    super.dispose();
  }
}
