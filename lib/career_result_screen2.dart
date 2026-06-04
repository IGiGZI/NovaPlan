// ignore_for_file: deprecated_member_use, use_build_context_synchronously
import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'config.dart';
import 'StepDetailScreen.dart'; 
class CareerResultScreen2 extends StatefulWidget {
  final String recommendedField;
  final double confidence;
  final String userSummary;
  final String careerDescription;
  final List<dynamic> roadmap;
  const CareerResultScreen2({
    super.key,
    required this.recommendedField,
    required this.confidence,
    required this.userSummary,
    this.careerDescription = "",
    this.roadmap = const [],
  });
  @override
  State<CareerResultScreen2> createState() => _CareerResultScreenState();
}

class _CareerResultScreenState extends State<CareerResultScreen2> {
  List<dynamic> currentRoadmaps = [];
  String currentDescription = "";
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    currentDescription = widget.careerDescription;
    _loadCareerData();
  }

  Future<void> _loadCareerData() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
        currentRoadmaps = [];
      });

      final response = await http.post(
              Uri.parse(Config.generate_from_title),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'career_title': widget.recommendedField.trim(),
          'user_summary': widget.userSummary,
          'force_refresh': true,
        }),
      ).timeout(const Duration(seconds: 45));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          currentRoadmaps = List.from(data['roadmaps'] ?? []);
          currentDescription = data['description'] ?? "Tailored roadmap for ${widget.recommendedField}";
          isLoading = false;
        });
      } else {
        setState(() {
          isLoading = false;
          errorMessage = "Server error (${response.statusCode})";
        });
      }
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = "Network error. Please try again.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(widget.recommendedField.toUpperCase(),
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        backgroundColor: const Color(0xFF0F172A).withOpacity(0.8),
        elevation: 0,
        centerTitle: true,
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.transparent),
          ),
        ),
      ),
      body: Stack(
        children: [
          // Background Glows
          Positioned(
            top: -100,
            right: -50,
            child: _buildGlowCircle(Colors.cyanAccent.withOpacity(0.1)),
          ),
          Positioned(
            bottom: 100,
            left: -50,
            child: _buildGlowCircle(Colors.purpleAccent.withOpacity(0.1)),
          ),
          _buildMainContent(),
        ],
      ),
    );
  }

  Widget _buildGlowCircle(Color color) {
    return Container(
      width: 300,
      height: 300,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }

  Widget _buildMainContent() {
    if (isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Colors.cyanAccent, strokeWidth: 2),
            const SizedBox(height: 20),
            Text("Designing your future...", 
                 style: TextStyle(color: Colors.cyanAccent.withOpacity(0.7), letterSpacing: 1.2)),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.redAccent.withOpacity(0.5), size: 50),
            const SizedBox(height: 16),
            Text(errorMessage!, style: const TextStyle(color: Colors.white60)),
            TextButton(onPressed: _loadCareerData, child: const Text("Retry Connection", style: TextStyle(color: Colors.cyanAccent))),
          ],
        ),
      );
    }

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 120, 20, 20),
          sliver: SliverToBoxAdapter(child: _buildHeader()),
        ),
        
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final path = currentRoadmaps[index];
                final steps = List.from(path["steps"] ?? []);
                return _buildPhaseSection(index + 1, path, steps);
              },
              childCount: currentRoadmaps.length,
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 40)),
      ],
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.cyanAccent.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.cyanAccent.withOpacity(0.3)),
          ),
          child: const Text("AI INSIGHT", style: TextStyle(color: Colors.cyanAccent, fontSize: 10, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 12),
        Text(currentDescription,
            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 15, height: 1.6, fontStyle: FontStyle.italic)),
        const SizedBox(height: 30),
        const Divider(color: Colors.white10),
        const SizedBox(height: 10),
      ],
    );
  }

  Widget _buildPhaseSection(int index, dynamic path, List steps) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(colors: [Colors.cyanAccent, Colors.blueAccent]),
                boxShadow: [BoxShadow(color: Colors.cyanAccent.withOpacity(0.3), blurRadius: 10)],
              ),
              child: Center(child: Text("$index", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                path["path_title"]?.toUpperCase() ?? "PHASE $index",
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
            ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.only(left: 15),
          child: Container(
            decoration: const BoxDecoration(border: Border(left: BorderSide(color: Colors.white10, width: 2))),
            padding: const EdgeInsets.only(left: 25, top: 20, bottom: 10),
            child: Column(
              children: steps.map((step) => _buildStepCard(step)).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStepCard(dynamic step) {
    String title = step["title"] ?? step["path_title"] ?? "Untitled Step";
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(step["focus"] ?? "Tap to explore details",
                  style: const TextStyle(color: Colors.white38, fontSize: 12)),
            ),
            trailing: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.05)),
              child: const Icon(Icons.chevron_right, size: 18, color: Colors.cyanAccent),
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => StepDetailsScreen(step: step, careerName: widget.recommendedField)),
              );
            },
          ),
        ),
      ),
    );
  }
}