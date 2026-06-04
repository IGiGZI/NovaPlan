import 'package:flutter/material.dart';
import 'onboarding_screen.dart';


    main() {  
  runApp( const MyApp());}
class MyApp extends StatelessWidget {
  const MyApp({super.key});
  static const Color backgroundColor = Color(0xFF1E1E2F);
  static const Color cardColor = Color(0xFF2A2A40);
  static const Color primaryColor = Colors.deepPurple;
  @override
  Widget build(BuildContext context) {
    final baseTheme = ThemeData.dark();
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'NovaPlan',
      theme: baseTheme.copyWith(
        scaffoldBackgroundColor: backgroundColor,
        primaryColor: primaryColor,
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryColor,
          centerTitle: true,       ),
        drawerTheme: const DrawerThemeData(
          backgroundColor: backgroundColor,    ),
        cardTheme: CardThemeData(
  color: cardColor,
  shape: RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(14), ),),
        textTheme: baseTheme.textTheme.apply(
          bodyColor: Colors.white,
          displayColor: Colors.white,        ),),
      home: const OnboardingScreen(),);}}