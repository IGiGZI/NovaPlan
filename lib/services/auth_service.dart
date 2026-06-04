import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../config.dart';

class AuthService {
  // 1. تسجيل حساب جديد (Port 5000)
  static Future<Map<String, dynamic>> signup(String username, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(Config.signup),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"username": username, "email": email, "password": password}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {"message": "Server Error: $e"};
    }
  }
// جلب الرود ماب (Port 5000)
 // تأكد أن دالة getSavedRoadmaps بترجع الـ progress مع الـ content
static Future<List<dynamic>> getSavedRoadmaps(String userId) async {
  final response = await http.get(Uri.parse(Config.getFavoriteRoadmaps(userId)));
  if (response.statusCode == 200) {
    List<dynamic> data = jsonDecode(response.body);
    // اختياري: ممكن هنا تعمل Sync للـ SharedPreferences بالداتا اللي راجعة
    return data; 
  }
  return [];
}
  // حفظ الرود ماب (Port 5000)
 // حفظ الرود ماب (Port 3000 أو 5000 حسب إعدادات Config)
  static Future<bool> saveRoadmap(String userId, Map<String, dynamic> roadmapData) async {
    try {
      // طباعة البيانات للتأكد منها في الـ Console أثناء التطوير
      print("Sending to Server: $roadmapData");

      final response = await http.post(
        Uri.parse(Config.saveRoadmap), 
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "userId": userId,
          "title": roadmapData['career'] ?? roadmapData['career_name'] ?? "New Roadmap",
          "content": roadmapData, // نرسل الخريطة كاملة ليتم تخزينها في الـ DB
        }),
      );

      print("Server Response Status: ${response.statusCode}");
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print("AuthService Save Error: $e");
      return false;
    }
  }
  // أضف هذه الدالة داخل كلاس AuthService في ملف auth_service.dart
 /* static Future<bool> saveRoadmap(String userId, Map<String, dynamic> roadmapData) async {
  try {
    final response = await http.post(
      Uri.parse("${Config.auth3000Base}/roadmaps/save"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "userId": userId,
        "title": roadmapData['career'] ?? roadmapData['title'],
        "content": roadmapData, // هنا بنبعت الرود ماب كاملة بكل تفاصيلها
      }),
    );
    return response.statusCode == 200;
  } catch (e) {
    return false;
  }
}
*/
  // 2. تسجيل دخول (Port 5000)
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(Config.login),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email, "password": password}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {"message": "Server Error: $e"};
    }
  }

  // 3. تحديث البيانات (Port 5000)
  static Future<Map<String, dynamic>> update(String id, String newName, {String? newPassword}) async {
    try {
      final response = await http.put(
        Uri.parse(Config.updateUrl(id)),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "username": newName,
          if (newPassword != null && newPassword.isNotEmpty) "password": newPassword,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {"message": "Update Error: $e"};
    }
  }

  // ======================================================
  //   قسم المفضلات - (Port 3000) باستخدام Config.auth3000Base
  // ======================================================

  // جلب المفضلات للمستخدم
  static Future<List<dynamic>> getFavorites(String userId) async {
    try {
      // الرابط النهائي هيكون مثلاً: http://192.168.1.110:3000/api/auth/favorites/123
      final response = await http.get(Uri.parse("${Config.auth3000Base}/favorites/$userId"));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // إضافة/حذف من المفضلات
  static Future<bool> toggleFavorite(String userId, Map<String, dynamic> career) async {
    try {
      final response = await http.post(
        Uri.parse("${Config.auth3000Base}/favorites/toggle"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "userId": userId,
          "career": career,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}