// ignore_for_file: deprecated_member_use, use_build_context_synchronously
import 'dart:convert';
import 'SubIkonwScreen.dart'; 
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'config.dart';
import 'CareerResultScreen.dart';
final Map<String, int> _careerDifficultyMap = {

  "data entry clerk": 1,
  "data entry specialist": 1,
  "customer service representative": 1,
  "customer service": 1,
  "telemarketer": 1,
  "virtual assistant": 1,
  "video game & software retail specialist": 1,
  "retail sales associate": 1,

///////////////////////////////////***************************////////////////////////////////////// */
  "technical support specialist": 2,
  "it help desk technician": 2,
  "social media manager": 2,
  "social media specialist": 2,
  "content writer": 2,
  "copywriter": 2,
  "blogger": 2,
  "seo specialist": 2,
  "digital marketer": 2,
  "digital marketing specialist": 2,
  "email marketing specialist": 2,
  ///////////////////////////////////////////////*/*/*/*////////////////////////

  "web developer": 3,
  "front-end developer": 3,
  "frontend engineer": 3,
  "ui/ux designer": 3,
  "ui ux designer": 3,
  "user experience designer": 3,
  "graphic designer": 3,
  "motion graphics designer": 3,
  "qa tester": 3,
  "quality assurance tester": 3,
  "software tester": 3,
  "it support engineer": 3,
  "network administrator": 3,
  "system administrator": 3,
  "database administrator": 3,
  "business analyst": 3,
  "project manager": 3,
  "scrum master": 3,
  //*********************************/////////// */
  "back-end developer": 4,
  "backend engineer": 4,
  "mobile app developer": 4,
  "flutter developer": 4,
  "android developer": 4,
  "ios developer": 4,
  "full-stack developer": 4,
  "fullstack engineer": 4,
  "game developer": 4,
  "unity developer": 4,
  "embedded systems engineer": 4,
  "network engineer": 4,
  "systems engineer": 4,
  "data analyst": 4,
  "bi analyst": 4,
  "devops engineer": 5,
  "cloud engineer": 5,
  "cloud architect": 5,
  "data scientist": 5,
  "data engineer": 5,
  "ai engineer": 5,
  "artificial intelligence engineer": 5,
  "machine learning engineer": 5,
  "cybersecurity specialist": 5,
  "cybersecurity engineer": 5,
  "penetration tester": 5,
  "ethical hacker": 5,
  "blockchain developer": 5,
  "software architect": 5,
////////////////////#######################################################///////////////////////////////////


  "medical data entry clerk": 1,
  "medical receptionist": 1,
  "pharmacy cashier": 1,
  "medical records technician": 2,
  "pharmacy technician": 2,
  "medical laboratory assistant": 2,
  "home health aide": 2,

//////////////////////////////////////////////////////////////////
  "dental assistant": 3,
  "optician": 3,
  "medical transcriptionist": 3,
  "health information technician": 3,
  "radiology technician": 3,
  "nutritionist": 3,
  "dietitian": 3,

////////////////////////////////////////////////////////////////
  "registered nurse": 4,
  "nurse": 4,
  "physiotherapist": 4,
  "physical therapist": 4,
  "pharmacist": 4,
  "medical laboratory scientist": 4,
  "biomedical engineer": 4,
  "healthcare administrator": 4,
/////////////////////////////////////////////////
  "general practitioner": 5,
  "physician": 5,
  "surgeon": 5,
  "dentist": 5,
  "clinical pharmacist": 5,
  "radiologist": 5,
  "cardiologist": 5,
  "biomedical scientist": 5,
//*/*/*/*/** */
//3333#################################
  "cad technician": 2,
  "draftsperson": 2,
  "engineering assistant": 2,
  "surveying technician": 2,
  "maintenance technician": 3,
  "civil engineering technician": 3,
  "mechanical engineering technician": 3,

  "civil engineer": 4,
  "mechanical engineer": 4,
  "industrial engineer": 4,
  "architectural engineer": 4,
  "architect": 4,
  "electrical engineer": 4,
  "agricultural engineer": 4,
  "environmental engineer": 4,
  "materials engineer": 4,
  "production engineer": 4,


  "mechatronics engineer": 5,
  "robotics engineer": 5,
  "aerospace engineer": 5,
  "aeronautical engineer": 5,
  "chemical engineer": 5,
  "biomedical engineer": 5,
  "nuclear engineer": 5,
  "petroleum engineer": 5,
  "renewable energy engineer": 5,
  "telecommunications engineer": 5,
  "electronics engineer": 5,











};
class IKnowScreen extends StatefulWidget {
  const IKnowScreen({super.key});

  @override
  State<IKnowScreen> createState() => _IKnowScreenState();
}

class _IKnowScreenState extends State<IKnowScreen> {
  final TextEditingController _searchController = TextEditingController();
  
  List<dynamic> categoriesList = [];
  String? selectedCategory;
  List<dynamic>? careersInSelectedCategory;
  List<dynamic>? filteredCareers; 

  bool filterPopularInEgypt = false;
  String selectedEducationLevel = "All";
  String currentSortOption = "Default";

  @override
  void initState() {
    super.initState();
    _loadLocalDataset();
  }

  void _showErrorSnackBar(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(color: Colors.white)),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),  
      ), 
    );  
  }
  void _applyFiltersAndSort() {
  if (careersInSelectedCategory == null) return;

  List<dynamic> tempGrid = List.from(careersInSelectedCategory!);

  // 1. فلترة البحث بالاسم
  String query = _searchController.text.toLowerCase();
  if (query.isNotEmpty) {
    tempGrid = tempGrid.where((career) {
      return career['career'].toString().toLowerCase().contains(query);
    }).toList();
  }

  // 2. فلترة Popular in Egypt
  if (filterPopularInEgypt) {
    tempGrid = tempGrid.where((career) => career['popular_in_egypt'] == true).toList();
  }

  // 3. الفلترة بناءً على مصفوفة الـ education داخل الـ JSON
  if (selectedEducationLevel != "All") {
    tempGrid = tempGrid.where((career) {
      final List<dynamic> eduList = career['education'] is List ? career['education'] : [];
      if (selectedEducationLevel == "Bachelor's") {
        return eduList.any((e) => e.toString().toLowerCase().contains('bachelor'));
      } else if (selectedEducationLevel == "Not Specified") {
        return eduList.isEmpty;
      } else {
        return eduList.any((e) => e.toString().toLowerCase() == selectedEducationLevel.toLowerCase());
      }
    }).toList();
  }

  // 4. الترتيب (Sort) بما فيها الأسهر والأصعب
  if (currentSortOption == "A-Z") {
    tempGrid.sort((a, b) => (a['career'] ?? "").toString().toLowerCase().compareTo((b['career'] ?? "").toString().toLowerCase()));
  } else if (currentSortOption == "Z-A") {
    tempGrid.sort((a, b) => (b['career'] ?? "").toString().toLowerCase().compareTo((a['career'] ?? "").toString().toLowerCase()));
  } else if (currentSortOption == "Most Skills") {
    tempGrid.sort((a, b) {
      int skillsA = (a['skills'] is List) ? (a['skills'] as List).length : 0;
      int skillsB = (b['skills'] is List) ? (b['skills'] as List).length : 0;
      return skillsB.compareTo(skillsA);
    });
  } else if (currentSortOption == "Easiest First") {
    // الترتيب من الأسهل للأصعب
    tempGrid.sort((a, b) {
      String nameA = (a['career'] ?? "").toString().toLowerCase();
      String nameB = (b['career'] ?? "").toString().toLowerCase();
      int diffA = _careerDifficultyMap[nameA] ?? 3; // 3 كقيمة افتراضية للمجالات غير المذكورة
      int diffB = _careerDifficultyMap[nameB] ?? 3;
      return diffA.compareTo(diffB);
    });
  } else if (currentSortOption == "Hardest First") {
    // الترتيب من الأصعب للأسهل
    tempGrid.sort((a, b) {
      String nameA = (a['career'] ?? "").toString().toLowerCase();
      String nameB = (b['career'] ?? "").toString().toLowerCase();
      int diffA = _careerDifficultyMap[nameA] ?? 3;
      int diffB = _careerDifficultyMap[nameB] ?? 3;
      return diffB.compareTo(diffA); // ترتيب تنازلي
    });
  }

  setState(() {
    filteredCareers = tempGrid;
  });
}
  Future<void> _loadLocalDataset() async {
    try {
      final String response = await rootBundle.loadString('assets/categorized_careers_by_education.json');
      final data = jsonDecode(response);
      
      if (data is List) {
        setState(() {
          categoriesList = data;
          if (categoriesList.isNotEmpty) {
            _selectCategory(categoriesList[0]['category']);
          }
        });
      }
    } catch (e) {
      _showErrorSnackBar("Failed to load local careers data.");
    }
  }
   void _selectCategory(String categoryName) {
  final catObj = categoriesList.firstWhere(
    (element) => element['category'] == categoryName, 
    orElse: () => null
  );
  
  if (catObj != null) {
    List<dynamic> extractedCareers = [];
    final paths = catObj['careers_by_learning_path'] as Map<String, dynamic>? ?? {};
    
    paths.forEach((key, value) {
      if (value is List) {
        for (var careerItem in value) {
          if (careerItem is Map<String, dynamic>) {
            // نأخذ نسخة كاملة من الماب لمنع الـ Null Pointer
            var updatedItem = Map<String, dynamic>.from(careerItem);
            
            // تأمين المسار والتعليم واللغات والمهام مباشرة من الملف دون أي تغيير في البنية
            updatedItem['learning_path'] = updatedItem['learning_path'] ?? key;
            updatedItem['education_level'] = updatedItem['education_level'] ?? updatedItem['education_min'] ?? "Not Specified";
            updatedItem['skills'] = updatedItem['skills'] ?? [];
            updatedItem['tasks'] = updatedItem['tasks'] ?? [];
            updatedItem['languages'] = updatedItem['languages'] ?? []; // الحفاظ على الحقل الأصلي كما هو بالملف
            
            extractedCareers.add(updatedItem);
          }
        }
      }
    });

    // حذف التكرار بناءً على اسم المهنة
    final seen = <String>{};
    extractedCareers = extractedCareers.where((c) => seen.add(c['career'].toString())).toList();

    setState(() {
      selectedCategory = categoryName;
      careersInSelectedCategory = extractedCareers;
      filterPopularInEgypt = false;
      selectedEducationLevel = "All";
      currentSortOption = "Default";
      _searchController.clear();
    });

    _applyFiltersAndSort();
  }
}


 /* Future<void> submitToAI(Map<String, dynamic> career, List<String> chosenLanguages) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: Colors.cyanAccent)),
    );
    try {
      final response = await http.post(
        Uri.parse('${Config.aiBase}/generate_from_title'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'career_title': career['career'],
          'user_summary': "Direct selection from catalog with selected tools: ${chosenLanguages.join(', ')}",
          'experience_level': "Beginner",
          'languages': chosenLanguages, 
        }),
      ).timeout(const Duration(seconds: 15000));

      Navigator.pop(context);

      if (response.statusCode == 200) {
        final resData = jsonDecode(response.body);
        Navigator.push(context, MaterialPageRoute(builder: (_) => CareerResultScreen(
          recommendedField: career['career'],
          confidence: 1.0,
          userSummary: "Direct Catalog Choice",
          careerDescription: career['description'] ?? "",
          roadmap: resData['roadmaps'] ?? [],
          subFields: career['sub_fields'] ?? [],
        )));
      } else {
        throw Exception("Server Error");
      }
    } catch (e) {
      Navigator.pop(context);
      _showErrorSnackBar("Failed to connect to AI server.");
    }
  }*/
  Future<void> submitToAI(Map<String, dynamic> career, List<String> chosenLanguages, bool preferPaid, String experienceLevel) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: Colors.cyanAccent)),
    );
    
    try {
      // 🎯 تحويل الأدوات المحددة إلى نص منسق ليقرأه الـ Prompt بذكاء
      String toolsText = chosenLanguages.isNotEmpty 
          ? chosenLanguages.join(', ') 
          : "None (General Roadmap)";

      // 🎯 ترجمة اختيار الميزانية لجملة صريحة يقرأها الذكاء الاصطناعي
      String paymentPref = preferPaid 
          ? "Include both FREE and PAID courses." 
          : "Strictly FREE courses ONLY. Do not recommend paid content.";

      final response = await http.post(
        Uri.parse('${Config.aiBase}/generate_from_title'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'career_title': career['career'],
          // 🔥 التحديث السحري: حقن الأدوات والميزانية مباشرة في ملخص المستخدم لفرضها على الـ AI
          'user_summary': "Direct selection from catalog. The user wants to strictly focus on these specific tools and languages: $toolsText. $paymentPref",
          // 🔥 تمرير المستوى الديناميكي اللي اليوزر اختاره (ولو default هنبعته للسيرفر يتصرف)
          'experience_level': experienceLevel == 'default' ? 'Beginner' : experienceLevel,
          'languages': chosenLanguages, 
          // ممكن نبعت متغير الدفع منفصل كمان لو الـ Python backend متبرمج يستقبله
          'prefer_paid': preferPaid, 
        }),
      ).timeout(const Duration(seconds: 15000));

      Navigator.pop(context);

      if (response.statusCode == 200) {
        final resData = jsonDecode(response.body);
        Navigator.push(context, MaterialPageRoute(builder: (_) => CareerResultScreen(
          recommendedField: career['career'],
          confidence: 1.0,
          userSummary: "Direct Catalog Choice - Level: ${experienceLevel.toUpperCase()}",
          careerDescription: career['description'] ?? "",
          roadmap: resData['roadmaps'] ?? [],
          subFields: career['sub_fields'] ?? [],
        )));
      } else {
        throw Exception("Server Error");
      }
    } catch (e) {
      Navigator.pop(context);
      _showErrorSnackBar("Failed to connect to AI server.");
    }
}
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1E),
      appBar: AppBar(
        title: const Text("EXPLORE CAREERS", style: TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          // شريط البحث والترتيب
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E2F),
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: Colors.cyanAccent.withOpacity(0.1)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white),
                      onChanged: (val) => _applyFiltersAndSort(),
                      decoration: const InputDecoration(
                        hintText: "Search fields...",
                        hintStyle: TextStyle(color: Colors.white38, fontSize: 14),
                        prefixIcon: Icon(Icons.search, color: Colors.cyanAccent, size: 20),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E2F),
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(color: Colors.cyanAccent.withOpacity(0.1)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: currentSortOption,
                      dropdownColor: const Color(0xFF1E1E2F),
                      icon: const Icon(Icons.swap_vert_rounded, color: Colors.cyanAccent, size: 20),
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      onChanged: (String? newValue) {
                        if (newValue != null) {
                          setState(() { currentSortOption = newValue; });
                          _applyFiltersAndSort();
                        }
                      },
                      items: const [
                        DropdownMenuItem(value: "Default", child: Text("Sort: Default ")),
                        DropdownMenuItem(value: "A-Z", child: Text("Sort: A-Z ")),
                        DropdownMenuItem(value: "Z-A", child: Text("Sort: Z-A ")),
                        DropdownMenuItem(value: "Easiest First", child: Text("Sort: Easiest 🟢 ")),
                        DropdownMenuItem(value: "Hardest First", child: Text("Sort: Hardest 🔴 ")), 
                        DropdownMenuItem(value: "Most Skills", child: Text("Sort: Most Skills ")),
                      ],
                    ),
                  ),
                )
              ],
            ),
          ),

          // الفلاتر العلوية
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: [
                  FilterChip(
                    label: const Text("Popular in Egypt 🇪🇬"),
                    labelStyle: TextStyle(color: filterPopularInEgypt ? Colors.black : Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    selected: filterPopularInEgypt,
                    selectedColor: Colors.cyanAccent,
                    backgroundColor: const Color(0xFF1E1E2F),
                    checkmarkColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    onSelected: (bool selected) {
                      setState(() { filterPopularInEgypt = selected; });
                      _applyFiltersAndSort();
                    },
                  ),
                  const SizedBox(width: 8),
                  _buildEducationChip("All"),
                  const SizedBox(width: 8),
                  _buildEducationChip("Bachelor's"),
                  const SizedBox(width: 8),
                  const SizedBox(width: 8),
    _buildEducationChip("Certificate"), // الفلتر الجديد هيشتغل فوراً بناءً على الكود الفوق
    const SizedBox(width: 8),
    _buildEducationChip("Associate Degree"),   // الفلتر الجديد
    const SizedBox(width: 8),
                ],
              ),
            ),
          ),

          // شريط الأقسام الأفقية
          Container(
            height: 50,
            margin: const EdgeInsets.symmetric(vertical: 10),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 15),
              itemCount: categoriesList.length,
              itemBuilder: (context, index) {
                final catName = categoriesList[index]['category'].toString();
                final isSelected = selectedCategory == catName;
                return GestureDetector(
                  onTap: () => _selectCategory(catName),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 5),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.cyanAccent.withOpacity(0.15) : Colors.transparent,
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(color: isSelected ? Colors.cyanAccent : Colors.white10),
                    ),
                    child: Center(
                      child: Text(
                        catName.toUpperCase(),
                        style: TextStyle(color: isSelected ? Colors.cyanAccent : Colors.white60, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

   // استبدل الـ Expanded اللي جواه الـ GridView بالـ Expanded ده:
Expanded(
  child: filteredCareers == null
      ? const Center(child: CircularProgressIndicator(color: Colors.cyanAccent))
      : filteredCareers!.isEmpty
          ? const Center(child: Text("No careers match your filters.", style: TextStyle(color: Colors.white38)))
          : SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Wrap(
                spacing: 10, // المسافة الأفقية بين الكروت
                runSpacing: 10, // المسافة الرأسية بين الصفوف
                children: filteredCareers!.map((career) {
                  // حساب العرض بحيث ياخد نص الشاشة بالظبط (كارتين في الصف) مع حساب المسافات
                  final double cardWidth = (MediaQuery.of(context).size.width - 42) / 2;
                  return SizedBox(
                    width: cardWidth,
                    child: _buildCareerGridCard(career),
                  );
                }).toList(),
              ),
            ),
),
        ],
      ),
    );
  }

  Widget _buildEducationChip(String label) {
    final isSelected = selectedEducationLevel == label;
    return FilterChip(
      label: Text(label),
      labelStyle: TextStyle(color: isSelected ? Colors.black : Colors.white, fontSize: 12),
      selected: isSelected,
      selectedColor: Colors.cyanAccent,
      backgroundColor: const Color(0xFF1E1E2F),
      checkmarkColor: Colors.black,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      onSelected: (bool selected) {
        setState(() { selectedEducationLevel = label; });
        _applyFiltersAndSort();
      },
    );
  }
Widget _buildCareerGridCard(Map<String, dynamic> career) {
  final bool isPopular = career['popular_in_egypt'] == true;
  final List<dynamic> skills = career['skills'] is List ? career['skills'] : [];
  final String eduLevel = career['education_level'] ?? career['education_min'] ?? "Not Specified";

  return Container(
    decoration: BoxDecoration(
      color: const Color(0xFF1E1E2F),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.cyanAccent.withOpacity(0.06)),
    ),
    child: Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(context, MaterialPageRoute(
            builder: (_) => LanguageSelectionScreen(
              careerData: career,
            onGenerateRoadmap: (chosenLanguages, preferPaid, experienceLevel) {
  submitToAI(career, chosenLanguages, preferPaid, experienceLevel);
}
            ),
          ));
        },
        child: Padding(
          padding: const EdgeInsets.all(10.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min, // يخلي الكارت ياخد أصغر حجم ممكن عمودياً
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Icon(Icons.psychology_outlined, color: Colors.cyanAccent, size: 14),
                  if (isPopular)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(color: Colors.purple.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                      child: const Text("EG 🇪🇬", style: TextStyle(color: Colors.purpleAccent, fontSize: 7, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                career['career'] ?? "Unknown Path",
                maxLines: 1, 
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11.5),
              ),
              const SizedBox(height: 6),
              
              // عرض أول مهارتين فقط كـ Mini Cards مصغرة جداً وثابتة العرض
              if (skills.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: skills.take(2).map((s) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.cyanAccent.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.cyanAccent.withOpacity(0.1)),
                      ),
                      child: Text(
                        s.toString(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.cyanAccent, fontSize: 8, fontWeight: FontWeight.w500),
                      ),
                    )).toList(),
                  ),
                ),
                
              Text(
                eduLevel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white38, fontSize: 8.5),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
}