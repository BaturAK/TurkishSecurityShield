import 'dart:io';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';

class HashUtil {
  // Dosya SHA256 hash değerini hesapla
  static Future<String> calculateFileSHA256(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return '';
      }
      
      // Dosya boyutu çok büyükse parça parça işleyelim
      final fileLength = await file.length();
      if (fileLength > 10 * 1024 * 1024) { // 10MB'dan büyükse
        return await _calculateLargeFileSHA256(file);
      }
      
      final bytes = await file.readAsBytes();
      return _calculateSHA256FromBytes(bytes);
    } catch (e) {
      debugPrint('Hash hesaplanırken hata: $e');
      return '';
    }
  }
  
  // Büyük dosyalar için hash hesapla
  static Future<String> _calculateLargeFileSHA256(File file) async {
    try {
      final output = AccumulatorSink<Digest>();
      final input = sha256.startChunkedConversion(output);
      
      final stream = file.openRead();
      await for (var chunk in stream) {
        input.add(chunk);
      }
      
      input.close();
      final hash = output.events.single;
      return hash.toString();
    } catch (e) {
      debugPrint('Büyük dosya hash hesaplanırken hata: $e');
      return '';
    }
  }
  
  // Bayt dizisinden SHA256 hash değeri hesapla
  static String _calculateSHA256FromBytes(Uint8List bytes) {
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  // String'in SHA256 hash değerini hesapla
  static String calculateStringSHA256(String input) {
    final bytes = input.codeUnits;
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  // Girilen metni SHA256 ile hash'le ve ilk 8 karakterini döndür
  static String shortHash(String input) {
    final hash = calculateStringSHA256(input);
    return hash.substring(0, 8);
  }
}
