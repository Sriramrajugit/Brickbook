import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController userIdController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  
  bool isLoading = false;
  String errorMessage = '';
  bool isPasswordVisible = false;

  @override
  void initState() {
    super.initState();
    // No need to load companies - company is determined from user's profile
  }

  Future<void> handleLogin() async {
    if (userIdController.text.isEmpty || passwordController.text.isEmpty) {
      setState(() => errorMessage = 'Please enter both User ID and password');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    try {
      // Call login API endpoint - matches web login flow
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userIdController.text,
          'password': passwordController.text,
        }),
      );

      if (response.statusCode == 200) {
        // Login successful - company auto-selected from user's profile
        if (!mounted) return;
        Navigator.of(context).pushReplacementNamed('/');
      } else {
        final error = json.decode(response.body);
        setState(() {
          errorMessage = error['error'] ?? 'Login failed';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Connection error: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.blue[400]!.withOpacity(0.3),
              Colors.blue[300]!.withOpacity(0.2),
              Colors.cyan[300]!.withOpacity(0.3),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: SizedBox(
              height: MediaQuery.of(context).size.height - MediaQuery.of(context).padding.top - MediaQuery.of(context).padding.bottom,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Circular Form Container
                  Center(
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.85,
                      constraints: const BoxConstraints(maxWidth: 350),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.95),
                        borderRadius: BorderRadius.circular(200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 20,
                            spreadRadius: 5,
                          ),
                        ],
                        border: Border.all(
                          color: Colors.white.withOpacity(0.4),
                          width: 1,
                        ),
                      ),
                      child: SingleChildScrollView(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Logo
                              Icon(
                                Icons.receipt_long,
                                size: 48,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              const SizedBox(height: 16),
                              
                              // Title
                              const Text(
                                'BrickBook',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              
                              const SizedBox(height: 8),
                              
                              // Subtitle
                              Text(
                                'Welcome Back',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                              
                              const SizedBox(height: 28),
                              
                              // User ID Input - Rounded pill shape with icon
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.grey[50],
                                  borderRadius: BorderRadius.circular(25),
                                  border: Border.all(
                                    color: Colors.transparent,
                                  ),
                                ),
                                child: TextField(
                                  controller: userIdController,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  decoration: InputDecoration(
                                    hintText: 'Enter email',
                                    hintStyle: TextStyle(
                                      color: Colors.grey[400],
                                      fontSize: 13,
                                    ),
                                    prefixIcon: Icon(
                                      Icons.mail_outline,
                                      color: Colors.grey[400],
                                      size: 20,
                                    ),
                                    border: InputBorder.none,
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                  ),
                                  style: const TextStyle(
                                    color: Colors.black87,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              
                              const SizedBox(height: 16),
                              
                              // Password Input - Rounded pill shape with icon
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.grey[50],
                                  borderRadius: BorderRadius.circular(25),
                                  border: Border.all(
                                    color: Colors.transparent,
                                  ),
                                ),
                                child: TextField(
                                  controller: passwordController,
                                  obscureText: !isPasswordVisible,
                                  textInputAction: TextInputAction.done,
                                  onSubmitted: (_) => handleLogin(),
                                  decoration: InputDecoration(
                                    hintText: 'Enter password',
                                    hintStyle: TextStyle(
                                      color: Colors.grey[400],
                                      fontSize: 13,
                                    ),
                                    prefixIcon: Icon(
                                      Icons.lock_outline,
                                      color: Colors.grey[400],
                                      size: 20,
                                    ),
                                    suffixIcon: GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          isPasswordVisible = !isPasswordVisible;
                                        });
                                      },
                                      child: Icon(
                                        isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                                        color: Colors.grey[400],
                                        size: 20,
                                      ),
                                    ),
                                    border: InputBorder.none,
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                  ),
                                  style: const TextStyle(
                                    color: Colors.black87,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              
                              const SizedBox(height: 16),
                              
                              // Error Message
                              if (errorMessage.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.red[50],
                                    border: Border.all(color: Colors.red[200]!),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    errorMessage,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: Colors.red[600],
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              
                              const SizedBox(height: 16),
                              
                              // Login Button - Gradient red with rounded corners
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Colors.red[600]!,
                                      Colors.red[500]!,
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(25),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.red.withOpacity(0.3),
                                      blurRadius: 8,
                                      spreadRadius: 0,
                                    ),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: isLoading ? null : handleLogin,
                                    borderRadius: BorderRadius.circular(25),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 24,
                                        vertical: 12,
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (isLoading) ...[
                                            const SizedBox(
                                              height: 16,
                                              width: 16,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor: AlwaysStoppedAnimation<Color>(
                                                  Colors.white,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                          ],
                                          Text(
                                            isLoading ? 'Logging in...' : 'Log In',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
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
