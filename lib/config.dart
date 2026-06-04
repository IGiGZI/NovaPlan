// ignore_for_file: non_constant_identifier_names

import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;
class Config {
  static const String _hostIp = '192.168.1.106'; 

  static String get host {
    if (kIsWeb) return _hostIp;
    if (Platform.isAndroid) {
      return (_hostIp == 'localhost' || _hostIp == '127.0.0.1') ? '10.0.2.2' : _hostIp;
    }
    return _hostIp;
  }

  static const String _authPort5000 = "5000";
  static const String _authPort3000 = "3000";   

  static String get roadmapBase => 'http://$host:$_authPort5000/api/roadmaps';
  static String get saveRoadmap => '$roadmapBase/save';
  static String getFavoriteRoadmaps(String userId) => '$roadmapBase/$userId';
  static String get authBase => 'http://$host:$_authPort5000/api/auth';
  static String get login => '$authBase/login';
  static String get signup => '$authBase/signup';
  
  static String get auth3000Base => 'http://$host:$_authPort3000/api/auth';
  static String updateUrl(String id) => '$authBase/update/$id';
  static String deleteUrl(String id) => '$authBase/delete/$id';
  // --------------------------------------------
  // AI BACKEND (Python - Port 8000)
  // --------------------------------------------
  static const String _aiPort = "8000";
  static String get aiBase => 'http://$host:$_aiPort';
  static String get generate => '$aiBase/generate';
  static String get health => '$aiBase/health';
  static String get generate_from_title => '$aiBase/generate_from_title';
}