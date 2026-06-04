import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class InfoScreen extends StatelessWidget {
  const InfoScreen({super.key});

  // دالة لفتح تطبيق البريد الإلكتروني لإرسال رسالة مباشرة
  Future<void> _sendEmail(String email) async {
    final Uri emailLaunchUri = Uri(
      scheme: 'mailto',
      path: email.trim(),
      queryParameters: {
        'subject': 'NovaPlan App Feedback',
      },
    );

    try {
      if (await canLaunchUrl(emailLaunchUri)) {
        await launchUrl(emailLaunchUri);
      } else {
        throw 'Could not launch $emailLaunchUri';
      }
    } catch (e) {
      // إشعار مستخدم في حال فشل فتح تطبيق البريد
      debugPrint("Error launching email: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    const String email = "NovaPlanTeam@gmail.com";

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1E),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          "ABOUT NOVAPLAN",
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            const SizedBox(height: 10),
            
            _buildInfoCard("App Version", "1.0.0 (Beta)", Icons.info_outline),
            const SizedBox(height: 16),
            
            _buildInfoCard("Developers", "Nova Team", Icons.code),
            const SizedBox(height: 16),
            
            _buildInfoCard(
              "Our Goal", 
              "To empower global careers through intelligent, dynamic, AI-driven roadmaps.", 
              Icons.auto_graph
            ),
            const SizedBox(height: 16),

            _buildInfoCard(
              "AI & Core Infrastructure", 
              "Powered by advanced AI models built with Python & Node.js orchestration.", 
              Icons.psychology
            ),
            const SizedBox(height: 16),
            
            // كارت الإيميل القابل للضغط
            _buildInfoCard(
              "Contact Us", 
              email, 
              Icons.email_outlined,
              isClickable: true,
              onTap: () => _sendEmail(email),
            ),
            
            const SizedBox(height: 40),
            const Text(
              "Built with Love ❤️ ", 
              style: TextStyle(color: Colors.white24, fontSize: 13, letterSpacing: 0.5)
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(
    String title, 
    String content, 
    IconData icon, {
    bool isClickable = false,
    VoidCallback? onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E2F).withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
        // تأثير هالة توهج نيون خفيف (Neon Glow Effect) بدلاً من الحدود التقليدية
        boxShadow: [
          BoxShadow(
            color: Colors.cyanAccent.withOpacity(0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          highlightColor: isClickable ? Colors.cyanAccent.withOpacity(0.05) : Colors.transparent,
          splashColor: isClickable ? Colors.cyanAccent.withOpacity(0.1) : Colors.transparent,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start, // يضمن محاذاة الأيقونة مع النصوص الطويلة
              children: [
                Icon(
                  icon, 
                  color: isClickable ? Colors.cyanAccent : const Color(0xFF8A8A9E),
                  size: 24
                ),
                const SizedBox(width: 18),
                // تم استخدام Expanded لحل مشكلة تجاوز المقاسات وضبط النصوص الطويلة تلقائيًا
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title, 
                        style: const TextStyle(
                          color: Colors.white38, 
                          fontSize: 12,
                          fontWeight: FontWeight.w500
                        )
                      ),
                      const SizedBox(height: 4),
                      Text(
                        content, 
                        style: TextStyle(
                          color: isClickable ? Colors.cyanAccent : Colors.white, 
                          fontSize: 15, 
                          fontWeight: FontWeight.w600,
                          height: 1.3, // لتحسين قراءة الأسطر المتعددة إن وجدت
                          decoration: isClickable ? TextDecoration.underline : TextDecoration.none,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isClickable)
                  const Icon(
                    Icons.arrow_forward_ios, 
                    color: Colors.cyanAccent, 
                    size: 14
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}