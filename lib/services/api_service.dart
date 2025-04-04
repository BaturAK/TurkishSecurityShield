import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';

class ApiService {
  final String baseUrl;
  String? _token;

  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  // Token ayarla
  set token(String? token) {
    _token = token;
  }

  // GET isteği
  Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final Uri uri = Uri.parse('$baseUrl$endpoint');
      
      final response = await http.get(
        uri,
        headers: _getHeaders(),
      ).timeout(Duration(seconds: 10));
      
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // POST isteği
  Future<Map<String, dynamic>> post(String endpoint, {Map<String, dynamic>? data}) async {
    try {
      final Uri uri = Uri.parse('$baseUrl$endpoint');
      
      final response = await http.post(
        uri,
        headers: _getHeaders(),
        body: data != null ? json.encode(data) : null,
      ).timeout(Duration(seconds: 10));
      
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // PUT isteği
  Future<Map<String, dynamic>> put(String endpoint, {Map<String, dynamic>? data}) async {
    try {
      final Uri uri = Uri.parse('$baseUrl$endpoint');
      
      final response = await http.put(
        uri,
        headers: _getHeaders(),
        body: data != null ? json.encode(data) : null,
      ).timeout(Duration(seconds: 10));
      
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE isteği
  Future<Map<String, dynamic>> delete(String endpoint) async {
    try {
      final Uri uri = Uri.parse('$baseUrl$endpoint');
      
      final response = await http.delete(
        uri,
        headers: _getHeaders(),
      ).timeout(Duration(seconds: 10));
      
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // İstek başlıkları
  Map<String, String> _getHeaders() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Eğer token varsa ekle
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    
    return headers;
  }

  // Yanıt işleme
  Map<String, dynamic> _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    final responseBody = json.decode(response.body);
    
    if (statusCode >= 200 && statusCode < 300) {
      return responseBody;
    } else if (statusCode == 401) {
      throw ApiException('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
    } else if (statusCode == 404) {
      throw ApiException('İstenilen kaynak bulunamadı.');
    } else {
      final message = responseBody['message'] ?? 'Bir hata oluştu';
      throw ApiException(message);
    }
  }

  // Hata işleme
  Exception _handleError(dynamic error) {
    if (error is ApiException) {
      return error;
    } else if (error is http.ClientException) {
      return ApiException('Sunucu bağlantı hatası: ${error.message}');
    } else if (error is FormatException) {
      return ApiException('Geçersiz yanıt formatı');
    } else {
      return ApiException('Bir hata oluştu: $error');
    }
  }
}

class ApiException implements Exception {
  final String message;
  
  ApiException(this.message);
  
  @override
  String toString() => message;
}