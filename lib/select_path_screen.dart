// ignore_for_file: deprecated_member_use
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'AuthFormScreen.dart'; 
import 'find_path_screen.dart';
import 'IKnowScreen.dart';
//import 'categoriesscreen.dart';
import 'InfoScreen.dart';
import 'UserProfileScreen.dart';
import 'FavoriteCareersScreen.dart';
const String logoImage = 'assets/images/logo.png';
final List<String> levelImages = [
  'assets/images/i-know.png',
  'assets/images/findpath.png',
];
class SelectPathScreen extends StatefulWidget {
  final List<dynamic> allRoadmaps;
  const SelectPathScreen({super.key, required this.allRoadmaps});
  @override
  SelectPathScreenState createState() => SelectPathScreenState();
}
class SelectPathScreenState extends State<SelectPathScreen>
    with SingleTickerProviderStateMixin {
  int selectedIndex = 0;
  final List<String> levels = ['I KNOW', 'FIND PATH'];
  final List<String> levelDescriptions = [
    'I already have a specific career in mind and need a roadmap to master it.',
    'I want to explore careers based on my skills and education level.'
  ];  
  late AnimationController _controller;
  late Animation<double> _fade;
  List<dynamic> categories = [];
  String userName = "Guest User"; 
  bool isLoggedIn = false;
  @override
  void initState() {
    super.initState();
    _checkUserStatus();
    _loadCategories();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
  }
  void _checkUserStatus() {
    setState(() {
      if (widget.allRoadmaps.isNotEmpty) {
        userName = "Moaz Sayed"; 
        isLoggedIn = true;
      }
    });
  }
  Future<void> _loadCategories() async {
    try {
      String data = await rootBundle.loadString('assets/categorized_careers_by_education.json');
      setState(() {
        categories = json.decode(data);
      });
    } catch (e) {
      debugPrint("Error loading categories: $e");
    }
  }
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: const Color(0xFF0F0F1E),
      child: Column(
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF1E1E2F)),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(logoImage, height: 50),
                  const SizedBox(height: 10),
                  Text(
                    userName.toUpperCase(),
                    style: const TextStyle(color: Colors.cyanAccent, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                ListTile(
                  leading: const Icon(Icons.favorite_border, color: Colors.pinkAccent),
                  title: const Text("My Favorites", style: TextStyle(color: Colors.white70, fontSize: 14)),
                  onTap: () {
                    Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoriteCareersScreen()));
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.info_outline, color: Colors.amberAccent),
                  title: const Text("About NovaPlan", style: TextStyle(color: Colors.white70, fontSize: 14)),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const InfoScreen()));
                  },
                ),
                const Divider(color: Colors.white10),
              ],
            ),
          ),
          const Divider(color: Colors.white10),
          if (isLoggedIn)
            ListTile(
              leading: const Icon(Icons.person_pin_outlined, color: Colors.cyanAccent),
              title: const Text("My Profile", style: TextStyle(color: Colors.white70)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const UserProfileScreen()));
              },
            ),
          ListTile(
            leading: Icon(isLoggedIn ? Icons.logout : Icons.login, color: isLoggedIn ? Colors.redAccent : Colors.cyanAccent),
            title: Text(isLoggedIn ? "Logout" : "Sign In", style: TextStyle(color: isLoggedIn ? Colors.redAccent : Colors.cyanAccent)),
            onTap: () {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const AuthFormScreen()),
                (route) => false,
              );
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1E),
      drawer: _buildDrawer(),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu_rounded, color: Colors.cyanAccent, size: 30),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
      ),
      body: FadeTransition(
        opacity: _fade,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF0F0F1E),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.cyanAccent.withOpacity(0.2), 
                        blurRadius: 40, 
                        spreadRadius: 2
                      )
                    ],
                  ),
                  child: Image.asset(logoImage, width: 80, height: 80),
                ),
              ),
              const SizedBox(height: 40),
              const Text("CHOOSE YOUR\nJOURNEY", 
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.2)),
              const SizedBox(height: 10),
              const Text("Select how you want to start exploring your career.", 
                style: TextStyle(color: Colors.white38, fontSize: 15)),
              const SizedBox(height: 40),
              Row(
                children: [
                  Expanded(child: _buildPathCard(0)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildPathCard(1)),
                ],
              ),
              const SizedBox(height: 30),
              _buildInfoSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPathCard(int index) {
    bool isActive = selectedIndex == index;
    return GestureDetector(
      onTap: () => setState(() => selectedIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(vertical: 30),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E2F),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? Colors.cyanAccent : Colors.white12,
            width: 2,
          ),
          boxShadow: isActive ? [
            BoxShadow(color: Colors.cyanAccent.withOpacity(0.1), blurRadius: 20)
          ] : [],
        ),
        child: Column(
          children: [
            Image.asset(levelImages[index], width: 50, height: 50, 
              color: isActive ? null : Colors.white24),
            const SizedBox(height: 15),
            Text(levels[index], 
              style: TextStyle(
                color: isActive ? Colors.cyanAccent : Colors.white38,
                fontWeight: FontWeight.bold,
                fontSize: 14,
                letterSpacing: 1.1)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E2F),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          Text(
            levelDescriptions[selectedIndex],
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, fontSize: 15, height: 1.5),
          ),
          const SizedBox(height: 30),
          SizedBox(
            width: double.infinity,
            height: 55,
            child: ElevatedButton(
              onPressed: () {
                if (selectedIndex == 0) {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const IKnowScreen()));
                } else {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const FindPathScreen()));
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.cyanAccent,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                elevation: 10,
                shadowColor: Colors.cyanAccent.withOpacity(0.3),
              ),
              child: const Text("CONTINUE", 
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.5)),
            ),
          ),
        ],
      ),
    );
  }
}

