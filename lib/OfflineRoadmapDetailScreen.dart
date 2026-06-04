import 'package:flutter/material.dart';
import 'StepDetailScreen.dart'; // تأكد من استدعاء شاشة التفاصيل

class OfflineRoadmapDetailScreen extends StatelessWidget {
  final String careerTitle;
  final String description;
  final List<dynamic> roadmapSteps;

  const OfflineRoadmapDetailScreen({
    super.key,
    required this.careerTitle,
    required this.description,
    required this.roadmapSteps,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // توحيد الخلفية النيون
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. AppBar متناسق مع CareerResult
          SliverAppBar(
            backgroundColor: Colors.transparent,
            pinned: true,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text(
              "OFFLINE GUIDE",
              style: TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            centerTitle: true,
          ),

          // 2. الهيدر (العنوان والوصف) بنفس ستايل CareerResult
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    careerTitle.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.cyanAccent,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(width: 50, height: 4, decoration: BoxDecoration(color: Colors.cyanAccent, borderRadius: BorderRadius.circular(10))),
                  const SizedBox(height: 15),
                  Text(
                    description.isNotEmpty ? description : "Stored Offline Path",
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14),
                  ),
                ],
              ),
            ),
          ),

          // 3. عرض الخطوات بشكل Clickable
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverToBoxAdapter(
              child: roadmapSteps.isEmpty
                  ? const Center(child: Text("No offline steps found.", style: TextStyle(color: Colors.white24)))
                  : Column(
                      children: roadmapSteps.map((path) {
                        // استخراج الخطوات الداخلية (Steps)
                        final steps = List.from(path["steps"] ?? path["milestones"] ?? []);
                        
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // عنوان المرحلة (Phase Title)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 15),
                              child: Text(
                                (path["path_title"] ?? path["title"] ?? "PHASE").toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.cyanAccent,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),
                            // الخطوات الـ Clickable
                            ...steps.asMap().entries.map((entry) => _buildOfflineStepTile(context, entry.value, entry.key)),
                          ],
                        );
                      }).toList(),
                    ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 50)),
        ],
      ),
    );
  }

  // بناء الـ Step Tile بنفس شكل الـ CareerResult ومجعلها Clickable
  Widget _buildOfflineStepTile(BuildContext context, dynamic step, int index) {
    // استخراج العنوان المؤمن
    String stepTitle = "Step ${index + 1}";
    if (step is Map) {
      if (step["milestones"] != null && step["milestones"] is List && step["milestones"].isNotEmpty) {
        stepTitle = step["milestones"][0]["title"]?.toString() ?? stepTitle;
      } else {
        stepTitle = step["title"]?.toString() ?? stepTitle;
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.cyanAccent.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.cyanAccent.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.cyanAccent.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Text(
            "${index + 1}",
            style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(
          stepTitle,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        subtitle: const Text(
          "Offline access to tasks & resources",
          style: TextStyle(color: Colors.white38, fontSize: 12),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.cyanAccent),
        
        // جعل البيانات Clickable لتفتح شاشة التفاصيل
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => StepDetailsScreen(
                step: step,
                careerName: careerTitle,
              ),
            ),
          );
        },
      ),
    );
  }
}