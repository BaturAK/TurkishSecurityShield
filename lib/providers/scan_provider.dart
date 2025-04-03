import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';
import 'package:provider/provider.dart';

import '../models/app_info.dart';
import '../models/scan_result.dart';
import '../models/threat.dart';
import '../services/mongodb_service.dart';
import '../services/notification_service.dart';
import '../services/scan_service.dart';

class ScanProvider extends ChangeNotifier {
  final ScanService _scanService = ScanService();
  MongoDBService? _mongoDBService;
  final _uuid = const Uuid();
  final _scanResultsBox = Hive.box('scan_results');
  
  ScanStatus _currentStatus = ScanStatus.notStarted;
  ScanResult? _lastScanResult;
  List<ScanResult> _scanHistory = [];
  int _progressPercent = 0;
  int _scannedItems = 0;
  int _totalItemsToScan = 0;
  List<AppInfo> _installedApps = [];
  List<Threat> _detectedThreats = [];
  Timer? _backgroundScanTimer;
  bool _isBackgroundServiceRunning = false;
  
  ScanStatus get currentStatus => _currentStatus;
  ScanResult? get lastScanResult => _lastScanResult;
  List<ScanResult> get scanHistory => _scanHistory;
  int get progressPercent => _progressPercent;
  int get scannedItems => _scannedItems;
  int get totalItemsToScan => _totalItemsToScan;
  List<AppInfo> get installedApps => _installedApps;
  List<Threat> get detectedThreats => _detectedThreats;
  bool get isBackgroundServiceRunning => _isBackgroundServiceRunning;
  
  ScanProvider() {
    _loadScanHistory();
    _loadInstalledApps();
  }
  
  // MongoDB servisi referansını ayarla
  void setMongoDBService(MongoDBService service) {
    _mongoDBService = service;
  }
  
  Future<void> _loadScanHistory() async {
    final scanResults = _scanResultsBox.values.toList();
    if (scanResults.isNotEmpty) {
      _scanHistory = scanResults
          .map((e) => ScanResult.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      _scanHistory.sort((a, b) => b.scanTime.compareTo(a.scanTime));
      
      if (_scanHistory.isNotEmpty) {
        _lastScanResult = _scanHistory.first;
      }
      
      notifyListeners();
    }
  }

  Future<void> _loadInstalledApps() async {
    try {
      _installedApps = await _scanService.getInstalledApps();
      notifyListeners();
    } catch (e) {
      debugPrint('Yüklü uygulamalar yüklenirken hata: $e');
    }
  }
  
  Future<void> startQuickScan() async {
    await _startScan(ScanType.quick);
  }
  
  Future<void> startFullScan() async {
    await _startScan(ScanType.full);
  }
  
  Future<void> scanSingleApp(AppInfo app) async {
    await _startScan(ScanType.app, appInfo: app);
  }
  
  Future<void> _startScan(ScanType scanType, {AppInfo? appInfo}) async {
    if (_currentStatus == ScanStatus.inProgress) {
      return;
    }
    
    _currentStatus = ScanStatus.inProgress;
    _progressPercent = 0;
    _scannedItems = 0;
    _detectedThreats = [];
    
    final scanId = _uuid.v4();
    final startTime = DateTime.now();
    
    notifyListeners();
    
    try {
      List<AppInfo> appsToScan;
      
      if (scanType == ScanType.app && appInfo != null) {
        appsToScan = [appInfo];
      } else if (scanType == ScanType.quick) {
        // Hızlı tarama için son 10 uygulamayı tara
        appsToScan = _installedApps.take(10).toList();
      } else {
        // Tam tarama için tüm uygulamaları tara
        appsToScan = _installedApps;
      }
      
      _totalItemsToScan = appsToScan.length;
      
      // MongoDB'den tehdit veritabanını al
      List<Threat> knownThreats = [];
      try {
        if (_mongoDBService != null) {
          knownThreats = await _mongoDBService!.getKnownThreats();
        } else {
          // Ofline modda çalışıyoruz, yerel hazır tehdit listesini kullan
          final hashList = await _scanService.getKnownMalwareHashes();
          knownThreats = hashList.map((hash) => Threat(
            id: hash,
            appName: 'Bilinmeyen Zararlı Yazılım',
            packageName: 'unknown',
            hash: hash,
            type: ThreatType.malware,
            severity: ThreatSeverity.high,
            status: ThreatStatus.detected,
            detectionTime: DateTime.now(),
            description: 'Bu uygulama bilinen zararlı yazılım imzasına sahip.',
            details: {},
          )).toList();
        }
      } catch (e) {
        debugPrint('Bilinen tehditler alınırken hata: $e');
        // Uygulama çalışmaya devam etmeli
      }
      
      for (int i = 0; i < appsToScan.length; i++) {
        final app = appsToScan[i];
        
        // Hash hesapla
        final hash = await _scanService.calculateAppHash(app.apkPath);
        
        // Uygulama izinlerini kontrol et
        final suspiciousPermissions = await _scanService.checkSuspiciousPermissions(app.packageName);
        
        // Hash bilinen tehditlerle eşleşiyor mu kontrol et
        final isKnownThreat = knownThreats.any((threat) => threat.hash == hash);
        
        if (isKnownThreat || suspiciousPermissions.isNotEmpty) {
          final threat = Threat(
            id: _uuid.v4(),
            appName: app.appName,
            packageName: app.packageName,
            hash: hash,
            type: isKnownThreat ? ThreatType.malware : ThreatType.suspiciousPermission,
            severity: isKnownThreat ? ThreatSeverity.high : ThreatSeverity.medium,
            status: ThreatStatus.detected,
            detectionTime: DateTime.now(),
            description: isKnownThreat 
                ? 'Bu uygulama bilinen zararlı yazılım imzasına sahip.' 
                : 'Bu uygulama şüpheli izinlere sahip.',
            details: {
              'suspiciousPermissions': suspiciousPermissions,
            },
          );
          
          _detectedThreats.add(threat);
          
          // MongoDB'ye tehditi kaydet
          try {
            if (_mongoDBService != null) {
              await _mongoDBService!.saveThreat(threat);
            }
          } catch (e) {
            debugPrint('Tehdit kaydedilirken hata: $e');
            // Uygulama çalışmaya devam etmeli
          }
          
          // Bildirim gönder
          NotificationService.showThreatNotification(
            threat.id, 
            'Tehdit Tespit Edildi', 
            '${threat.appName} uygulamasında tehdit tespit edildi.'
          );
        }
        
        _scannedItems = i + 1;
        _progressPercent = ((_scannedItems / _totalItemsToScan) * 100).round();
        
        notifyListeners();
      }
      
      final endTime = DateTime.now();
      final duration = endTime.difference(startTime);
      
      _currentStatus = ScanStatus.completed;
      
      // Tarama sonucunu oluştur
      final scanResult = ScanResult(
        id: scanId,
        scanTime: startTime,
        scanType: scanType,
        status: ScanStatus.completed,
        threats: _detectedThreats,
        scannedItems: _scannedItems,
        duration: duration,
      );
      
      _lastScanResult = scanResult;
      _scanHistory.insert(0, scanResult);
      
      // Tarama sonucunu kaydet
      await _scanResultsBox.put(scanResult.id, scanResult.toJson());
      
      notifyListeners();
      
      // Sonuç bildirimini göster
      if (_detectedThreats.isNotEmpty) {
        NotificationService.showScanCompleteNotification(
          'Tarama Tamamlandı', 
          '${_detectedThreats.length} tehdit tespit edildi. Detayları görüntülemek için tıklayın.'
        );
      } else {
        NotificationService.showScanCompleteNotification(
          'Tarama Tamamlandı', 
          'Herhangi bir tehdit tespit edilmedi. Cihazınız güvende.'
        );
      }
      
    } catch (e) {
      _currentStatus = ScanStatus.failed;
      
      final scanResult = ScanResult(
        id: scanId,
        scanTime: startTime,
        scanType: scanType,
        status: ScanStatus.failed,
        threats: [],
        scannedItems: _scannedItems,
        duration: DateTime.now().difference(startTime),
        errorMessage: e.toString(),
      );
      
      _lastScanResult = scanResult;
      _scanHistory.insert(0, scanResult);
      
      await _scanResultsBox.put(scanResult.id, scanResult.toJson());
      
      notifyListeners();
      
      NotificationService.showScanCompleteNotification(
        'Tarama Başarısız', 
        'Tarama sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  }
  
  Future<void> startBackgroundScanning(Duration interval) async {
    stopBackgroundScanning();
    
    _isBackgroundServiceRunning = true;
    notifyListeners();
    
    _backgroundScanTimer = Timer.periodic(interval, (_) {
      _startScan(ScanType.background);
    });
  }
  
  void stopBackgroundScanning() {
    _backgroundScanTimer?.cancel();
    _backgroundScanTimer = null;
    _isBackgroundServiceRunning = false;
    notifyListeners();
  }
  
  Future<void> removeThreat(Threat threat) async {
    try {
      // Tehdidi kaldır
      await _scanService.uninstallApp(threat.packageName);
      
      // Tehdit durumunu güncelle
      final updatedThreat = threat.copyWith(status: ThreatStatus.removed);
      
      // MongoDB'yi güncelle
      try {
        if (_mongoDBService != null) {
          await _mongoDBService!.updateThreatStatus(updatedThreat);
        }
      } catch (e) {
        debugPrint('Tehdit durumu güncellenirken hata: $e');
        // Uygulama çalışmaya devam etmeli
      }
      
      // Yerel listeyi güncelle
      final index = _detectedThreats.indexWhere((t) => t.id == threat.id);
      if (index >= 0) {
        _detectedThreats[index] = updatedThreat;
        notifyListeners();
      }
      
      // Tarama sonucunu güncelle
      if (_lastScanResult != null) {
        final updatedThreats = _lastScanResult!.threats.map((t) {
          if (t.id == threat.id) {
            return updatedThreat;
          }
          return t;
        }).toList();
        
        _lastScanResult = _lastScanResult!.copyWith(threats: updatedThreats);
        
        // Tarama geçmişini güncelle
        final historyIndex = _scanHistory.indexWhere((s) => s.id == _lastScanResult!.id);
        if (historyIndex >= 0) {
          _scanHistory[historyIndex] = _lastScanResult!;
          await _scanResultsBox.put(_lastScanResult!.id, _lastScanResult!.toJson());
        }
        
        notifyListeners();
      }
      
    } catch (e) {
      debugPrint('Tehdit kaldırma hatası: $e');
      rethrow;
    }
  }
  
  Future<void> ignoreThreat(Threat threat) async {
    try {
      // Tehdit durumunu güncelle
      final updatedThreat = threat.copyWith(status: ThreatStatus.ignored);
      
      // MongoDB'yi güncelle
      try {
        if (_mongoDBService != null) {
          await _mongoDBService!.updateThreatStatus(updatedThreat);
        }
      } catch (e) {
        debugPrint('Tehdit durumu güncellenirken hata: $e');
        // Uygulama çalışmaya devam etmeli
      }
      
      // Yerel listeyi güncelle
      final index = _detectedThreats.indexWhere((t) => t.id == threat.id);
      if (index >= 0) {
        _detectedThreats[index] = updatedThreat;
        notifyListeners();
      }
      
      // Tarama sonucunu güncelle
      if (_lastScanResult != null) {
        final updatedThreats = _lastScanResult!.threats.map((t) {
          if (t.id == threat.id) {
            return updatedThreat;
          }
          return t;
        }).toList();
        
        _lastScanResult = _lastScanResult!.copyWith(threats: updatedThreats);
        
        // Tarama geçmişini güncelle
        final historyIndex = _scanHistory.indexWhere((s) => s.id == _lastScanResult!.id);
        if (historyIndex >= 0) {
          _scanHistory[historyIndex] = _lastScanResult!;
          await _scanResultsBox.put(_lastScanResult!.id, _lastScanResult!.toJson());
        }
        
        notifyListeners();
      }
      
    } catch (e) {
      debugPrint('Tehdit yok sayma hatası: $e');
      rethrow;
    }
  }
  
  Future<void> quarantineThreat(Threat threat) async {
    try {
      // Tehdidi karantinaya al
      await _scanService.disableApp(threat.packageName);
      
      // Tehdit durumunu güncelle
      final updatedThreat = threat.copyWith(status: ThreatStatus.quarantined);
      
      // MongoDB'yi güncelle
      try {
        if (_mongoDBService != null) {
          await _mongoDBService!.updateThreatStatus(updatedThreat);
        }
      } catch (e) {
        debugPrint('Tehdit durumu güncellenirken hata: $e');
        // Uygulama çalışmaya devam etmeli
      }
      
      // Yerel listeyi güncelle
      final index = _detectedThreats.indexWhere((t) => t.id == threat.id);
      if (index >= 0) {
        _detectedThreats[index] = updatedThreat;
        notifyListeners();
      }
      
      // Tarama sonucunu güncelle
      if (_lastScanResult != null) {
        final updatedThreats = _lastScanResult!.threats.map((t) {
          if (t.id == threat.id) {
            return updatedThreat;
          }
          return t;
        }).toList();
        
        _lastScanResult = _lastScanResult!.copyWith(threats: updatedThreats);
        
        // Tarama geçmişini güncelle
        final historyIndex = _scanHistory.indexWhere((s) => s.id == _lastScanResult!.id);
        if (historyIndex >= 0) {
          _scanHistory[historyIndex] = _lastScanResult!;
          await _scanResultsBox.put(_lastScanResult!.id, _lastScanResult!.toJson());
        }
        
        notifyListeners();
      }
      
    } catch (e) {
      debugPrint('Tehditi karantinaya alma hatası: $e');
      rethrow;
    }
  }
  
  Future<void> refreshInstalledApps() async {
    await _loadInstalledApps();
  }
  
  @override
  void dispose() {
    _backgroundScanTimer?.cancel();
    super.dispose();
  }
}
