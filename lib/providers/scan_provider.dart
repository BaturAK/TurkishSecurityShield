import 'package:flutter/foundation.dart';
import 'dart:async';
import '../models/scan_result.dart';
import '../models/threat.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class ScanProvider with ChangeNotifier {
  ScanResult? _currentScan;
  ScanResult? _lastScanResult;
  List<ScanResult> _scanHistory = [];
  List<Threat> _detectedThreats = [];
  bool _isScanning = false;
  bool _isLoading = false;
  String? _error;
  Timer? _scanTimer;
  final ApiService _apiService = ApiService();

  // Getters
  ScanResult? get currentScan => _currentScan;
  ScanResult? get lastScanResult => _lastScanResult;
  List<ScanResult> get scanHistory => _scanHistory;
  List<Threat> get detectedThreats => _detectedThreats;
  bool get isScanning => _isScanning;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Tarama başlat
  Future<ScanResult?> startScan(String scanType, String? userId) async {
    if (_isScanning) {
      _error = "Başka bir tarama zaten devam ediyor";
      notifyListeners();
      return null;
    }

    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // API üzerinden tarama başlat
      try {
        final response = await _apiService.post(
          ApiEndpoints.startScan,
          data: {
            'type': scanType,
            'userId': userId,
          },
        );

        // Yeni bir ScanResult oluştur
        _currentScan = ScanResult.fromJson(response['data']);
      } catch (e) {
        // API hatası durumunda simülasyon yap
        print('API bağlantı hatası, simülasyon yapılıyor: $e');
        _currentScan = ScanResult.createNew(scanType, userId);
      }

      _isScanning = true;
      _isLoading = false;
      notifyListeners();

      // Simülasyon taraması başlat
      _startSimulatedScan(scanType);

      return _currentScan;
    } catch (e) {
      _isLoading = false;
      _error = "Tarama başlatılırken bir hata oluştu: $e";
      notifyListeners();
      return null;
    }
  }

  // Tarama durumunu güncelle
  Future<void> updateScanStatus() async {
    if (_currentScan == null || !_isScanning) return;

    try {
      // API'den tarama durumunu al
      try {
        final response = await _apiService.get(
          '${ApiEndpoints.getScanStatus}${_currentScan!.id}',
        );
        
        final updatedScan = ScanResult.fromJson(response['data']);
        _currentScan = updatedScan;
        
        // Tarama tamamlandıysa
        if (updatedScan.endTime != null) {
          _onScanComplete();
        }
      } catch (e) {
        // API bağlantı hatası
        print('Tarama durumu güncellenirken API hatası: $e');
      }
      
      notifyListeners();
    } catch (e) {
      print('Tarama durumu güncellenirken hata: $e');
    }
  }

  // Tarama sonucunu getir
  Future<ScanResult?> getScanResult(String scanId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      try {
        final response = await _apiService.get(
          '${ApiEndpoints.getScanStatus}$scanId',
        );
        
        final scanResult = ScanResult.fromJson(response['data']);
        
        // Mevcut tarama mı kontrol et
        if (_currentScan != null && _currentScan!.id == scanId) {
          _currentScan = scanResult;
        } else {
          // Geçmiş tarama
          _lastScanResult = scanResult;
        }
        
        _isLoading = false;
        notifyListeners();
        return scanResult;
      } catch (e) {
        // Simülasyon yap
        print('Tarama sonucu alınırken API hatası, simülasyon yapılıyor: $e');
        
        // Eğer zaten var olan bir taramayı arıyorsak
        if (_currentScan != null && _currentScan!.id == scanId) {
          _isLoading = false;
          notifyListeners();
          return _currentScan;
        } else if (_lastScanResult != null && _lastScanResult!.id == scanId) {
          _isLoading = false;
          notifyListeners();
          return _lastScanResult;
        }
        
        // Yeni simülasyon oluştur
        final simulatedScan = ScanResult.createNew(ScanTypes.quick, null);
        simulatedScan.complete(
          totalScanned: 120,
          threatsFound: Threat.generateRandomThreats(2),
        );
        
        _lastScanResult = simulatedScan;
        _isLoading = false;
        notifyListeners();
        return simulatedScan;
      }
    } catch (e) {
      _isLoading = false;
      _error = "Tarama sonucu alınırken bir hata oluştu: $e";
      notifyListeners();
      return null;
    }
  }

  // Tarama geçmişini getir
  Future<void> loadScanHistory(String userId) async {
    try {
      _isLoading = true;
      notifyListeners();

      try {
        final response = await _apiService.get(
          '${ApiEndpoints.getUserInfo}$userId/scans',
        );
        
        final List<dynamic> scansJson = response['data'];
        _scanHistory = scansJson
            .map((scanJson) => ScanResult.fromJson(scanJson))
            .toList();
        
        // Son taramayı belirle
        if (_scanHistory.isNotEmpty) {
          _lastScanResult = _scanHistory.first;
        }
      } catch (e) {
        // Simülasyon yap
        print('Tarama geçmişi alınırken API hatası, simülasyon yapılıyor: $e');
        
        _scanHistory = List.generate(
          5,
          (index) {
            final scan = ScanResult.createNew(
              index % 2 == 0 ? ScanTypes.quick : ScanTypes.full,
              userId,
            );
            
            // Geçmiş taramalar tamamlanmış olmalı
            scan.complete(
              totalScanned: 100 + (index * 20),
              threatsFound: index % 3 == 0
                  ? Threat.generateRandomThreats(index + 1)
                  : [],
            );
            
            return scan;
          },
        );
        
        if (_scanHistory.isNotEmpty) {
          _lastScanResult = _scanHistory.first;
        }
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = "Tarama geçmişi yüklenirken bir hata oluştu: $e";
      notifyListeners();
    }
  }

  // Tehdit temizle
  Future<bool> cleanThreat(String threatId) async {
    try {
      // Aktif tarama veya son taramada tehdidi bul
      Threat? threat;
      
      if (_currentScan != null) {
        threat = _currentScan!.threatsFound.firstWhere(
          (t) => t.id == threatId,
          orElse: () => throw Exception('Tehdit bulunamadı'),
        );
      } else if (_lastScanResult != null) {
        threat = _lastScanResult!.threatsFound.firstWhere(
          (t) => t.id == threatId,
          orElse: () => throw Exception('Tehdit bulunamadı'),
        );
      } else {
        throw Exception('Aktif tarama bulunamadı');
      }

      // API üzerinden tehdidi temizle
      try {
        await _apiService.post(
          '${ApiEndpoints.cleanThreat}/$threatId',
          data: {'action': 'clean'},
        );
      } catch (e) {
        print('Tehdit temizlenirken API hatası, yerel işlem yapılıyor: $e');
      }

      // Tehdidi temizle
      threat.clean();
      
      // Tespit edilen tehditleri güncelle
      _updateDetectedThreats();
      
      notifyListeners();
      return true;
    } catch (e) {
      _error = "Tehdit temizlenirken bir hata oluştu: $e";
      notifyListeners();
      return false;
    }
  }

  // Tüm tehditleri temizle
  Future<bool> cleanAllThreats() async {
    try {
      // Hedef taramayı belirle
      ScanResult? targetScan = _currentScan ?? _lastScanResult;
      
      if (targetScan == null) {
        throw Exception('Aktif tarama bulunamadı');
      }

      // Temizlenecek tehdit ID'lerini topla
      final threatIds = targetScan.threatsFound
          .where((threat) => !threat.isCleaned)
          .map((threat) => threat.id)
          .toList();

      if (threatIds.isEmpty) {
        return true; // Temizlenecek tehdit yok
      }

      // API üzerinden tehditleri temizle
      try {
        await _apiService.post(
          ApiEndpoints.cleanThreat,
          data: {
            'threatIds': threatIds,
            'action': 'cleanAll',
          },
        );
      } catch (e) {
        print('Tehditler temizlenirken API hatası, yerel işlem yapılıyor: $e');
      }

      // Tüm tehditleri temizle
      for (var threat in targetScan.threatsFound) {
        threat.clean();
      }
      
      // Tespit edilen tehditleri güncelle
      _updateDetectedThreats();
      
      notifyListeners();
      return true;
    } catch (e) {
      _error = "Tehditler temizlenirken bir hata oluştu: $e";
      notifyListeners();
      return false;
    }
  }

  // Taramayı iptal et
  void cancelScan() {
    if (_currentScan != null && _isScanning) {
      _scanTimer?.cancel();
      _isScanning = false;
      _currentScan = null;
      notifyListeners();
    }
  }

  // Simüle edilmiş tarama
  void _startSimulatedScan(String scanType) {
    // Tarama süresini belirle
    int duration;
    int maxProgress = 100;
    int totalItems;
    
    switch (scanType) {
      case ScanTypes.quick:
        duration = 10; // 10 saniye
        totalItems = 100;
        break;
      case ScanTypes.full:
        duration = 30; // 30 saniye
        totalItems = 300;
        break;
      case ScanTypes.wifi:
        duration = 5; // 5 saniye
        totalItems = 10;
        break;
      case ScanTypes.qr:
        duration = 2; // 2 saniye
        totalItems = 1;
        break;
      default:
        duration = 15;
        totalItems = 150;
    }

    // Tehdit sayısını belirle
    final threatCount = scanType == ScanTypes.quick ? 2 : (scanType == ScanTypes.full ? 4 : 1);
    
    // İlerleme zamanlaması
    int elapsed = 0;
    const interval = 500; // milisaniye
    
    _scanTimer = Timer.periodic(Duration(milliseconds: interval), (timer) {
      if (_currentScan == null) {
        timer.cancel();
        return;
      }
      
      elapsed += interval;
      final progress = (elapsed / (duration * 1000)) * maxProgress;
      
      if (progress >= maxProgress) {
        timer.cancel();
        _simulateCompleteResult(totalItems, threatCount);
      } else {
        // İlerleme durumunu güncelle
        _updateCurrentScanProgress(
          progress,
          (progress / maxProgress * totalItems).round(),
          threatCount > 0 && progress > 60 // %60'tan sonra tehdit bulunabilir
              ? Threat.generateRandomThreats(1)
              : [],
        );
      }
    });
  }

  // Tarama tamamlandığında
  void _onScanComplete() {
    _scanTimer?.cancel();
    _isScanning = false;
    
    // Son tarama sonucunu güncelle
    _lastScanResult = _currentScan;
    
    // Tarama geçmişini güncelle
    if (_currentScan != null && !_scanHistory.any((scan) => scan.id == _currentScan!.id)) {
      _scanHistory.insert(0, _currentScan!);
    }
    
    // Tespit edilen tehditleri güncelle
    _updateDetectedThreats();
    
    notifyListeners();
  }

  // Simüle edilmiş tarama sonucu
  void _simulateCompleteResult(int totalItems, int threatCount) {
    if (_currentScan == null) return;
    
    // Sonuç için tehditler oluştur
    final threats = threatCount > 0
        ? Threat.generateRandomThreats(threatCount)
        : [];
    
    // Taramayı tamamla
    _currentScan!.complete(
      totalScanned: totalItems,
      threatsFound: threats,
    );
    
    _onScanComplete();
  }

  // Mevcut tarama ilerlemesini güncelle
  void _updateCurrentScanProgress(double progress, int scannedItems, List<Threat> newThreats) {
    if (_currentScan == null) return;
    
    // Yeni tehditler varsa, mevcut tehditlere ekle
    List<Threat> updatedThreats = List.from(_currentScan!.threatsFound);
    updatedThreats.addAll(newThreats);
    
    // İlerleme durumunu güncelle
    _currentScan!.updateProgress(
      progress,
      itemsScanned: scannedItems,
      newThreats: updatedThreats,
    );
    
    notifyListeners();
  }

  // Tespit edilen tehditleri güncelle
  void _updateDetectedThreats() {
    // Tüm taramalardan tespit edilen temizlenmemiş tehditleri topla
    _detectedThreats = [];
    
    // Aktif taramadaki tehditler
    if (_currentScan != null) {
      _detectedThreats.addAll(
        _currentScan!.threatsFound.where((threat) => !threat.isCleaned),
      );
    }
    
    // Son tarama sonucundaki tehditler
    if (_lastScanResult != null && _currentScan?.id != _lastScanResult?.id) {
      _detectedThreats.addAll(
        _lastScanResult!.threatsFound.where((threat) => !threat.isCleaned),
      );
    }
    
    // Geçmiş taramalardaki tehditler
    for (var scan in _scanHistory) {
      if (scan.id != _currentScan?.id && scan.id != _lastScanResult?.id) {
        _detectedThreats.addAll(
          scan.threatsFound.where((threat) => !threat.isCleaned),
        );
      }
    }
  }
}