// lib/find_path_screen.dart

import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'QuizScreen.dart';

class FindPathScreen extends StatefulWidget {
  const FindPathScreen({super.key});

  @override
  FindPathScreenState createState() => FindPathScreenState();
}

class FindPathScreenState extends State<FindPathScreen> {
  List<Map<String, dynamic>> careers = [];

  @override
  void initState() {
    super.initState();
    loadCareers();
  }

  Future<void> loadCareers() async {
    final jsonString =
        await rootBundle.loadString('assets/questions.json');

    final Map<String, dynamic> jsonData =
        json.decode(jsonString);

    final List<dynamic> careersList =
        jsonData['careers'];

    setState(() {
      careers = careersList
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (careers.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black87,
        body: Center(
          child: CircularProgressIndicator(
              color: Colors.deepPurple),
        ),
      );
    }

    return const QuizScreen(careers: [],);
  }
}