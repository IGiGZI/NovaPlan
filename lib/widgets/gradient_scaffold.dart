import 'package:flutter/material.dart';

class GradientScaffold extends StatefulWidget {
  final Widget child;
  const GradientScaffold({super.key, required this.child});

  @override
  State<GradientScaffold> createState() => _GradientScaffoldState();
}

class _GradientScaffoldState extends State<GradientScaffold>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true); // حركة ذهاب وعودة
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        
        return Scaffold(
          body: Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment(-1 + _controller.value * 2, -1),
                end: Alignment(1 - _controller.value * 2, 1),
                colors: const [
                  Color(0xFF36003B),
                  Color(0xFF071733),
                  Color(0xFF1A1F71),
                ],
              ),
            ),
            child: SafeArea(child: widget.child),
          ),
        );
      },
    );
  }
}
