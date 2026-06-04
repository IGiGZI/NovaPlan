// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'widgets/gradient_button.dart';
import 'widgets/glass_button.dart';
import 'widgets/gradient_scaffold.dart';
import 'select_path_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'services/auth_service.dart';

class AuthFormScreen extends StatefulWidget {
  const AuthFormScreen({super.key});

  @override
  State<AuthFormScreen> createState() => _AuthFormScreenState();
}

class _AuthFormScreenState extends State<AuthFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool isLoginMode = true; 
  bool isLoading = false;

  void toggleMode() => setState(() => isLoginMode = !isLoginMode);

  Future<void>  _enterApp({bool isGuest = false}) async {
    if (isGuest) {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('user_id', 'guest');
}
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 800),
        pageBuilder: (_, __, ___) => const SelectPathScreen(allRoadmaps: []),
        transitionsBuilder: (_, anim, __, child) => FadeTransition(opacity: anim, child: child),
      ),
    );
  }

 Future<void> submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => isLoading = true);

    try {
      Map<String, dynamic> result;
      if (isLoginMode) {
        result = await AuthService.login(
          _emailController.text.trim(),
          _passwordController.text.trim(),
        );
      } else {
        result = await AuthService.signup(
          _usernameController.text.trim(),
          _emailController.text.trim(),
          _passwordController.text.trim(),
        );
      }

      if (result.containsKey('id') || result.containsKey('_id')) {
        
        final prefs = await SharedPreferences.getInstance();
        String userId = result['id']?.toString() ?? result['_id']?.toString() ?? "";
        await prefs.setString('user_id', userId);
        // ----------------------------------------------

        if (!mounted) return;
        _enterApp(); 
      } else {
        _showError(result["message"] ?? "حدث خطأ غير متوقع");
      }
    } catch (e) {
      _showError("خطأ في الاتصال: تأكد من تشغيل الباك-إيند");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }
void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          msg, 
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)
        ),
        backgroundColor: const Color(0xFF1E1E2F),   
        behavior: SnackBarBehavior.floating,
        elevation: 10,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
          side: const BorderSide(color: Colors.redAccent, width: 1), 
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      child: Scaffold(
        backgroundColor: const Color(0xFF0F0F1E), 
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isLoginMode ? "SIGN IN" : "SIGN UP",
                  style: const TextStyle(
                    fontSize: 32, 
                    fontWeight: FontWeight.w900, 
                    color: Colors.white,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  isLoginMode ? "Welcome back to NovaPlan" : "Start your AI journey today",
                  style: const TextStyle(color: Colors.white38, fontSize: 14),
                ),
                const SizedBox(height: 40),
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      if (!isLoginMode)
                        _buildInput(controller: _usernameController, label: "Username", icon: Icons.person_outline),
                      const SizedBox(height: 15),
                      _buildInput(controller: _emailController, label: "Email Address", icon: Icons.email_outlined, type: TextInputType.emailAddress),
                      const SizedBox(height: 15),
                      _buildInput(controller: _passwordController, label: "Password", icon: Icons.lock_outline, isObscure: true),
                    ],
                  ),
                ),
                const SizedBox(height: 25),
                
                isLoading
                    ? const CircularProgressIndicator(color: Colors.cyanAccent)
                    : GradientButton(
                        text: isLoginMode ? "LOGIN" : "CREATE ACCOUNT",
                        onTap: submit,
                      ),
                
                const SizedBox(height: 15),
                
                TextButton(
                  onPressed: () => _enterApp(isGuest: true),
                  style: TextButton.styleFrom(foregroundColor: Colors.cyanAccent),
                  child: const Text(
                    "CONTINUE AS GUEST",
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                ),

                const SizedBox(height: 10),
                
                GlassButton(
                  text: isLoginMode ? "New here? Create account" : "Already have an account? Sign In",
                  onTap: toggleMode,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInput({
    required TextEditingController controller, 
    required String label, 
    required IconData icon, 
    bool isObscure = false,
    TextInputType type = TextInputType.text
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isObscure,
      keyboardType: type,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        filled: true,
        fillColor: const Color(0xFF1E1E2F), 
        prefixIcon: Icon(icon, color: Colors.cyanAccent, size: 20),
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white38, fontSize: 14),
        floatingLabelStyle: const TextStyle(color: Colors.cyanAccent),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Colors.white10),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Colors.cyanAccent, width: 1.5),
        ),
      ),
      validator: (value) => (value == null || value.isEmpty) ? "Required field" : null,
    );
  }
}