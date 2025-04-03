import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // API taban URL'i
  final String _baseUrl = 'https://api.example.com'; // Gerçek API URL'inizle değiştirin
  String? _token;

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Token'ı yükle
  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  // Token'ı kaydet
  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    _token = token;
  }

  // Token'ı temizle (çıkış yapma)
  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    _token = null;
  }

  // Kullanıcı oturum açma
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['token'] != null) {
        await saveToken(data['token']);
      }
      return data;
    } else {
      throw Exception('Giriş başarısız: ${response.body}');
    }
  }

  // Kullanıcı profil bilgilerini getir
  Future<Map<String, dynamic>> getUserProfile() async {
    await loadToken();
    
    if (_token == null) {
      throw Exception('Oturum açmanız gerekiyor');
    }

    final response = await http.get(
      Uri.parse('$_baseUrl/api/users/profile'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Profil bilgileri alınamadı: ${response.body}');
    }
  }

  // Tarama başlat
  Future<Map<String, dynamic>> startScan(String scanType) async {
    await loadToken();
    
    final response = await http.post(
      Uri.parse('$_baseUrl/api/scans/start'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': _token != null ? 'Bearer $_token' : '',
      },
      body: jsonEncode({
        'type': scanType,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Tarama başlatılamadı: ${response.body}');
    }
  }

  // Tarama durumunu kontrol et
  Future<Map<String, dynamic>> getScanStatus(String scanId) async {
    await loadToken();
    
    final response = await http.get(
      Uri.parse('$_baseUrl/api/scans/$scanId/status'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': _token != null ? 'Bearer $_token' : '',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Tarama durumu alınamadı: ${response.body}');
    }
  }

  // Tarama sonuçlarını getir
  Future<Map<String, dynamic>> getScanResults(String scanId) async {
    await loadToken();
    
    final response = await http.get(
      Uri.parse('$_baseUrl/api/scans/$scanId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': _token != null ? 'Bearer $_token' : '',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Tarama sonuçları alınamadı: ${response.body}');
    }
  }

  // Tehdidi temizle
  Future<Map<String, dynamic>> cleanThreat(String threatId) async {
    await loadToken();
    
    if (_token == null) {
      throw Exception('Oturum açmanız gerekiyor');
    }

    final response = await http.post(
      Uri.parse('$_baseUrl/api/threats/$threatId/clean'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Tehdit temizlenemedi: ${response.body}');
    }
  }

  // Kullanıcı taramalarını getir
  Future<List<dynamic>> getUserScans() async {
    await loadToken();
    
    if (_token == null) {
      throw Exception('Oturum açmanız gerekiyor');
    }

    final response = await http.get(
      Uri.parse('$_baseUrl/api/scans'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['scans'] ?? [];
    } else {
      throw Exception('Tarama geçmişi alınamadı: ${response.body}');
    }
  }

  // Premium kod doğrulama
  Future<Map<String, dynamic>> verifyPremiumCode(String code) async {
    await loadToken();
    
    if (_token == null) {
      throw Exception('Oturum açmanız gerekiyor');
    }

    final response = await http.post(
      Uri.parse('$_baseUrl/api/premium/verify'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: jsonEncode({
        'code': code,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Premium kod doğrulanamadı: ${response.body}');
    }
  }
}