// ignore_for_file: use_build_context_synchronously
import 'dart:convert';
import 'package:career_path_app/config.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class StepDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> step;
  final String careerName;
  const StepDetailsScreen({
    super.key,
    required this.step,
    required this.careerName,
  });
  @override
  State<StepDetailsScreen> createState() => _StepDetailsScreenState();
}

class _StepDetailsScreenState extends State<StepDetailsScreen> {
  late List<bool> milestoneCompleted;
  double progress = 0.0; 

  @override
  void initState() {
    super.initState();
    final milestones = widget.step['milestones'] ?? [];
    
    milestoneCompleted = List<bool>.filled(milestones.length, false);
    
    _initData();
  }

  Future<void> _initData() async {
    await loadSavedProgress();
    _calculateProgress();
  }

  void _calculateProgress() {
    if (milestoneCompleted.isEmpty) {
      progress = 0.0;
    } else {
      int count = milestoneCompleted.where((item) => item == true).length;
      setState(() {
        progress = count / milestoneCompleted.length;
      });
    }
  }

  String get _storageKey => "prog_${widget.careerName}_${widget.step['title'] ?? 'step'}".replaceAll(" ", "_");

  Future<void> loadSavedProgress() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_storageKey) ?? [];
    if (mounted) {
      setState(() {
        for (int i = 0; i < saved.length && i < milestoneCompleted.length; i++) {
          milestoneCompleted[i] = saved[i] == "true";
        }
      });
      _calculateProgress();
    }
  }

  Future<void> saveProgress() async {
    _calculateProgress(); 

    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_storageKey, milestoneCompleted.map((e) => e.toString()).toList());
    
    try {
      String userId = prefs.getString('user_id') ?? "guest"; //   الحقيقي
      
      await http.patch(
        Uri.parse("${Config.roadmapBase}/update-progress"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "userId": userId, 
          "title": widget.careerName,
          "stepTitle": widget.step['title'],      
          "progress": milestoneCompleted,
        }),
      );
    } catch (e) {
      debugPrint("Cloud Sync Failed: $e"); 
    }
  }

  Future<void> openUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Could not open this link")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final milestones = List.from(widget.step['milestones'] ?? []);
    final resources = List.from(widget.step['resources'] ?? []);
    final children = List.from(widget.step['children'] ?? []);
    final tasks = List.from(widget.step['tasks'] ?? []);
    final duration = widget.step['duration'] ?? "";

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text("Step Analysis", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildMainInfoCard(duration),
            const SizedBox(height: 30),
            if (milestones.isNotEmpty) ...[
              const _SectionHeader(title: "Milestones", icon: Icons.auto_awesome_outlined),
              ...List.generate(milestones.length, (i) => _buildMilestoneItem(milestones[i], i)),
              const SizedBox(height: 25),
            ],
            if (tasks.isNotEmpty) ...[
              const _SectionHeader(title: "Practical Tasks", icon: Icons.terminal_rounded),
              ...tasks.map((task) => _buildTaskItem(task)),
              const SizedBox(height: 25),
            ],
            if (children.isNotEmpty) ...[
              const _SectionHeader(title: "Deep Dive Topics", icon: Icons.layers_outlined),
              ...children.map((child) => _buildSubStepItem(child)),
              const SizedBox(height: 25),
            ],
            if (resources.isNotEmpty) ...[
              const _SectionHeader(title: "Curated Resources", icon: Icons.library_books_outlined),
              ...resources.map((r) => _buildResourceItem(r)),
            ],
            const SizedBox(height: 50),
          ],
        ),
      ),
    );
  }

  Widget _buildMainInfoCard(String duration) {
    bool isDone = progress >= 1.0;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDone 
            ? [Colors.green.withOpacity(0.2), Colors.cyan.withOpacity(0.1)]
            : [Colors.blueAccent.withOpacity(0.1), Colors.purpleAccent.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDone ? Colors.greenAccent.withOpacity(0.3) : Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(widget.step['title'] ?? "Learning Step",
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              ),
              if (duration.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(10)),
                  child: Text(duration, style: const TextStyle(color: Colors.cyanAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 20),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.white10,
              color: isDone ? Colors.greenAccent : Colors.cyanAccent,
              minHeight: 10,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("${(progress * 100).toInt()}% Mastery", 
                style: TextStyle(color: isDone ? Colors.greenAccent : Colors.white60, fontWeight: FontWeight.bold)),
              if (isDone) const Text("🎉 Completed!", style: TextStyle(color: Colors.greenAccent, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMilestoneItem(dynamic milestone, int i) {
    bool done = milestoneCompleted[i];
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: done ? Colors.greenAccent.withOpacity(0.05) : const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: done ? Colors.greenAccent.withOpacity(0.2) : Colors.white.withOpacity(0.05)),
      ),
      child: CheckboxListTile(
        value: done,
        activeColor: Colors.greenAccent,
        checkColor: Colors.black,
        title: Text(milestone['title'] ?? "", 
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, decoration: done ? TextDecoration.lineThrough : null)),
        subtitle: Text(milestone['description'] ?? "", 
          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
        onChanged: (v) {
          setState(() => milestoneCompleted[i] = v ?? false);
          saveProgress();
        },
      ),
    );
  }

  Widget _buildTaskItem(dynamic task) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          const Icon(Icons.code, color: Colors.purpleAccent, size: 18),
          const SizedBox(width: 12),
          Expanded(child: Text(task.toString(), style: const TextStyle(color: Colors.white70, fontSize: 14))),
        ],
      ),
    );
  }

  Widget _buildSubStepItem(dynamic child) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.cyanAccent.withOpacity(0.1)),
      ),
      child: ListTile(
        title: Text(child['title'] ?? "Sub-topic", style: const TextStyle(color: Colors.white, fontSize: 14)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.cyanAccent),
        onTap: () {
          Navigator.push(context, MaterialPageRoute(
            builder: (_) => StepDetailsScreen(step: child, careerName: widget.careerName),
          ));
        },
      ),
    );
  }

  Widget _buildResourceItem(dynamic r) {
    final String url = r['url'] ?? "";
    IconData icon = Icons.link;
    if (url.contains("youtube")) icon = Icons.play_circle_outline;
    if (url.contains("github")) icon = Icons.data_object;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: Icon(icon, color: Colors.blueAccent),
        title: Text(r['title'] ?? "Reference", style: const TextStyle(color: Colors.white, fontSize: 14)),
        trailing: const Icon(Icons.open_in_new, size: 16, color: Colors.white24),
        onTap: () => openUrl(url),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, left: 4),
      child: Row(
        children: [
          Icon(icon, color: Colors.cyanAccent, size: 20),
          const SizedBox(width: 10),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
        ],
      ),
    );
  }
}