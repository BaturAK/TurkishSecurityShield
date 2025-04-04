import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  // Anahtar sabitleri
  static const String _authTokenKey = 'auth_token';
  static const String _isPremiumKey = 'is_premium';
  static const String _premiumExpiryKey = 'premium_expiry';
  static const String _settingsKey = 'settings';
  static const String _lastScanResultKey = 'last_scan_result';
  static const String _scanHistoryKey = 'scan_history';
  static const String _userProfileKey = 'user_profile';
  
  // Authentication token
  Future<void> saveAuthToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_authTokenKey, token);
  }

  Future<String?> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_authTokenKey);
  }

  Future<void> deleteAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_authTokenKey);
  }

  // Premium status
  Future<void> savePremiumStatus(bool isPremium) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_isPremiumKey, isPremium);
  }

  Future<bool?> getPremiumStatus() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isPremiumKey);
  }

  // Premium expiry date
  Future<void> savePremiumExpiry(String expiryDate) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_premiumExpiryKey, expiryDate);
  }

  Future<String?> getPremiumExpiry() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_premiumExpiryKey);
  }

  Future<void> deletePremiumExpiry() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_premiumExpiryKey);
  }

  // App settings
  Future<void> saveSettings(Map<String, dynamic> settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_settingsKey, json.encode(settings));
  }

  Future<Map<String, dynamic>?> getSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final settingsStr = prefs.getString(_settingsKey);
    if (settingsStr == null) return null;
    
    try {
      return json.decode(settingsStr) as Map<String, dynamic>;
    } catch (e) {
      print('Settings decode error: $e');
      return null;
    }
  }

  // Last scan result
  Future<void> saveLastScanResult(Map<String, dynamic> scanResult) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastScanResultKey, json.encode(scanResult));
  }

  Future<Map<String, dynamic>?> getLastScanResult() async {
    final prefs = await SharedPreferences.getInstance();
    final scanResultStr = prefs.getString(_lastScanResultKey);
    if (scanResultStr == null) return null;
    
    try {
      return json.decode(scanResultStr) as Map<String, dynamic>;
    } catch (e) {
      print('Scan result decode error: $e');
      return null;
    }
  }

  // Scan history
  Future<void> saveScanHistory(List<Map<String, dynamic>> scanHistory) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_scanHistoryKey, json.encode(scanHistory));
  }

  Future<List<Map<String, dynamic>>?> getScanHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final scanHistoryStr = prefs.getString(_scanHistoryKey);
    if (scanHistoryStr == null) return null;
    
    try {
      final List<dynamic> decoded = json.decode(scanHistoryStr);
      return decoded.cast<Map<String, dynamic>>();
    } catch (e) {
      print('Scan history decode error: $e');
      return null;
    }
  }

  // User profile
  Future<void> saveUserProfile(Map<String, dynamic> userProfile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userProfileKey, json.encode(userProfile));
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final userProfileStr = prefs.getString(_userProfileKey);
    if (userProfileStr == null) return null;
    
    try {
      return json.decode(userProfileStr) as Map<String, dynamic>;
    } catch (e) {
      print('User profile decode error: $e');
      return null;
    }
  }

  // Clear all data
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}