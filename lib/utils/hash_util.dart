import 'dart:io';
import 'package:crypto/crypto.dart';
import 'dart:convert';

class HashUtil {
  /// Dosyanın SHA-256 hash değerini hesaplar
  static Future<String> calculateFileSHA256(String filePath) async {
    try {
      final file = File(filePath);
      if (await file.exists()) {
        List<int> bytes = await file.readAsBytes();
        var digest = sha256.convert(bytes);
        return digest.toString();
      }
    } catch (e) {
      // Dosyaya erişilemediğinde veya okuma hatası olduğunda
      print('Hash hesaplanırken hata: $e');
    }
    
    // Hata durumunda boş string döndür
    return '';
  }
  
  /// Verilen içeriğin SHA-256 hash değerini hesaplar
  static String calculateStringSHA256(String input) {
    var bytes = utf8.encode(input);
    var digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  /// Verilen içeriğin MD5 hash değerini hesaplar
  static String calculateStringMD5(String input) {
    var bytes = utf8.encode(input);
    var digest = md5.convert(bytes);
    return digest.toString();
  }
}