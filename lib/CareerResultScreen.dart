// ignore_for_file: deprecated_member_use, use_build_context_synchronously
import 'package:career_path_app/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';
import 'StepDetailScreen.dart'; 
import 'career_result_screen2.dart';
import 'config.dart';
class CareerResultScreen extends StatefulWidget {
  final String recommendedField;
  final double confidence;
  final List<dynamic> subFields; // التأكد من وجود هذا السطر
  final List<dynamic> roadmap;
  final String userSummary;
  final String careerDescription; // تأكد من وجود هذا السطر
  final List<dynamic> potentialCareers; // وهذا السطر
  const CareerResultScreen({
    super.key,
    required this.recommendedField,
    required this.confidence,
    this.subFields = const [], // القيمة الافتراضية للـ subFields
    required this.roadmap,
    required this.userSummary,
    this.careerDescription = "", // قيمة افتراضية
    this.potentialCareers = const [], });
  @override
  State<CareerResultScreen> createState() => _CareerResultScreenState();}
class _CareerResultScreenState extends State<CareerResultScreen> {
  final levels = ["Beginner", "Intermediate", "Pro"];
  int selectedLevelIndex = 0;
  Map<String, dynamic>? selectedSpecialization;
  late List<dynamic> currentRoadmap;
  late String currentTitle;
  late String currentDescription;
  late List<dynamic> currentSubFields;
  final TextEditingController _summaryController = TextEditingController();
  String? _errorMessage;
  bool _isGenerating = false;
final Map<String, List<dynamic>> _roadmapsCache = {};
 // Map<String, dynamic>? _newResult;
  @override
void initState() {
  super.initState();
  currentTitle = widget.recommendedField;
  currentDescription = widget.careerDescription;
  currentRoadmap = widget.roadmap;
  currentSubFields = widget.subFields;
    WidgetsBinding.instance.addPostFrameCallback((_) {
    _fetchRoadmapFromServer();  });}
Future<void> _fetchRoadmapFromServer() async {
  final String selectedLevel = levels[selectedLevelIndex].toLowerCase();  
  if (_roadmapsCache.containsKey(selectedLevel)) {
    setState(() {
      currentRoadmap = _roadmapsCache[selectedLevel]!;
      _isGenerating = false;
      _errorMessage = null; 
    });
    return;  }
  setState(() { 
    _isGenerating = true; 
    _errorMessage = null; 
  });
  try {
    final response = await http.post(
      Uri.parse('${Config.aiBase}/generate_from_title'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'career_title': currentTitle,
        'user_summary': widget.userSummary,
        'experience_level': selectedLevel,
      }),
    ).timeout(const Duration(seconds: 3000));
    if (response.statusCode == 200) { 
      final data = jsonDecode(response.body);
      final newRoadmap = List.from(data['roadmaps'] ?? []);      
      setState(() {
        currentRoadmap = newRoadmap;
        _roadmapsCache[selectedLevel] = newRoadmap;
        _isGenerating = false;
      });
    } else {
      setState(() {
        _isGenerating = false;
        _errorMessage = "Server returned error: ${response.statusCode}";
      });
    }
  } catch (e) {
    setState(() { 
      _isGenerating = false; 
      _errorMessage = "Connection failed. Please check if the server is running."; 
    });
  }
}
  
 // 2. تحديث دالة الحفظ لتدعم الحفظ المحلي (Offline) فوراً وبأعلى كفاءة
Future<void> _saveRoadmap() async {
  if (currentRoadmap.isEmpty) {
     _showError("No roadmap data to save yet!");
     return;
  }
  
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => const Center(child: CircularProgressIndicator(color: Colors.cyanAccent)),
  );
  
  try {
    final prefs = await SharedPreferences.getInstance();
    String userId = prefs.getString('user_id') ?? "guest_user";
    
    // تجهيز البيانات بالـ Keys الموحدة المتوافقة مع شاشة الـ Favorites
    Map<String, dynamic> dataToSave = {
      "userId": userId,
      "career": currentTitle,
      "description": currentDescription,
      "roadmaps": currentRoadmap,
      "confidence": widget.confidence,
      "subFields": currentSubFields,
      "created_at": DateTime.now().toIso8601String(),
    };
    
    String jsonStr = jsonEncode(dataToSave);
    
    // الحفظ المحلي الفوري (أوفلاين) على الجهاز
    String localKey = 'roadmap_${currentTitle.toLowerCase().replaceAll(' ', '_')}';
    await prefs.setString(localKey, jsonStr);
    
    // محاولة الحفظ في الكلاود (سيرفر Node) إذا كان متاحاً
    bool cloudSuccess = false;
    try {
      cloudSuccess = await AuthService.saveRoadmap(userId, dataToSave);
    } catch (cloudError) {
      debugPrint("Cloud backup failed, kept offline: $cloudError");
    }

    if (mounted) Navigator.pop(context); // إغلاق الـ Dialog
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(cloudSuccess 
              ? "Saved Offline & Synced with Cloud!" 
              : "Saved Locally on Device (Offline Mode)"),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  } catch (e) {
    if (mounted) Navigator.pop(context);
    _showError("Save failed: $e");   
  }  
}

  List<dynamic> get filteredRoadmap {
  return currentRoadmap;    }
  @override
Widget build(BuildContext context) {
  if (currentRoadmap.isEmpty && widget.potentialCareers.isNotEmpty) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text("Select Your Path", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _buildWebStyleSelectionList(),    );  }
  return Scaffold(
    backgroundColor: const Color(0xFF0F172A),
    appBar: AppBar(
      title: const Text("Career AI Guide", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18)),
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
    ),
    body: CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: _isGenerating
                ? _buildLoadingSkeleton()
                : _errorMessage != null 
                  ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent)))
                  : currentRoadmap.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(50),
                        child: Center(child: Text("No steps available.", style: TextStyle(color: Colors.white38))),
                      )
                    : Column(
                        children: currentRoadmap.map((path) {
                          final steps = List.from(path["steps"] ?? []);
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 15),
                                child: Text((path["path_title"] ?? "PHASE").toUpperCase(),
                                  style: const TextStyle(color: Colors.cyanAccent, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                              ),
                              ...steps.asMap().entries.map((entry) => _buildStepTile(entry.value, entry.key)),                       ],                       );             }).toList(),               ),       ),    ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: ElevatedButton.icon(
              onPressed: _saveRoadmap,
              icon: const Icon(Icons.bookmark_add_outlined),
              label: const Text("SAVE ROADMAP TO MY ACCOUNT"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.cyanAccent,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),         ),       ),      ),   ),
        SliverToBoxAdapter(child: _buildSuggestionButton()),
      //  SliverPadding(
        //  padding: const EdgeInsets.all(20),
        //  sliver: SliverToBoxAdapter(child: _buildWebStyleInputSection()),    ),
        //if (_newResult != null)
          //SliverPadding(
            //padding: const EdgeInsets.symmetric(horizontal: 20),
           // sliver: SliverToBoxAdapter(child: _buildWebStyleResultCard()),   ),
        const SliverToBoxAdapter(child: SizedBox(height: 50)),    ], ),);}
Future<void> _fetchRoadmapForCareer(String careerName) async {
  setState(() => _isGenerating = true);
    try {
    final response = await http.post(
      Uri.parse('${Config.roadmapBase}/generate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'career_name': careerName,
        'user_summary': widget.userSummary,    }), );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      setState(() {
        currentRoadmap = data['roadmap'];
        currentTitle = careerName;
        _isGenerating = false;     });  }
  } catch (e) {
    setState(() {
      _isGenerating = false;
      _errorMessage = "Failed to load roadmap. Please try again.";   }); }}
 /* Widget _buildWebStyleInputSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Not satisfied? Refine with AI", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 15),
          TextField(
            controller: _summaryController,
            maxLines: 3,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: "E.g. 'I want to focus more on mobile development' or 'Make it shorter'",
              hintStyle: const TextStyle(color: Colors.white24),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),         ),          ),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: _isGenerating ? null : _handleWebStyleSubmit,
              style: TextButton.styleFrom(backgroundColor: Colors.indigoAccent, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 12)),
              child: _isGenerating ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Regenerate Plan"),      ),       ),     ],   ), );}
  */
 /* Widget _buildWebStyleResultCard() {
    final suggested = _newResult!['chosen_career'].toString();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.purple.withOpacity(0.2), Colors.blue.withOpacity(0.2)]),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text("AI SUGGESTION", style: TextStyle(color: Colors.purpleAccent, fontSize: 10, fontWeight: FontWeight.bold)),
            Text(suggested, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          ])),
          IconButton.filled(
            onPressed: () => _navigateToNewResult(suggested, 0.95),
            icon: const Icon(Icons.arrow_forward),
            style: IconButton.styleFrom(backgroundColor: Colors.purpleAccent),      ),      ],     ),   );  }*/
            /*
  Future<void> _handleWebStyleSubmit() async {
    if (_summaryController.text.isEmpty) return;
    setState(() { _isGenerating = true; _newResult = null; });
    try {
      final response = await http.post(Uri.parse('${Config.aiBase}/nlp_suggest'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'user_summary': _summaryController.text}));   
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _isGenerating = false;
          if (data['suggestions'] != null && data['suggestions'].isNotEmpty) {
            _newResult = {'chosen_career': data['suggestions'][0]['career']};         }      });     }
    } catch (e) { setState(() { _isGenerating = false; }); _showError("Connection failed"); }  }
    */
  void _navigateToNewResult(String careerName, double confidence) {
     Navigator.push(context, MaterialPageRoute(builder: (context) => CareerResultScreen2(
      recommendedField: careerName,
      confidence: confidence,
      userSummary: _summaryController.text.isNotEmpty ? _summaryController.text : widget.userSummary,   ))); }
Widget _buildStepTile(dynamic step, int index) {
  String stepTitle = "Step ${index + 1}";
  try {
    if (step != null && step["milestones"] != null) {
      var milestones = step["milestones"];      
      if (milestones is List && milestones.isNotEmpty) {
        final Map<String, dynamic> firstMilestone = Map<String, dynamic>.from(milestones[0]);
        stepTitle = firstMilestone["title"]?.toString() ?? stepTitle;
      } else if (milestones is String) {
        stepTitle = milestones;    } }
  } catch (e) {
    debugPrint("Error parsing step: $e");
  }
  return Container(
    margin: const EdgeInsets.only(bottom: 15),
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.cyanAccent.withOpacity(0.2)),
    ),
    child: ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      leading: CircleAvatar(
        backgroundColor: Colors.cyanAccent.withOpacity(0.1),
        child: Text("${index + 1}", style: const TextStyle(color: Colors.cyanAccent)),
      ),
      title: Text(
        stepTitle,
        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
      ),
      subtitle: const Text("View tasks and resources", style: TextStyle(color: Colors.white38, fontSize: 12)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.cyanAccent),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StepDetailsScreen(step: step, careerName: currentTitle))), ),  );}
 /* Widget _buildLevelPicker() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      height: 45,
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: List.generate(levels.length, (index) {
          bool isSelected = selectedLevelIndex == index;
          return Expanded(
            child: GestureDetector(
             onTap: () {
         setState(() {
          selectedLevelIndex = index;
          _isGenerating = true;        });
            _fetchRoadmapFromServer();          },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 2000),
                margin: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: isSelected ? Colors.cyanAccent : Colors.transparent, borderRadius: BorderRadius.circular(8)),
                child: Center(child: Text(levels[index], style: TextStyle(color: isSelected ? Colors.black : Colors.white60, fontWeight: FontWeight.bold, fontSize: 12))),          ),       ), );      }),  ), ); }*/
  /*Widget _buildSpecializations() {
    if (currentSubFields.isEmpty) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: currentSubFields.map((sub) {
            final isSelected = selectedSpecialization == sub;
            return GestureDetector(
                 onTap: () {
  setState(() => selectedSpecialization = sub);
  _fetchRoadmapFromServer(); },
              child: Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.cyanAccent.withOpacity(0.1) : const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isSelected ? Colors.cyanAccent : Colors.white10),               ),
                child: Text(sub['name'], style: TextStyle(color: isSelected ? Colors.cyanAccent : Colors.white60, fontWeight: FontWeight.bold, fontSize: 12)),              ),            ); }).toList(),   ), ),);  }*/
Widget _buildHeader() {
  return Padding(
    padding: const EdgeInsets.all(20.0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          currentTitle.toUpperCase(),
          style: const TextStyle(
            color: Colors.cyanAccent,
            fontSize: 24,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2       ),      ),
        const SizedBox(height: 8),
        Text(
          currentDescription,
          style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14),     ),    ],    ), );}
Widget _buildWebStyleSelectionList() {
  return ListView.builder(
    padding: const EdgeInsets.all(20),
    itemCount: widget.potentialCareers.length,
    itemBuilder: (context, index) {
      final item = widget.potentialCareers[index];
      return GestureDetector(
        onTap: () => _fetchRoadmapForCareer(item['career']),
        child: Container(
          margin: const EdgeInsets.only(bottom: 15),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.cyanAccent.withOpacity(0.2)),     ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['career'] ?? "", 
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    Text(item['category'] ?? "", 
                      style: TextStyle(color: Colors.cyanAccent.withOpacity(0.6), fontSize: 13)),          ],              ),      ),
              const Icon(Icons.arrow_forward_ios, color: Colors.cyanAccent, size: 16),       ],    ),    ),    ); },  );}
              // أضف هذه الدالة داخل الـ Widget لبناء هيكل تحميل "نيون"
Widget _buildLoadingSkeleton() {
  return Column(
    children: List.generate(4, (index) => Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.cyanAccent.withOpacity(0.05)),
      ),
      child: Shimmer.fromColors(
        baseColor: Colors.white10,
        highlightColor: Colors.cyanAccent.withOpacity(0.1),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(width: 150, height: 12, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10))),
            const SizedBox(height: 15),
            Container(width: double.infinity, height: 60, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15))),     ],    ),  ),  )), );}
  Widget _buildSuggestionButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: OutlinedButton(
        onPressed: _suggestAnotherCareer,
        style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.pinkAccent), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
        child: const Text("Suggest Alternative Careers", style: TextStyle(color: Colors.pinkAccent)), ) );}
  Future<void> _suggestAnotherCareer() async {
    showDialog(context: context, builder: (context) => const Center(child: CircularProgressIndicator()));
    try {
      final response = await http.post(Uri.parse('${Config.aiBase}/nlp_suggest'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'user_summary': widget.userSummary}));
      Navigator.pop(context);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _showSuggestionsPicker(data['suggestions'] ?? []); }
    } catch (e) { Navigator.pop(context); _showError("Server busy"); } }
  void _showSuggestionsPicker(List suggestions) {
    showModalBottomSheet(context: context, backgroundColor: const Color(0xFF1E293B), shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => ListView.builder(
        itemCount: suggestions.length,
        itemBuilder: (context, i) => ListTile(
          leading: const Icon(Icons.auto_awesome, color: Colors.cyanAccent, size: 18),
          title: Text(suggestions[i]['career'], style: const TextStyle(color: Colors.white)),
          subtitle: Text("Similarity: ${(suggestions[i]['score'] * 100).toInt()}%", style: const TextStyle(color: Colors.white38)),
          onTap: () { Navigator.pop(context); _navigateToNewResult(suggestions[i]['career'], suggestions[i]['score']); },   ))); }
  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.redAccent)); 
    
     }}