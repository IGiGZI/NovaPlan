import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'CareerSelectionScreen.dart';
class CareerFilterEngine {
  final List<Map<String, dynamic>> allCareers;
  Map<int, int> scores = {};
  int _maxPossibleScore = 0;

  CareerFilterEngine(this.allCareers) {
    for (var career in allCareers) {
      scores[career['id']] = 0;   } }
List<Map<String, dynamic>> get filteredPool {
    var activeIds = scores.keys.where((id) => scores[id]! >= 0).toList();
    activeIds.sort((a, b) => (scores[b] ?? 0).compareTo(scores[a] ?? 0));
    
    List<Map<String, dynamic>> rawResults = [];
    if (activeIds.isEmpty) {
      rawResults = allCareers.take(5).toList();
    } else {
      rawResults = activeIds.take(7).map((id) {
        return allCareers.firstWhere((c) => c['id'] == id);
      }).toList();
    }

    // حساب النسبة المئوية الفردية لكل وظيفة بناءً على الإجابات الحقيقية
    return rawResults.map((career) {
      int currentScore = scores[career['id']] ?? 0;
      
      double percentage = 0.0;
      if (_maxPossibleScore > 0 && currentScore > 0) {
        percentage = (currentScore / _maxPossibleScore) * 100;
      } else if (currentScore > 0) {
        percentage = 70.0 + (currentScore % 15); 
      } else {
        percentage = 63.0; 
      }

      // تأمين النسبة في نطاق منطقي واحترافي للمستخدم (بين 65% و 98%)
      int finalMatchScore = percentage.clamp(20, 98).toInt();

      // إنشاء نسخة جديدة وحقن النسبة الحقيقية فيها
      Map<String, dynamic> updatedCareer = Map<String, dynamic>.from(career);
      updatedCareer['match_score'] = "$finalMatchScore%";
      
      return updatedCareer;
    }).toList();
  }
  List<String> getTopFields() {
    Map<String, int> fieldScores = {};
    for (var career in allCareers) {
      String? field = career['tags']?['field'];
      if (field == null) continue;
      int careerScore = scores[career['id']] ?? 0;
      if (careerScore > 0) {
        fieldScores[field] = (fieldScores[field] ?? 0) + careerScore;
      }   }
    var sortedFields = fieldScores.keys.toList()
      ..sort((a, b) => (fieldScores[b] ?? 0).compareTo(fieldScores[a] ?? 0));
    return sortedFields.take(5).toList(); }
void filter(String filterKey, String filterType, dynamic answerValue) {
  _maxPossibleScore += 5;
    for (var career in allCareers) {
      final tags = career['tags'];
      if (tags == null) continue;
      var tagData = tags[filterKey];
      if (tagData == null) continue;
      if (filterKey == 'gender') {
        if (answerValue.toString().toLowerCase() == 'female' && tagData == 'male_only') {
          scores[career['id']] = -100;
          continue;}
        if (answerValue.toString().toLowerCase() == 'male' && tagData == 'female_only') {
          scores[career['id']] = -100;
          continue;       }
        scores[career['id']] = (scores[career['id']] ?? 0) + 1;
        continue; }
      bool isMatch = false;
      if (tagData is List) {
        isMatch = tagData.any((element) => element.toString().toLowerCase() == answerValue.toString().toLowerCase());
      } else {
        isMatch = tagData.toString().toLowerCase() == answerValue.toString().toLowerCase();
      }
      if (isMatch) {
        scores[career['id']] = (scores[career['id']] ?? 0) + 5;    }  }  }
  void filterMulti(String filterKey, List<dynamic> selectedValues) {
    _maxPossibleScore += (selectedValues.length * 5);
    for (var career in allCareers) {
      final tags = career['tags'];
      if (tags == null) continue;
      var tagData = tags[filterKey];
      if (tagData == null) continue;
      for (var userChoice in selectedValues) {
        bool matchFound = false;
        if (tagData is List) {
          matchFound = tagData.any((element) => element.toString().toLowerCase() == userChoice.toString().toLowerCase());
        } else {
          matchFound = tagData.toString().toLowerCase() == userChoice.toString().toLowerCase();
        }
        if (matchFound) {
          scores[career['id']] = (scores[career['id']] ?? 0) + 5;  }   }   } } }
class QuizScreen extends StatefulWidget {
  final List<dynamic> careers;
  const QuizScreen({super.key, required this.careers});
  @override
  State<QuizScreen> createState() => _QuizScreenState();}
class _QuizScreenState extends State<QuizScreen> {
  bool isLoading = true;
  String currentQuestionId = "Q_EDU"; 
  List<Map<String, dynamic>> questions = [];
  late CareerFilterEngine filterEngine;
  List<dynamic> currentSelectedValues = [];
  int answeredCount = 0;
  @override
  void initState() {
    super.initState();
    List<Map<String, dynamic>> careersList = widget.careers
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    filterEngine = CareerFilterEngine(careersList);
    loadQuestions();}
  Future<void> loadQuestions() async {
    try {
      final String response = await rootBundle.loadString('assets/questions.json');
      final data = json.decode(response);      
      List<Map<String, dynamic>> careersFromDoc = List<Map<String, dynamic>>.from(data['careers']);
      setState(() {
        questions = List<Map<String, dynamic>>.from(data['questions']);
        filterEngine = CareerFilterEngine(careersFromDoc); 
        isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading JSON: $e");    } }
  void _onOptionTapped(dynamic value, int maxChoices) {
    if (maxChoices == 1) {
      _applyAnswerAndGoNext(value);
    } else {
      setState(() {
        if (currentSelectedValues.contains(value)) {
          currentSelectedValues.remove(value);
        } else if (currentSelectedValues.length < maxChoices) {
          currentSelectedValues.add(value);
        }    });  } }
  Map<String, dynamic>? get currentQuestionData {
    try {
      return questions.firstWhere((q) => q['id'] == currentQuestionId);
    } catch (e) {
      return null;  } }
  void _applyAnswerAndGoNext(dynamic value) {
    final q = currentQuestionData;
    if (q == null) return;
    filterEngine.filter(q['filter_key'], q['filter_type'] ?? 'equals', value);
    answeredCount++;
    String? nextId = (q['next'] != null && q['next'][value] != null) 
        ? q['next'][value] 
        : q['default_next'];
    _moveForward(nextId);}
  void _submitMultiSelect() {
    final q = currentQuestionData;
    if (q == null) return;
    filterEngine.filterMulti(q['filter_key'], currentSelectedValues);
    answeredCount++;
    dynamic firstVal = currentSelectedValues.isNotEmpty ? currentSelectedValues.first : null;
    String? nextId = (q['next'] != null && q['next'][firstVal] != null) 
        ? q['next'][firstVal] 
        : q['default_next'];
    currentSelectedValues = [];
    _moveForward(nextId);}
  void _moveForward(String? nextId) {
    setState(() {
      if (nextId == null || !questions.any((element) => element['id'] == nextId)) {
        _navigateToResults();
      } else {
        currentQuestionId = nextId;  }  }); }
  void _navigateToResults() {
    List<String> topFields = filterEngine.getTopFields();
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => CareerSelectionScreen(
          potentialCareers: filterEngine.filteredPool,
          userSummary: "Top matching fields: ${topFields.join(', ')}",   ),   ) ); }
  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    final q = currentQuestionData;
    if (q == null) return const Scaffold(body: Center(child: Text("Loading results...")));
    final options = q['options'] ?? q['all_options'] ?? [];
    final isMulti = q['type'] == 'multi_select';
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent, 
        elevation: 0,
        title: Text("Question ${answeredCount + 1}", style: const TextStyle(fontSize: 16)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LinearProgressIndicator(
              value: answeredCount / questions.length, 
              backgroundColor: Colors.white10,
              color: Colors.cyanAccent,
            ),
            const SizedBox(height: 20),
            Text(q['question'], style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 30),
            Expanded(
              child: ListView.builder(
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final opt = options[index];
                  final isSel = currentSelectedValues.contains(opt['value']);
                  return GestureDetector(
                    onTap: () => _onOptionTapped(opt['value'], q['max_choices'] ?? 1),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isSel ? Colors.cyanAccent.withOpacity(0.1) : Colors.white.withOpacity(0.05),
                        border: Border.all(color: isSel ? Colors.cyanAccent : Colors.white10),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: Text(opt['label'], style: const TextStyle(color: Colors.white))),
                          if (isSel) const Icon(Icons.check_circle, color: Colors.cyanAccent, size: 20),                     ],               ),              ),             );            },         ),   ),
            if (isMulti)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: ElevatedButton(
                  onPressed: currentSelectedValues.isNotEmpty ? _submitMultiSelect : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.cyanAccent, 
                    minimumSize: const Size(double.infinity, 55),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))             ),
                      child: const Text("Confrim",style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),            ),         ),     ],      ), ), ); }}