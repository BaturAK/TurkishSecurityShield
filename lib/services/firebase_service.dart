import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/threat.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Koleksiyon referansları
  CollectionReference get _threatsCollection => _firestore.collection('threats');
  CollectionReference get _knownMalwareCollection => _firestore.collection('known_malware');
  
  // Bilinen zararlı yazılımları al
  Future<List<Threat>> getKnownThreats() async {
    try {
      final snapshot = await _knownMalwareCollection.get();
      return snapshot.docs
          .map((doc) => Threat.fromJson(doc.data() as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Zararlı yazılım veritabanı alınırken hata: $e');
      return [];
    }
  }
  
  // Tespit edilen tehdidi kaydet
  Future<void> saveThreat(Threat threat) async {
    try {
      await _threatsCollection.doc(threat.id).set(threat.toJson());
    } catch (e) {
      debugPrint('Tehdit kaydedilirken hata: $e');
      rethrow;
    }
  }
  
  // Tehdit durumunu güncelle
  Future<void> updateThreatStatus(Threat threat) async {
    try {
      await _threatsCollection.doc(threat.id).update({
        'status': threat.status.toString().split('.').last,
      });
    } catch (e) {
      debugPrint('Tehdit durumu güncellenirken hata: $e');
      rethrow;
    }
  }
  
  // Kullanıcının tehdit geçmişini al
  Future<List<Threat>> getUserThreats() async {
    try {
      final snapshot = await _threatsCollection
          .orderBy('detectionTime', descending: true)
          .get();
      
      return snapshot.docs
          .map((doc) => Threat.fromJson(doc.data() as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Kullanıcı tehdit geçmişi alınırken hata: $e');
      return [];
    }
  }
  
  // Tehditleri izle (gerçek zamanlı)
  Stream<List<Threat>> watchThreats() {
    return _threatsCollection
        .orderBy('detectionTime', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Threat.fromJson(doc.data() as Map<String, dynamic>))
          .toList();
    });
  }
  
  // Zararlı yazılım veritabanını güncelle
  Future<void> updateMalwareDatabase() async {
    try {
      // Burada sunucudan en güncel zararlı yazılım veritabanını alabilir
      // veya uzak yapılandırma değerlerini güncelleyebilirsiniz
      await _firestore.collection('app_config').doc('malware_database').get();
    } catch (e) {
      debugPrint('Zararlı yazılım veritabanı güncellenirken hata: $e');
      rethrow;
    }
  }
}
