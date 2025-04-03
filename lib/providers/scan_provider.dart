import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

enum ScanType {
  quick,
  full,
  custom,
  app,
  wifi,
  qrCode,
}

class Threat {
  final String id;
  final String name;
  final String type;
  final String description;
  final String severity;
  bool isFixed;

  Threat({
    required this.id,
    required this.name,
    required this.type,
    required this.description,
    required this.severity,
    this.isFixed = false,
  });
}

class Scan {
  final String id;
  final ScanType type;
  final DateTime startTime;
  DateTime? endTime;
  int totalScanned;
  int threatsFound;
  List<Threat> threats;

  Scan({
    required this.id,
    required this.type,
    required this.startTime,
    this.endTime,
    this.totalScanned = 0,
    this.threatsFound = 0,
    this.threats = const [],
  });

  Duration get duration {
    final end = endTime ?? DateTime.now();
    return end.difference(startTime);
  }
}

class ScanProvider with ChangeNotifier {
  List<Scan> _scanHistory = [];
  List<Threat> _detectedThreats = [];
  Scan? _currentScan;
  Timer? _scanTimer;
  bool _isScanning = false;

  List<Scan> get scanHistory => _scanHistory;
  List<Threat> get detectedThreats => _detectedThreats;
  Scan? get currentScan => _currentScan;
  bool get isScanning => _isScanning;

  ScanProvider() {
    _loadSavedScans();
  }

  void _loadSavedScans() {
    // Normalde SharedPreferences veya yerel veritabanından yüklenecek
    // Şimdilik örnek veriler oluşturalım
    _generateSampleData();
  }

  void _generateSampleData() {
    // Örnek tarama geçmişi
    final now = DateTime.now();
    
    final scan1 = Scan(
      id: 'scan1',
      type: ScanType.quick,
      startTime: now.subtract(const Duration(days: 2)),
      endTime: now.subtract(const Duration(days: 2, minutes: 2)),
      totalScanned: 124,
      threatsFound: 0,
    );
    
    final threatAdware = Threat(
      id: 'threat1',
      name: 'AdClickBait',
      type: 'Adware',
      description: 'Reklam görüntüleyen ve tıklama toplayan zararlı yazılım',
      severity: 'MEDIUM',
    );
    
    final threatSpyware = Threat(
      id: 'threat2',
      name: 'DataStealer',
      type: 'Spyware',
      description: 'Kişisel verileri toplayan ve dışarı sızdıran casus yazılım',
      severity: 'HIGH',
    );
    
    final scan2 = Scan(
      id: 'scan2',
      type: ScanType.full,
      startTime: now.subtract(const Duration(days: 1)),
      endTime: now.subtract(const Duration(days: 1, minutes: 8)),
      totalScanned: 452,
      threatsFound: 2,
      threats: [threatAdware, threatSpyware],
    );
    
    _scanHistory = [scan1, scan2];
    
    // Tehditler
    _detectedThreats = [
      threatAdware,
      threatSpyware,
      Threat(
        id: 'threat3',
        name: 'FakeUpdater',
        type: 'Trojan',
        description: 'Sahte güncellemelerle cihazınızı enfekte eden truva atı',
        severity: 'HIGH',
      ),
    ];
  }

  Future<void> startScan(ScanType type) async {
    if (_isScanning) {
      return;
    }

    _isScanning = true;
    final scanId = 'scan_${DateTime.now().millisecondsSinceEpoch}';
    
    _currentScan = Scan(
      id: scanId,
      type: type,
      startTime: DateTime.now(),
    );

    notifyListeners();

    // Tarama simülasyonu
    int duration;
    switch (type) {
      case ScanType.quick:
        duration = 5; // 5 saniye
        break;
      case ScanType.full:
        duration = 15; // 15 saniye
        break;
      case ScanType.wifi:
      case ScanType.qrCode:
        duration = 3; // 3 saniye
        break;
      default:
        duration = 10; // 10 saniye
    }

    // Belirli aralıklarla ilerleme bildirimlerini tetiklemek için bir zamanlayıcı başlat
    int progress = 0;
    int totalItems = duration * 10; // Tarama türüne göre toplam öğe sayısı
    
    _scanTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      progress++;
      
      if (_currentScan != null) {
        _currentScan!.totalScanned = ((progress / (duration * 10)) * totalItems).floor();
      }
      
      notifyListeners();
      
      if (progress >= duration * 10) {
        timer.cancel();
        _completeScan(scanId, type, totalItems);
      }
    });
  }

  void _completeScan(String scanId, ScanType type, int totalItems) {
    // Rastgele tehdit oluştur (simülasyon)
    final hasThreats = Random().nextBool();
    final threatCount = hasThreats ? Random().nextInt(3) + 1 : 0;
    
    final threats = <Threat>[];
    
    if (threatCount > 0) {
      final threatTypes = ['Adware', 'Spyware', 'Trojan', 'Malware', 'Worm', 'Ransomware'];
      final severities = ['LOW', 'MEDIUM', 'HIGH'];
      
      for (var i = 0; i < threatCount; i++) {
        final threatType = threatTypes[Random().nextInt(threatTypes.length)];
        final threat = Threat(
          id: 'threat_${DateTime.now().millisecondsSinceEpoch}_$i',
          name: _generateThreatName(threatType),
          type: threatType,
          description: _generateThreatDescription(threatType),
          severity: severities[Random().nextInt(severities.length)],
        );
        
        threats.add(threat);
        _detectedThreats.add(threat);
      }
    }
    
    // Taramayı güncelle ve geçmişe ekle
    final scan = Scan(
      id: scanId,
      type: type,
      startTime: _currentScan!.startTime,
      endTime: DateTime.now(),
      totalScanned: totalItems,
      threatsFound: threatCount,
      threats: threats,
    );
    
    _scanHistory.add(scan);
    _currentScan = null;
    _isScanning = false;
    
    notifyListeners();
  }

  void cancelScan() {
    if (_scanTimer != null && _scanTimer!.isActive) {
      _scanTimer!.cancel();
    }
    
    _currentScan = null;
    _isScanning = false;
    
    notifyListeners();
  }

  void fixThreat(String threatId) {
    final threatIndex = _detectedThreats.indexWhere((t) => t.id == threatId);
    
    if (threatIndex != -1) {
      _detectedThreats[threatIndex].isFixed = true;
      notifyListeners();
    }
  }

  void fixAllThreats() {
    for (var threat in _detectedThreats) {
      threat.isFixed = true;
    }
    
    notifyListeners();
  }

  String _generateThreatName(String type) {
    final names = {
      'Adware': ['AdPopUp', 'ClickBait', 'AdSpammer', 'BannerFraud'],
      'Spyware': ['DataSniffer', 'KeyLogger', 'InfoStealer', 'ScreenSpy'],
      'Trojan': ['FakeApp', 'BackdoorKit', 'RemoteAccess', 'FakeUpdater'],
      'Malware': ['FileCorruptor', 'SystemHijacker', 'BootKit', 'RootKit'],
      'Worm': ['AutoSpread', 'NetworkWorm', 'USBInfector', 'MailWorm'],
      'Ransomware': ['FileLock', 'CryptoMiner', 'Encryptor', 'PaymentDemand'],
    };

    final options = names[type] ?? ['UnknownThreat'];
    return options[Random().nextInt(options.length)];
  }

  String _generateThreatDescription(String type) {
    final descriptions = {
      'Adware': 'İstenmeyen reklamlar gösteren ve gelir elde etmeye çalışan zararlı yazılım.',
      'Spyware': 'Kullanıcı verilerini gizlice toplayan ve üçüncü taraflara ileten casus yazılım.',
      'Trojan': 'Faydalı bir yazılım gibi görünen ancak zararlı işlevleri olan truva atı.',
      'Malware': 'Sisteme zarar vermek veya yetkisiz erişim sağlamak için tasarlanmış kötü amaçlı yazılım.',
      'Worm': 'Kendi kendini çoğaltabilen ve ağ üzerinde yayılabilen zararlı yazılım.',
      'Ransomware': 'Dosyaları şifreleyen ve erişimi engelleyerek fidye isteyen zararlı yazılım.',
    };

    return descriptions[type] ?? 'Bilinmeyen bir tehdit tespit edildi.';
  }
}