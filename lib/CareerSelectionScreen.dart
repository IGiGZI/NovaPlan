import 'package:flutter/material.dart';
import 'CareerDetailsScreen.dart';

class CareerSelectionScreen extends StatelessWidget {
  final List<Map<String, dynamic>> potentialCareers;
  final String userSummary;

  const CareerSelectionScreen({
    super.key,
    required this.potentialCareers,
    required this.userSummary,
  });
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text(
          "Recommended Paths", 
          style: TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold)
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body:  Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Based on your profile, we found ${potentialCareers.length} paths:",
              style: const TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: ListView.builder(
                physics: const BouncingScrollPhysics(),
                itemCount: potentialCareers.length,
                itemBuilder: (context, index) {
                  final career = potentialCareers[index];
                  
                  // 🛑 التعديل هنا بالظبط: مررنا الـ index واسم المهنة للدالة الذكية 👇
              final String matchPercentage = (career['match_score'] ?? "85%").toString();

                  return Container(
                    margin: const EdgeInsets.only(bottom: 15),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.white.withOpacity(0.08), Colors.white.withOpacity(0.02)],
                      ),
                      border: Border.all(color: Colors.cyanAccent.withOpacity(0.15)),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      title: Row(
                        children: [
                          // اسم المسار المهني
                          Expanded(
                            child: Text(
                              (career['career'] ?? "Unknown Path").toString().toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14.5),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Badge نيون احترافي لعرض نسبة الدقة والتشابه بالـ AI
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.cyanAccent.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.cyanAccent.withOpacity(0.3), width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.bolt, color: Colors.cyanAccent, size: 12),
                                const SizedBox(width: 2),
                                Text(
                                  matchPercentage,
                                  style: const TextStyle(
                                    color: Colors.cyanAccent,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          career['category'] ?? "General Field",
                          style: const TextStyle(color: Colors.white38, fontSize: 12),
                        ),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white30, size: 14),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CareerDetailsScreen(
                              careerName: career['career'] ?? "",
                              userSummary: userSummary,
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}