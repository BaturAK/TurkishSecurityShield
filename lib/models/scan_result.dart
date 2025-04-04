import 'dart:convert';
import 'package:intl/intl.dart';
import 'threat.dart';

class ScanResult {
  final String id;
  final String type;
  final DateTime startTime;
  DateTime? endTime;
  int totalScanned;
  List<Threat> threatsFound;
  String? userId;
  double progress; // Yüzde olarak ilerleme durumu

  ScanResult({
    required this.id,
    required this.type,
    required this.startTime,
    this.endTime,
    this.totalScanned = 0,
    this.threatsFound = const [],
    this.userId,
    this.progress = 0,
  });

  // Tarama süresi (saniye cinsinden)
  int get duration {
    if (endTime == null) {
      // Eğer tarama hala devam ediyorsa şu ana kadar geçen süreyi hesapla
      return DateTime.now().difference(startTime).inSeconds;
    }
    // Tarama tamamlanmışsa başlangıç ve bitiş arası süreyi hesapla
    return endTime!.difference(startTime).inSeconds;
  }

  // Tarama durumu
  String get status {
    if (endTime == null) {
      return 'RUNNING';
    }
    return threatsFound.isEmpty ? 'COMPLETED' : 'WARNING';
  }

  // JSON'dan nesne oluşturma
  factory ScanResult.fromJson(Map<String, dynamic> json) {
    // Tehdit listesini oluştur
    List<Threat> threats = [];
    if (json['threatsFound'] != null) {
      threats = (json['threatsFound'] as List)
          .map((threatJson) => Threat.fromJson(threatJson))
          .toList();
    }

    // Tarih ve saat formatını parse et
    final dateFormat = DateFormat("yyyy-MM-ddTHH:mm:ss");
    DateTime? endTime;
    
    if (json['endTime'] != null && json['endTime'] != '') {
      endTime = dateFormat.parse(json['endTime']);
    }

    return ScanResult(
      id: json['_id'] ?? json['id'],
      type: json['type'],
      startTime: dateFormat.parse(json['startTime']),
      endTime: endTime,
      totalScanned: json['totalScanned'] ?? 0,
      threatsFound: threats,
      userId: json['userId'],
      progress: (json['progress'] ?? 0).toDouble(),
    );
  }

  // JSON'a dönüştürme
  Map<String, dynamic> toJson() {
    final dateFormat = DateFormat("yyyy-MM-ddTHH:mm:ss");
    
    return {
      'id': id,
      'type': type,
      'startTime': dateFormat.format(startTime),
      'endTime': endTime != null ? dateFormat.format(endTime!) : null,
      'totalScanned': totalScanned,
      'threatsFound': threatsFound.map((threat) => threat.toJson()).toList(),
      'userId': userId,
      'progress': progress,
    };
  }

  // Taramayı tamamla
  void complete({
    required int totalScanned,
    required List<Threat> threatsFound,
  }) {
    this.endTime = DateTime.now();
    this.totalScanned = totalScanned;
    this.threatsFound = threatsFound;
    this.progress = 100;
  }

  // İlerleme durumunu güncelle
  void updateProgress(double progress, {int? itemsScanned, List<Threat>? newThreats}) {
    this.progress = progress;
    
    if (itemsScanned != null) {
      this.totalScanned = itemsScanned;
    }
    
    if (newThreats != null) {
      this.threatsFound = newThreats;
    }
  }

  // Yeni tarama sonucu oluştur
  static ScanResult createNew(String type, String? userId) {
    // Benzersiz ID oluştur
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final id = 'scan_$timestamp';
    
    return ScanResult(
      id: id,
      type: type,
      startTime: DateTime.now(),
      userId: userId,
    );
  }
}