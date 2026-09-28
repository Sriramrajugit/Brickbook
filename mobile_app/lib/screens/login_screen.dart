import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'package:local_auth/local_auth.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
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
  final LocalAuthentication _localAuth = LocalAuthentication();

  bool _canUseBiometric = false;
  bool _isBiometricLoading = false;
  bool _biometricEnabled = false;
  String currentVersion = "";

  @override
  void initState() {
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback(
          (_) => afterFirstFrameRender(context),
    );
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
    _checkBiometricAndAutoLogin();
  }

  @override
  void dispose() {
    userIdController.dispose();
    passwordController.dispose();
    userIdFocus.dispose();
    passwordFocus.dispose();
    _fadeController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  //region Initial Setup
  Future<void> afterFirstFrameRender(BuildContext context) async {
    final packageInfo = await getAppVersion();

    setState(() {
      currentVersion =
      "${packageInfo['version']}(${packageInfo['buildNumber']})";
    });
  }

  //endregion

  Future<Map<String, String>> getAppVersion() async {
    final packageInfo = await PackageInfo.fromPlatform();
    String version = packageInfo.version;

    const flavor = String.fromEnvironment('SERVER');

    if (Platform.isIOS) {
      if (flavor == 'dev') {
        version = '$version-dev';
      } else if (flavor == 'prod') {
        version = '$version-prod';
      }
    }
    return {
      "version": version,
      "buildNumber": packageInfo.buildNumber,
    };
  }

  Future<void> _checkBiometricAndAutoLogin() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final token = prefs.getString('auth_token');

      final biometricEnabled =
          prefs.getBool('biometric_enabled') ?? false;

      final isSupported = await _localAuth.isDeviceSupported();
      final canCheck = await _localAuth.canCheckBiometrics;

      if (!mounted) return;

      setState(() {
        _canUseBiometric = isSupported && canCheck;
        _biometricEnabled = biometricEnabled;
      });

      // No previous login
      if (token == null || token.isEmpty) {
        return;
      }

      // User has not enabled biometric
      if (!biometricEnabled) {
        return;
      }

      // Device doesn't support biometric
      if (!isSupported || !canCheck) {
        return;
      }

      // Automatically show biometric when app opens
      await _authenticateWithBiometric();

    } catch (e) {
      debugPrint('Biometric startup error: $e');
    }
  }

  // Future<void> _checkBiometricAvailability() async {
  //   try {
  //     final bool isSupported = await _localAuth.isDeviceSupported();
  //     final bool canCheck = await _localAuth.canCheckBiometrics;
  //
  //     if (!mounted) return;
  //
  //     setState(() {
  //       _canUseBiometric = isSupported && canCheck;
  //     });
  //   } catch (e) {
  //     debugPrint('Biometric availability error: $e');
  //   }
  // }

  Future<void> _authenticateWithBiometric() async {
    if (_isBiometricLoading) return;

    setState(() {
      _isBiometricLoading = true;
      errorMessage = '';
    });

    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to log in to BrickBook',
      );

      if (!mounted) return;

      if (authenticated) {
        final prefs = await SharedPreferences.getInstance();

        final token = prefs.getString('auth_token');

        if (!mounted) return;

        if (token != null && token.isNotEmpty) {
          ApiService.setToken(token);

          Navigator.of(context).pushReplacementNamed('/');
        } else {
          setState(() {
            errorMessage =
            'Please log in with your email and password first.';
          });
        }
      }
    } on PlatformException catch (e) {
      debugPrint('Biometric error: ${e.code}');
      debugPrint('Biometric description: ${e.message}');

      if (!mounted) return;

      setState(() {
        errorMessage = 'Biometric authentication failed.';
      });
    } catch (e) {
      debugPrint('Biometric error: $e');

      if (!mounted) return;

      setState(() {
        errorMessage = 'Biometric authentication failed.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isBiometricLoading = false;
        });
      }
    }
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

        if (token != null && token.isNotEmpty) {
          final prefs = await SharedPreferences.getInstance();

          await prefs.setString('auth_token', token);

          // Enable biometric login for future app launches
          await prefs.setBool('biometric_enabled', true);

          ApiService.setToken(token);
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
                      minHeight:
                      screenHeight -
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
                                padding: EdgeInsets.all(isMobile ? 20 : 36),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Logo with BrickBook image - Shrunk to fit mobile
                                    // Container(
                                    //   width: 300,
                                    //   height: 80,
                                    //   decoration: BoxDecoration(
                                    //     borderRadius: BorderRadius.circular(18),
                                    //     boxShadow: [
                                    //       BoxShadow(
                                    //         color: Colors.black.withOpacity(0.15),
                                    //         blurRadius: 12,
                                    //         offset: const Offset(0, 4),
                                    //       ),
                                    //     ],
                                    //   ),
                                    //   child: ClipRRect(
                                    //     borderRadius: BorderRadius.circular(18),
                                    //     child: Image.asset(
                                    //       'assets/brickbook-logo_big.png',
                                    //       fit: BoxFit.cover,
                                    //     ),
                                    //   ),
                                    // ),
                                    Image.asset(
                                      'assets/brickbook-logo.png',
                                      fit: BoxFit.cover,
                                    ),
                                    // const SizedBox(height: 80),

                                    // Email Input
                                    AnimatedContainer(
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
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
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 4,
                                        ),
                                        child: TextFormField(
                                          controller: userIdController,
                                          focusNode: userIdFocus,
                                          keyboardType:
                                          TextInputType.emailAddress,
                                          validator: (value) {
                                            final email = value?.trim() ?? '';

                                            if (email.isEmpty) {
                                              return 'Please enter your email';
                                            }

                                            final emailRegex = RegExp(
                                              r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                                            );

                                            if (!emailRegex.hasMatch(email)) {
                                              return 'Please enter a valid email';
                                            }

                                            return null;
                                          },
                                          onFieldSubmitted: (_) =>
                                              passwordFocus.requestFocus(),
                                          textInputAction: TextInputAction.next,
                                          // onSubmitted: (_) =>
                                          //     passwordFocus.requestFocus(),
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
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
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
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 4,
                                        ),
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
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
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
                                            Colors.red[600]!.withOpacity(
                                              0.7,
                                            ),
                                            Colors.red[500]!.withOpacity(
                                              0.7,
                                            ),
                                          ]
                                              : [
                                            Colors.red[600]!,
                                            Colors.red[500]!,
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(25),
                                        boxShadow: [
                                          if (!isLoading)
                                            BoxShadow(
                                              color: Colors.red.withOpacity(
                                                0.3,
                                              ),
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
                                          borderRadius: BorderRadius.circular(
                                            25,
                                          ),
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
                                                    child: CircularProgressIndicator(
                                                      strokeWidth: 2.5,
                                                      valueColor:
                                                      AlwaysStoppedAnimation<
                                                          Color
                                                      >(
                                                        Colors.white
                                                            .withOpacity(
                                                          0.9,
                                                        ),
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

                                    //Biometric
                                    if (_canUseBiometric) ...[
                                      const SizedBox(height: 16),

                                      Row(
                                        children: [
                                          const Expanded(child: Divider()),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 12,
                                            ),
                                            child: Text(
                                              'OR',
                                              style: TextStyle(
                                                color: Colors.grey,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                          const Expanded(child: Divider()),
                                        ],
                                      ),

                                      const SizedBox(height: 16),

                                      SizedBox(
                                        width: double.infinity,
                                        height: 48,
                                        child: OutlinedButton.icon(
                                          onPressed: _isBiometricLoading
                                              ? null
                                              : _authenticateWithBiometric,
                                          icon: _isBiometricLoading
                                              ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child:
                                            CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                              : const Icon(
                                            Icons.fingerprint,
                                            size: 24,
                                          ),
                                          label: Text(
                                            _isBiometricLoading
                                                ? 'Authenticating...'
                                                : 'Login with Biometrics',
                                          ),
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: Colors.blue[600],
                                            side: BorderSide(
                                              color: Colors.blue[200]!,
                                            ),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                              BorderRadius.circular(25),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
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
            Align(
              alignment: Alignment.bottomCenter,
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    "Version - $currentVersion",
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.w400,
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
