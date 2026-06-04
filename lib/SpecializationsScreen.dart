import 'package:career_path_app/CareerResultScreen.dart';
import 'package:flutter/material.dart';

class SpecializationsScreen extends StatelessWidget {
  final List<dynamic> subFields;
  final String userSummary;
  final String parentCareer;

  const SpecializationsScreen({
    super.key, 
    required this.subFields, 
    required this.userSummary, 
    required this.parentCareer
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text("Specializations for $parentCareer", style: const TextStyle(fontSize: 16)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: subFields.length,
        itemBuilder: (context, index) {
          final sub = subFields[index];
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CareerResultScreen(
                    recommendedField: sub['name'], 
                    confidence: 1.0,
                    roadmap: const [],  
                    userSummary: userSummary,
                    careerDescription: sub['description'] ?? "",  subFields: const [],
                //    subFields: const [], skills: [], tasks: [], languages: [],  
                  ),
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 15),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(sub['name'], style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(sub['description'] ?? "", style: const TextStyle(color: Colors.white54, fontSize: 13)),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: Colors.cyanAccent, size: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}