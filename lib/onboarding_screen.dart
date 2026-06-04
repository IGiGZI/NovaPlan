import 'package:flutter/material.dart';
import 'dart:ui';
import 'AuthFormScreen.dart';
const String image1 = 'assets/images/logo.png';
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}
class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  late AnimationController _mainController;
  late AnimationController _pulseController;
  late Animation<double> _fade;
  late Animation<double> _scale;
  late Animation<double> _slide;
  @override
  void initState() {
    super.initState();
    _mainController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1500));
    _pulseController = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _fade = CurvedAnimation(parent: _mainController, curve: const Interval(0.0, 0.6, curve: Curves.easeIn));
_scale = Tween(begin: 0.8, end: 1.0)
    .animate(CurvedAnimation(parent: _mainController, curve: Curves.easeOutBack));        
    _slide = Tween(begin: 60.0, end: 0.0)
        .animate(CurvedAnimation(parent: _mainController, curve: Curves.easeOutQuart));
    _mainController.forward();
  }
  @override
  void dispose() {
    _mainController.dispose();
    _pulseController.dispose();
    super.dispose();
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1E), 
      body: Stack(
        children: [
          _buildAnimatedBackground(),
          SafeArea(
            child: FadeTransition(
              opacity: _fade,
              child: AnimatedBuilder(
                animation: _mainController,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _slide.value),
                    child: child,
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 30),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Spacer(),
                    _buildAnimatedLogo(),
                      const SizedBox(height: 60),
                      const Text(
                        "DESIGN YOUR\nFUTURE PATH",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 38,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1.0,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        "AI-driven career roadmaps tailored\nprecisely for your ambitions.",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white54,
                          height: 1.5,
                        ),
                      ),
                      const Spacer(),
                      _buildGetStartedButton(context),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  Widget _buildAnimatedBackground() {
    return Stack(
      children: [
        Positioned(
          top: -100,
          right: -50,
          child: _buildBlurCircle(Colors.cyanAccent.withOpacity(0.15), 250),
        ),
        Positioned(
          bottom: -50,
          left: -50,
          child: _buildBlurCircle(const Color(0xFF6A00F4).withOpacity(0.1), 300),
        ),
      ],
    );
  }
  Widget _buildBlurCircle(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 70, sigmaY: 70),
        child: Container(color: Colors.transparent),
      ),
    );
  }
  Widget _buildAnimatedLogo() {
    return ScaleTransition(
      scale: _scale,
      child: AnimatedBuilder(
        animation: _pulseController,
        builder: (context, child) {
          return Container(
            width: 250,
            height: 250,
            padding: const EdgeInsets.all(30),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFF0F0F1E)
            ),
            child: child,
          );
        },
        child: Image.asset(image1, width: 220, height: 200),
      ),
    );
  }
  Widget _buildGetStartedButton(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              PageRouteBuilder(
                transitionDuration: const Duration(milliseconds: 800),
                pageBuilder: (_, __, ___) => const AuthFormScreen(),
                transitionsBuilder: (_, anim, __, child) => FadeTransition(opacity: anim, child: child),
              ),
            );
          },
          child: Container(
            width: double.infinity,
            height: 65,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
              gradient: LinearGradient(
                colors: [
                  Colors.cyanAccent.withOpacity(0.8),
                  const Color(0xFF6A00F4).withOpacity(0.8),
                ],
              ),
            ),
            child: const Center(
              child: Text(
                "GET STARTED",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}