// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:translator/translator.dart';  

class LanguageSelectionScreen extends StatefulWidget {
  final Map<String, dynamic> careerData;
  // 🎯 تم تحديث الـ Callback ليمرر اللغات، والميزانية، والمستوى المختار للسيرفر
  final Function(List<String> selectedLanguages, bool preferPaid, String experienceLevel) onGenerateRoadmap;

  const LanguageSelectionScreen({
    super.key, 
    required this.careerData, 
    required this.onGenerateRoadmap,
  });

  @override
  State<LanguageSelectionScreen> createState() => _LanguageSelectionScreenState();
}
  
class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  final List<String> _selectedLanguages = [];  
  final GoogleTranslator translator = GoogleTranslator();

  // 🎯 متغيرات الفلترة الجديدة الخاصة بالميزانية والمستوى
  bool _preferPaid = false; // القيمة الافتراضية مجاني
  String _experienceLevel = 'default'; // المستوى الافتراضي للبرنامج

  Future<String> _translateFree(String text) async {
    if (text.trim().isEmpty) return text;    
    try {
      var translation = await translator.translate(text, to: 'ar');
      return translation.text;
    } catch (e) {
      print("Translation Error: $e");
      return text;   
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<dynamic> skills = widget.careerData['skills'] is List ? widget.careerData['skills'] : [];
    final List<dynamic> tasks = widget.careerData['tasks'] is List ? widget.careerData['tasks'] : [];
    final List<dynamic> languages = widget.careerData['languages'] is List ? widget.careerData['languages'] : [];
    final String description = widget.careerData['description'] ?? "No explicit description provided for this path.";
    final String educationLevel = widget.careerData['education_level'] ?? widget.careerData['education_min'] ?? "Not Specified";
    final String learningPath = widget.careerData['learning_path'] ?? "Self-Study";

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: const Color(0xFF0F0F1E),
        appBar: AppBar(
          title: Text(
            (widget.careerData['career'] ?? "DETAILS").toString().toUpperCase(), 
            style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1),
          ),
          backgroundColor: const Color(0xFF14142B),
          elevation: 0,
          iconTheme: const IconThemeData(color: Colors.white),
          bottom: const TabBar(
            indicatorColor: Colors.cyanAccent,
            labelColor: Colors.cyanAccent,
            unselectedLabelColor: Colors.white60,
            labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            tabs: [
              Tab(icon: Icon(Icons.info_outline, size: 18), text: "Overview"),
              Tab(icon: Icon(Icons.assignment_outlined, size: 18), text: "Tasks"),
              Tab(icon: Icon(Icons.code_outlined, size: 18), text: "Tools & AI"),            
            ],       
          ),       
        ),
        body: Column(
          children: [
            Expanded(
              child: TabBarView(
                physics: const BouncingScrollPhysics(),
                children: [
                  _buildOverviewTab(description, skills, educationLevel, learningPath),
                  _buildTasksTab(tasks),
                  _buildToolsAndAiTab(languages),             
                ],           
              ),           
            ),
            
            // ─── زر التوليد النهائي الذكي بالنيون ───
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                width: double.infinity,
                height: 52,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: const LinearGradient(colors: [Colors.cyanAccent, Color(0xFF00B4D8)]),
                  boxShadow: [
                    BoxShadow(color: Colors.cyanAccent.withOpacity(0.25), blurRadius: 12, offset: const Offset(0, 4))
                  ],
                ),
                child: ElevatedButton.icon(
                  // 🎯 يمرر جميع المتغيرات المحددة للـ Callback
                  onPressed: () => widget.onGenerateRoadmap(_selectedLanguages, _preferPaid, _experienceLevel),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.bolt, color: Colors.black, size: 20),
                  label: Text(
                    _selectedLanguages.isEmpty 
                        ? "GENERATE GENERAL ROADMAP" 
                        : "GENERATE WITH (${_selectedLanguages.length}) SELECTED TOOLS",
                    style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12), 
                  ), 
                ), 
              ), 
            ), 
          ],  
        ), 
      ), 
    );  
  }
  
  Widget _buildOverviewTab(String desc, List<dynamic> skills, String edu, String path) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildMetaBadge(Icons.school, edu),
              const SizedBox(width: 8),
              _buildMetaBadge(Icons.explore, path.toUpperCase().replaceAll('_', ' ')),
            ],
          ),
          const SizedBox(height: 20),
          const Text("ABOUT THIS CAREER", style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(color: const Color(0xFF1E1E2F), borderRadius: BorderRadius.circular(12)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  desc,
                  textDirection: TextDirection.ltr,
                  style: const TextStyle(color: Colors.white54, fontSize: 12.5, height: 1.4),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Divider(color: Colors.white.withOpacity(0.05), thickness: 1),
                ),
                FutureBuilder<String>(
                  future: _translateFree(desc), 
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Align(
                        alignment: Alignment.centerRight,
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(color: Colors.cyanAccent, strokeWidth: 1.5),
                        ),
                      );
                    }
                    final translatedText = snapshot.data ?? "";
                    return Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        translatedText,
                        textDirection: TextDirection.rtl, 
                        textAlign: TextAlign.right,       
                        style: const TextStyle(
                          color: Colors.cyanAccent, 
                          fontSize: 13, 
                          height: 1.5,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 25),
          if (skills.isNotEmpty) ...[
            Text("CORE SKILLS ( ${skills.length} )", style: const TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: skills.map((s) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E2F),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.cyanAccent.withOpacity(0.12)),
                ),
                child: Text(s.toString(), style: const TextStyle(color: Colors.cyanAccent, fontSize: 11)),
              )).toList(),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildTasksTab(List<dynamic> tasks) {
    if (tasks.isEmpty) {
      return const Center(child: Text("No preparation steps available.", style: TextStyle(color: Colors.white38)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      itemCount: tasks.length,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: const Color(0xFF1E1E2F), borderRadius: BorderRadius.circular(12)),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 10,
                backgroundColor: Colors.cyanAccent.withOpacity(0.1),
                child: Text("${index + 1}", style: const TextStyle(color: Colors.cyanAccent, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(tasks[index].toString(), style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4)),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildToolsAndAiTab(List<dynamic> languagesList) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "SELECT PREFERRED SKILLS/TOOLS FOR AI", 
            style: TextStyle(color: Colors.cyanAccent, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
          const SizedBox(height: 12),
          
          if (languagesList.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFF1E1E2F), borderRadius: BorderRadius.circular(12)),
              child: const Text(
                "No custom tools listed. Ready to generate roadmap directly!", 
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: languagesList.length,
              itemBuilder: (context, index) {
                final item = languagesList[index];
                String languageName = "";
                String languageDesc = "";
                if (item is Map) {
                  languageName = item['language'] ?? item['name'] ?? "Unknown";
                  languageDesc = item['description'] ?? item['desc'] ?? "";
                } else {
                  languageName = item.toString();
                }
                final isSelected = _selectedLanguages.contains(languageName);
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedLanguages.remove(languageName);
                      } else {
                        _selectedLanguages.add(languageName);
                      }
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.cyanAccent.withOpacity(0.04) : const Color(0xFF1E1E2F),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? Colors.cyanAccent : Colors.cyanAccent.withOpacity(0.05),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,  
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Icon(
                            isSelected ? Icons.check_box : Icons.check_box_outline_blank, 
                            color: isSelected ? Colors.cyanAccent : Colors.white30, 
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                languageName, 
                                style: TextStyle(
                                  color: isSelected ? Colors.cyanAccent : Colors.white, 
                                  fontWeight: FontWeight.bold, 
                                  fontSize: 13,
                                ), 
                              ),
                              if (languageDesc.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  languageDesc,
                                  style: const TextStyle(color: Colors.white54, fontSize: 11, height: 1.3), 
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

          const SizedBox(height: 24),

          // ─── 💰 أولاً: اختيار نوع الكورسات (مجاني أم مدفوع) ───
          const Text(
            "COURSE FINANCING OPTION", 
            style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildNeonFilterCard(
                  title: "Free Courses Only",
                  isActive: _preferPaid == false,
                  onTap: () => setState(() => _preferPaid = false),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildNeonFilterCard(
                  title: "Paid Included",
                  isActive: _preferPaid == true,
                  onTap: () => setState(() => _preferPaid = true),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // ─── 📈 ثانياً: اختيار مستوى صعوبة المسار البرمجي ───
          const Text(
            "ROADMAP DIFFICULTY LEVEL", 
            style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          
          // عرض المستويات بتصميم متناسق ومريح للعين
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildNeonFilterCard(
                title: "Default Level",
                isActive: _experienceLevel == 'default',
                width: 145,
                onTap: () => setState(() => _experienceLevel = 'default'),
              ),
              _buildNeonFilterCard(
                title: "Beginner (مبتدئ)",
                isActive: _experienceLevel == 'beginner',
                width: 145,
                onTap: () => setState(() => _experienceLevel = 'beginner'),
              ),
              _buildNeonFilterCard(
                title: "Intermediate (متوسط)",
                isActive: _experienceLevel == 'intermediate',
                width: 145,
                onTap: () => setState(() => _experienceLevel = 'intermediate'),
              ),
              _buildNeonFilterCard(
                title: "Pro (محترف)",
                isActive: _experienceLevel == 'pro',
                width: 145,
                onTap: () => setState(() => _experienceLevel = 'pro'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ويدجت فلترة مخصصة ومتناسقة تماماً مع ألوان التطبيق النيون النظيفة
  Widget _buildNeonFilterCard({
    required String title,
    required bool isActive,
    required VoidCallback onTap,
    double? width,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: width,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E2F),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? Colors.cyanAccent : Colors.cyanAccent.withOpacity(0.06),
            width: 1.2,
          ),
        ),
        child: Center(
          child: Text(
            title,
            style: TextStyle(
              color: isActive ? Colors.cyanAccent : Colors.white60,
              fontSize: 11.5,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetaBadge(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: const Color(0xFF1E1E2F), borderRadius: BorderRadius.circular(6)),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 12),
          const SizedBox(width: 5),
          Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)), 
        ],  
      ), 
    ); 
  }
}