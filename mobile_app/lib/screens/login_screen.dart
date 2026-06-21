import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final TextEditingController userIdController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final FocusNode userIdFocus = FocusNode();
  final FocusNode passwordFocus = FocusNode();
  
  bool isLoading = false;
  String errorMessage = '';
  bool isPasswordVisible = false;
  bool userIdFocused = false;
  bool passwordFocused = false;
  late AnimationController _fadeController;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeController.forward();
    
    userIdFocus.addListener(() {
      setState(() => userIdFocused = userIdFocus.hasFocus);
    });
    passwordFocus.addListener(() {
      setState(() => passwordFocused = passwordFocus.hasFocus);
    });
  }

  @override
  void dispose() {
    userIdController.dispose();
    passwordController.dispose();
    userIdFocus.dispose();
    passwordFocus.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> handleLogin() async {
    if (userIdController.text.isEmpty || passwordController.text.isEmpty) {
      setState(() => errorMessage = 'Please enter both email and password');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userIdController.text,
          'password': passwordController.text,
        }),
      );

      print('🔐 Login response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseBody = json.decode(response.body);
        print('🔐 Login response body: $responseBody');
        final String? token = responseBody['token'];
        print('🔑 Extracted token: $token');
        
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('auth_token', token);
          print('✅ Token saved to SharedPreferences');
          
          ApiService.setToken(token);
          print('✅ Token set in ApiService');
        } else {
          print('❌ No token in login response!');
        }
        
        if (!mounted) return;
        Navigator.of(context).pushReplacementNamed('/');
      } else {
        final error = json.decode(response.body);
        setState(() {
          errorMessage = error['error'] ?? 'Login failed';
          isLoading = false;
        });
        print('❌ Login failed: $errorMessage');
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Connection error: ${e.toString()}';
        isLoading = false;
      });
      print('❌ Exception: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    final screenHeight = MediaQuery.of(context).size.height;
    
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
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
        child: Stack(
          children: [
            FadeTransition(
              opacity: _fadeController,
              child: SafeArea(
                child: SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: screenHeight -
                          MediaQuery.of(context).padding.top -
                          MediaQuery.of(context).padding.bottom,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(height: isMobile ? 20 : 40),
                        
                        // Main Form Container
                        Center(
                          child: Container(
                            width: isMobile
                                ? MediaQuery.of(context).size.width * 0.88
                                : 420,
                            constraints: const BoxConstraints(maxWidth: 420),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.95),
                              borderRadius: BorderRadius.circular(30),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 30,
                                  spreadRadius: 0,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                              border: Border.all(
                                color: Colors.white.withOpacity(0.5),
                                width: 1.5,
                              ),
                            ),
                            child: SingleChildScrollView(
                              child: Padding(
                                padding: EdgeInsets.all(isMobile ? 28 : 36),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Logo with BrickBook image - Shrunk to fit mobile
                                    Container(
                                      width: 300,
                                      height: 80,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(18),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.15),
                                            blurRadius: 12,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(18),
                                        child: Image.asset(
                                          'assets/brickbook-logo.png',
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 80),
                                    
                                    // Email Input
                                    AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      decoration: BoxDecoration(
                                        color: userIdFocused
                                            ? Colors.blue[50]
                                            : Colors.grey[50],
                                        borderRadius: BorderRadius.circular(25),
                                        border: Border.all(
                                          color: userIdFocused
                                              ? Colors.blue[400]!
                                              : Colors.grey[200]!,
                                          width: userIdFocused ? 2 : 1,
                                        ),
                                      ),
                                      child: Padding(
                                        padding:
                                            const EdgeInsets.symmetric(horizontal: 4),
                                        child: TextField(
                                          controller: userIdController,
                                          focusNode: userIdFocus,
                                          keyboardType: TextInputType.emailAddress,
                                          textInputAction: TextInputAction.next,
                                          onSubmitted: (_) =>
                                              passwordFocus.requestFocus(),
                                          decoration: InputDecoration(
                                            hintText: 'Enter email',
                                            hintStyle: TextStyle(
                                              color: Colors.grey[400],
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            prefixIcon: Icon(
                                              Icons.mail_outline,
                                              color: userIdFocused
                                                  ? Colors.blue[500]
                                                  : Colors.grey[400],
                                              size: 20,
                                            ),
                                            border: InputBorder.none,
                                            contentPadding:
                                                const EdgeInsets.symmetric(
                                              horizontal: 12,
                                              vertical: 14,
                                            ),
                                          ),
                                          style: const TextStyle(
                                            color: Colors.black87,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 16),
                                    
                                    // Password Input
                                    AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      decoration: BoxDecoration(
                                        color: passwordFocused
                                            ? Colors.blue[50]
                                            : Colors.grey[50],
                                        borderRadius: BorderRadius.circular(25),
                                        border: Border.all(
                                          color: passwordFocused
                                              ? Colors.blue[400]!
                                              : Colors.grey[200]!,
                                          width: passwordFocused ? 2 : 1,
                                        ),
                                      ),
                                      child: Padding(
                                        padding:
                                            const EdgeInsets.symmetric(horizontal: 4),
                                        child: TextField(
                                          controller: passwordController,
                                          focusNode: passwordFocus,
                                          obscureText: !isPasswordVisible,
                                          textInputAction: TextInputAction.done,
                                          onSubmitted: (_) => handleLogin(),
                                          decoration: InputDecoration(
                                            hintText: 'Enter password',
                                            hintStyle: TextStyle(
                                              color: Colors.grey[400],
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            prefixIcon: Icon(
                                              Icons.lock_outline,
                                              color: passwordFocused
                                                  ? Colors.blue[500]
                                                  : Colors.grey[400],
                                              size: 20,
                                            ),
                                            suffixIcon: GestureDetector(
                                              onTap: () {
                                                setState(() {
                                                  isPasswordVisible =
                                                      !isPasswordVisible;
                                                });
                                              },
                                              child: Icon(
                                                isPasswordVisible
                                                    ? Icons.visibility
                                                    : Icons.visibility_off,
                                                color: Colors.grey[400],
                                                size: 20,
                                              ),
                                            ),
                                            border: InputBorder.none,
                                            contentPadding:
                                                const EdgeInsets.symmetric(
                                              horizontal: 12,
                                              vertical: 14,
                                            ),
                                          ),
                                          style: const TextStyle(
                                            color: Colors.black87,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 18),
                                    
                                    // Error Message
                                    if (errorMessage.isNotEmpty)
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: Colors.red[50],
                                          border: Border.all(
                                            color: Colors.red[200]!,
                                            width: 1,
                                          ),
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              Icons.error_outline,
                                              color: Colors.red[600],
                                              size: 18,
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Text(
                                                errorMessage,
                                                style: TextStyle(
                                                  color: Colors.red[600],
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    
                                    if (errorMessage.isNotEmpty)
                                      const SizedBox(height: 18),
                                    
                                    // Login Button
                                    Container(
                                      width: double.infinity,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: isLoading
                                              ? [
                                                  Colors.red[600]!
                                                      .withOpacity(0.7),
                                                  Colors.red[500]!
                                                      .withOpacity(0.7)
                                                ]
                                              : [
                                                  Colors.red[600]!,
                                                  Colors.red[500]!
                                                ],
                                        ),
                                        borderRadius: BorderRadius.circular(25),
                                        boxShadow: [
                                          if (!isLoading)
                                            BoxShadow(
                                              color: Colors.red.withOpacity(0.3),
                                              blurRadius: 12,
                                              spreadRadius: 0,
                                              offset: const Offset(0, 4),
                                            ),
                                        ],
                                      ),
                                      child: Material(
                                        color: Colors.transparent,
                                        child: InkWell(
                                          onTap: isLoading ? null : handleLogin,
                                          borderRadius:
                                              BorderRadius.circular(25),
                                          child: Center(
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                if (isLoading) ...[
                                                  SizedBox(
                                                    width: 18,
                                                    height: 18,
                                                    child:
                                                        CircularProgressIndicator(
                                                      strokeWidth: 2.5,
                                                      valueColor:
                                                          AlwaysStoppedAnimation<
                                                              Color>(
                                                        Colors.white
                                                            .withOpacity(0.9),
                                                      ),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                ],
                                                Text(
                                                  isLoading
                                                      ? 'Logging in...'
                                                      : 'Log In',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.bold,
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 12),
                                    
                                    // Footer
                                    Text(
                                      'Secure login powered by BrickBook',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey[500],
                                        fontWeight: FontWeight.w400,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        
                        SizedBox(height: isMobile ? 20 : 40),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
