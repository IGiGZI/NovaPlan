import 'package:flutter/material.dart';

class GradientButton extends StatelessWidget {
  final String text;
  final IconData? icon;
  final VoidCallback onTap;

  const GradientButton({super.key, required this.text, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 36),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF9B1BFF), Color(0xFF2E7BFF)]),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
            if (icon != null) ...[
              const SizedBox(width: 8),
              Icon(icon, size: 18, color: Colors.white),
            ]
          ],
        ),
      ),
    );
  }
}
