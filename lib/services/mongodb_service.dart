import 'package:flutter/foundation.dart';
import 'package:mongo_dart/mongo_dart.dart';

import '../models/threat.dart';

class MongoDBService {
  static const String _connectionString = 'mongodb+srv://webdb:Hacked_22@mongodb.sgpezuw.mongodb.net/';
  static const String _databaseName = 'antivirus_app';
  static const String _threatsCollection = 'threats';
  static const String _knownThreatsCollection = 'known_threats';
  
  Db? _db;
  DbCollection? _threatsCol;
  DbCollection? _knownThreatsCol;
  
  bool get isConnected => _db != null && _db!.isConnected;
  
  Future<void> connect() async {
    try {
      debugPrint('MongoDB bağlantısı başlatılıyor...');
      
      _db = await Db.create(_connectionString);
      await _db!.open();
      
      _db!.databaseName = _databaseName;
      _threatsCol = _db!.collection(_threatsCollection);
      _knownThreatsCol = _db!.collection(_knownThreatsCollection);
      
      debugPrint('MongoDB bağlantısı başarılı');
    } catch (e) {
      debugPrint('MongoDB bağlantısı başarısız: $e');
      _db = null;
      rethrow;
    }
  }
  
  Future<void> close() async {
    if (_db != null && _db!.isConnected) {
      await _db!.close();
    }
  }
  
  // Tehditleri al
  Future<List<Threat>> getKnownThreats() async {
    if (!isConnected) {
      throw Exception('MongoDB bağlantısı yok');
    }
    
    try {
      final threats = await _knownThreatsCol!.find().toList();
      return threats.map((doc) => Threat.fromJson(Map<String, dynamic>.from(doc))).toList();
    } catch (e) {
      debugPrint('Tehditler alınırken hata: $e');
      return [];
    }
  }
  
  // Tehdit kaydet
  Future<void> saveThreat(Threat threat) async {
    if (!isConnected) {
      throw Exception('MongoDB bağlantısı yok');
    }
    
    try {
      await _threatsCol!.insert(threat.toJson());
    } catch (e) {
      debugPrint('Tehdit kaydedilirken hata: $e');
      rethrow;
    }
  }
  
  // Tehdit durumunu güncelle
  Future<void> updateThreatStatus(Threat threat) async {
    if (!isConnected) {
      throw Exception('MongoDB bağlantısı yok');
    }
    
    try {
      await _threatsCol!.update(
        where.eq('id', threat.id),
        {
          r'$set': {
            'status': threat.status.toString().split('.').last,
          }
        },
      );
    } catch (e) {
      debugPrint('Tehdit durumu güncellenirken hata: $e');
      rethrow;
    }
  }
  
  // Tehdit sil
  Future<void> deleteThreat(String id) async {
    if (!isConnected) {
      throw Exception('MongoDB bağlantısı yok');
    }
    
    try {
      await _threatsCol!.remove(where.eq('id', id));
    } catch (e) {
      debugPrint('Tehdit silinirken hata: $e');
      rethrow;
    }
  }
  
  // Tehdit ekle (bilinen zararlı yazılım)
  Future<void> addKnownThreat(Threat threat) async {
    if (!isConnected) {
      throw Exception('MongoDB bağlantısı yok');
    }
    
    try {
      await _knownThreatsCol!.insert(threat.toJson());
    } catch (e) {
      debugPrint('Bilinen tehdit eklenirken hata: $e');
      rethrow;
    }
  }
}