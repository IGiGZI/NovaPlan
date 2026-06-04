import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'CareerResultScreen.dart';
import 'package:translator/translator.dart';  
  final GoogleTranslator translator = GoogleTranslator();


class CareerDetailsScreen extends StatefulWidget {
  final String careerName;
  final String userSummary;

  const CareerDetailsScreen({
    super.key,
    required this.careerName,
    required this.userSummary,
  });

  @override
  State<CareerDetailsScreen> createState() => _CareerDetailsScreenState();
}
class _CareerDetailsScreenState extends State<CareerDetailsScreen> {
    Future<String> _translateFree(String text) async {
    if (text.trim().isEmpty) return text;    
    try {
      var translation = await translator.translate(text, to: 'ar');
      return translation.text;
    } catch (e) {
      print("Translation Error: $e");
      return text;   }}

  Map<String, dynamic>? careerData;
  bool isLoading = true;
  int selectedSubFieldIndex = -1; 
  // لتخزين اللغات المختارة داخل التخصص
  Set<String> selectedLanguageNames = {};
  @override
  void initState() {
    super.initState();
    _loadAndSearchCareer();
  }
  Future<void> _loadAndSearchCareer() async {
    try {
      final String response = await rootBundle.loadString('assets/categorized_careers_by_education.json');
      final List<dynamic> data = json.decode(response);
      String searchKey = widget.careerName.trim().toLowerCase();

      for (var category in data) {
        final Map<String, dynamic> paths = category['careers_by_learning_path'] ?? {};
        for (var pathKey in paths.keys) {
          final List<dynamic> careersList = paths[pathKey] is List ? paths[pathKey] : [];
          for (var c in careersList) {
            if (c['career'].toString().trim().toLowerCase() == searchKey) {
              setState(() {
                careerData = c as Map<String, dynamic>;
                isLoading = false;
              });
              return;
            }
          }
        }
      }
    } catch (e) {
      debugPrint("Error loading career: $e");
    }
    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0F172A),
        body: Center(child: CircularProgressIndicator(color: Colors.cyanAccent)),
      );
    }

    if (careerData == null) return _buildErrorState();

    final title = careerData!['career']?.toString() ?? widget.careerName;
    final description = careerData!['description']?.toString() ?? "No description available.";
    final List skills = careerData!['skills'] is List ? careerData!['skills'] : [];
    final List subFields = careerData!['sub_fields'] is List ? careerData!['sub_fields'] : [];
    final bool isPopular = careerData!['popular_in_egypt'] == true;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        children: [
          _buildBackgroundDecoration(),
          CustomScrollView(
            slivers: [
              _buildAppBar(),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
 children: [
  if (isPopular) _buildEgyptBadge(),
  _buildHeader(title),
  const SizedBox(height: 25),
  _buildSectionTitle("General Description"),
  
  // كارت الوصف العام بمساحته الكاملة (الإنجليزي + العربي)
  _buildGlassCard(
    child: SizedBox(
      width: double.infinity, // المساحة الكاملة
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. النص الإنجليزي الأصلي
          Text(
            description,
            style: TextStyle(color: Colors.white.withOpacity(0.6), height: 1.5, fontSize: 13.5),
          ),
          const SizedBox(height: 12),
          // خط فاصل خفيف جداً بين اللغتين
          Container(height: 1, color: Colors.white.withOpacity(0.05)),
          const SizedBox(height: 12),
          // 2. الترجمة الفورية للعربية
          FutureBuilder<String>(
            future: _translateFree(description),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Align(
                  alignment: Alignment.centerRight,
                  child: SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(color: Colors.cyanAccent, strokeWidth: 1.2),
                  ),
                );
              }
              final translatedText = snapshot.data ?? "";
              if (translatedText.isEmpty) return const SizedBox.shrink();

              return Align(
                alignment: Alignment.centerRight,
                child: SizedBox(
                  width: double.infinity,
                  child: Text(
                    translatedText,
                    textDirection: TextDirection.rtl,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      color: Colors.cyanAccent.withOpacity(0.85), // نيون خفيف لتمييز العربي
                      height: 1.5,
                      fontSize: 13.5,
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    ),
  ),
  
  const SizedBox(height: 30),
  
  if (subFields.isNotEmpty) ...[
    _buildSectionTitle("Select Specialization"),
    ...List.generate(subFields.length, (index) {
      return _buildSelectableSubFieldCard(
        index: index,
        data: subFields[index],
        isSelected: selectedSubFieldIndex == index,
      );
    }),
  ],



                      if (skills.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        _buildSectionTitle("Core Skills to Master"),
                        Wrap(
                          spacing: 10, runSpacing: 10,
                          children: skills.map((s) => _buildModernChip(s.toString())).toList(),
                        ),
                      ],
                      const SizedBox(height: 140),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            bottom: 30, left: 20, right: 20,
            child: _buildNeonButton(title, description, skills, subFields),
          ),
        ],
      ),
    );
  }
Widget _buildSelectableSubFieldCard({required int index, required dynamic data, required bool isSelected}) {
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedSubFieldIndex = index;
          selectedLanguageNames.clear(); // ريست للغات لو غير التخصص
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? Colors.cyanAccent.withOpacity(0.08) : Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? Colors.cyanAccent : Colors.white.withOpacity(0.05), width: isSelected ? 1.5 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(isSelected ? Icons.check_circle : Icons.radio_button_off, color: isSelected ? Colors.cyanAccent : Colors.white24, size: 22),
                const SizedBox(width: 12),
                Expanded(child: Text(data['name'] ?? "", style: TextStyle(color: isSelected ? Colors.cyanAccent : Colors.white, fontWeight: FontWeight.bold, fontSize: 17))),
              ],
            ),
            const SizedBox(height: 12),
            // 1. الوصف الإنجليزي الأصلي للتخصص
            Text(data['description'] ?? "", style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13, height: 1.4)),
            
            // 👇 2. الترجمة الفورية لوصف التخصص إلى العربية (مستغلة المساحة الكاملة ومحاذة لليمين)
            FutureBuilder<String>(
              future: _translateFree(data['description'] ?? ""),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(color: Colors.cyanAccent, strokeWidth: 1.2),
                      ),
                    ),
                  );
                }
                final translatedSubDesc = snapshot.data ?? "";
                if (translatedSubDesc.isEmpty) return const SizedBox.shrink();

                return Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: SizedBox(
                      width: double.infinity, // يضمن أخذ العرض الكامل للكارت
                      child: Text(
                        translatedSubDesc,
                        textDirection: TextDirection.rtl, // اتجاه القراءة من اليمين
                        textAlign: TextAlign.right,       // محاذاة السطور لليمين
                        style: TextStyle(
                          color: isSelected ? Colors.cyanAccent.withOpacity(0.7) : Colors.cyanAccent.withOpacity(0.4), // يتفاعل مع اختيار الكارت
                          fontSize: 12.5,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
            
            // عرض اللغات كـ Clickable Chips (بدون تغيير أي منطق فيها)
            if (isSelected && data['languages'] != null) ...[
              const SizedBox(height: 20),
              const Text("Select tools to focus on:", style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: (data['languages'] as List).map((langItem) {
                  final Map<String, dynamic> langMap = Map<String, dynamic>.from(langItem);
                  final String langName = langMap['name'].toString(); 
                  
                  final bool isLangSelected = selectedLanguageNames.contains(langName);
                  
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isLangSelected) {
                          selectedLanguageNames.remove(langName);
                        } else {
                          selectedLanguageNames.add(langName);
                        }
                      });
                    },
                    child: _buildModernChip(
                      langName, 
                      isLanguage: true, 
                      isSelected: isLangSelected
                    ),
                  );
                }).toList(),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildModernChip(String label, {bool isLanguage = false, bool isSelected = false}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: isSelected 
            ? Colors.cyanAccent 
            : (isLanguage ? Colors.cyanAccent.withOpacity(0.1) : Colors.white.withOpacity(0.05)),
        borderRadius: BorderRadius.circular(10),
        border: isLanguage ? Border.all(color: Colors.cyanAccent.withOpacity(0.5)) : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.black : (isLanguage ? Colors.cyanAccent : Colors.white70),
          fontSize: 11, 
          fontWeight: FontWeight.bold
        ),
      ),
    );
  }

  Widget _buildNeonButton(String title, String desc, List skills, List subFields) {
    bool hasSubFields = subFields.isNotEmpty;
    bool readyToGenerate = !hasSubFields || selectedSubFieldIndex != -1;

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: ElevatedButton(
        
          // داخل onPressed الخاص بالزر
onPressed: readyToGenerate ? () {
  String finalCareerName = title;
  // أرسل اللغات المختارة من الـ Set التي قمنا بتعريفها
  List<String> chosenLangs = selectedLanguageNames.toList();

  if (selectedSubFieldIndex != -1) {
    finalCareerName = subFields[selectedSubFieldIndex]['name'];
    // إذا لم يختار المستخدم لغات يدوياً، نرسل كل لغات التخصص كافتراضية
    if (chosenLangs.isEmpty && subFields[selectedSubFieldIndex]['languages'] != null) {
      chosenLangs = (subFields[selectedSubFieldIndex]['languages'] as List)
          .map((e) => e['name'].toString())
          .toList();
    }
  }

  Navigator.push(context, MaterialPageRoute(builder: (context) => CareerResultScreen(
    recommendedField: finalCareerName, 
    careerDescription: desc, 
    userSummary: widget.userSummary,
    confidence: 0.95, 
    roadmap: const [], 
    subFields: subFields,
    // ملاحظة: تأكد أن CareerResultScreen تستقبل باراميتر اللغات إذا كنت ستستخدمه في الطلب
  )));
}

 : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: readyToGenerate ? Colors.cyanAccent : Colors.white10,
            foregroundColor: Colors.black,
            minimumSize: const Size(double.infinity, 65),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            elevation: 0,
          ),
          child: Text(
            !readyToGenerate ? "PICK A SPECIALIZATION FIRST" : "GENERATE MY ROADMAP",
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 1),
          ),
        ),
      ),
    );
  }
  // الـ Widgets المساعدة
  Widget _buildBackgroundDecoration() => Positioned(top: -50, right: -50, child: Container(width: 250, height: 250, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.cyanAccent.withOpacity(0.03))));
 
 
 
  Widget _buildAppBar() => SliverAppBar(backgroundColor: Colors.transparent, pinned: true, leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20), onPressed: () => Navigator.pop(context)));
  
  
  
  Widget _buildHeader(String title) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 1.2)), const SizedBox(height: 8), Container(width: 50, height: 4, decoration: BoxDecoration(color: Colors.cyanAccent, borderRadius: BorderRadius.circular(10)))]);
  
  
  Widget _buildSectionTitle
  (String text) => 
  Padding(padding: const EdgeInsets.only(bottom: 15, top: 10), 
  child: Text(text, style:
   const TextStyle(color: Colors.cyanAccent,
    fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5)));
  
  
  Widget _buildGlassCard({required Widget child}) => Container(width: double.infinity, padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.white.withOpacity(0.08))), child: child);
  
  
  Widget _buildEgyptBadge() => Container(margin: const EdgeInsets.only(bottom: 15), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: Colors.orangeAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.orangeAccent.withOpacity(0.2))), child: const Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.local_fire_department, color: Colors.orangeAccent, size: 14), SizedBox(width: 5), Text("HIGH DEMAND IN EGYPT", style: TextStyle(color: Colors.orangeAccent, fontSize: 10, fontWeight: FontWeight.bold))]));
 
 
  Widget _buildErrorState() => Scaffold(backgroundColor: const Color(0xFF0F172A), body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.search_off, color: Colors.white24, size: 50), const SizedBox(height: 10), Text("Career details not found", style: TextStyle(color: Colors.white.withOpacity(0.3)))])));
}