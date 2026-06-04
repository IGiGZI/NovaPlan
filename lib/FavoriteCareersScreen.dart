import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'OfflineRoadmapDetailScreen.dart';

class FavoriteCareersScreen extends StatefulWidget {
  const FavoriteCareersScreen({super.key});

  @override
  State<FavoriteCareersScreen> createState() => _FavoriteCareersScreenState();
}
class _FavoriteCareersScreenState extends State<FavoriteCareersScreen> {
  List<Map<String, dynamic>> savedRoadmaps = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLocalRoadmaps();
  }

  Future<void> _refreshData() async {
    await _loadLocalRoadmaps();
  }

  Future<void> _loadLocalRoadmaps() async {
    setState(() => isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    
    final allKeys = prefs.getKeys();
    List<Map<String, dynamic>> tempItems = [];

    for (String key in allKeys) {
      if (key.startsWith('roadmap_')) {
        String? jsonStr = prefs.getString(key);
        if (jsonStr != null) {
          try {
            tempItems.add(jsonDecode(jsonStr));
          } catch (e) {
            debugPrint("Error decoding local roadmap: $e");
          }
        }
      }
    }

    setState(() {
      savedRoadmaps = tempItems;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // توحيد الخلفية النيون الغامقة
      appBar: AppBar(
        title: const Text(
          "MY OFFLINE PATHS", 
          style: TextStyle(letterSpacing: 1.2, fontSize: 16, fontWeight: FontWeight.bold, color: Colors.cyanAccent)
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: isLoading 
          ? _buildLoadingSkeleton() // استخدام أنيميشن الهيكل العظمي بدلاً من الدائرة القديمة
          : RefreshIndicator( 
              onRefresh: _refreshData,
              color: Colors.cyanAccent,
              backgroundColor: const Color(0xFF1E293B),
              child: savedRoadmaps.isEmpty
                  ? _buildEmptyState() // عرض حالة القائمة الفاضية بشكل منسق
                  : ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(), // لضمان عمل الـ الـ Pull to refresh حتى لو كانت القائمة قصيرة
                      padding: const EdgeInsets.all(20),
                      itemCount: savedRoadmaps.length,
                      itemBuilder: (context, index) => _buildRoadmapCard(savedRoadmaps[index]),
                    ),
            ),
    );
  }

  Widget _buildRoadmapCard(Map<String, dynamic> data) {
    String careerName = (data['career'] ?? data['title'] ?? "Roadmap").toString();
    
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B), // متوافق مع درجات الوان الـ Cards في التطبيق
        borderRadius: BorderRadius.circular(20), // حواف دائرية عصرية
        border: Border.all(color: Colors.cyanAccent.withOpacity(0.08)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.cyanAccent.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.auto_awesome, color: Colors.cyanAccent, size: 20),
        ),
        title: Text(
          careerName.toUpperCase(), 
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.5)
        ),
        subtitle: const Padding(
          padding: EdgeInsets.only(top: 5),
          child: Text("Saved on Device • Offline Access", style: TextStyle(color: Colors.white38, fontSize: 11)),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
onTap: () {
          Navigator.push(context, MaterialPageRoute(
            builder: (_) => OfflineRoadmapDetailScreen(
              careerTitle: careerName,
              description: data['description'] ?? data['careerDescription'] ?? "",
              roadmapSteps: data['roadmaps'] ?? data['roadmap'] ?? [],            )
          ));
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bookmark_border_rounded, size: 60, color: Colors.white.withOpacity(0.2)),
            const SizedBox(height: 15),
            const Text(
              "No saved roadmaps on this device.", 
              style: TextStyle(color: Colors.white38, fontSize: 14, fontWeight: FontWeight.w500)
            ),
            const SizedBox(height: 5),
            Text(
              "Pull down to refresh or generate a new roadmap.", 
              style: TextStyle(color: Colors.white.withOpacity(0.15), fontSize: 11)
            ),
          ],
        ),
      ),
    );
  }

 Widget _buildLoadingSkeleton() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: List.generate(3, (index) => Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 140, 
              height: 12, 
              decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(10))
            ),
            const SizedBox(height: 10),
            Container(
              width: 200, 
              height: 8, 
              decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(10))
            ),
          ],
        ),
      )),
    );
        } }