import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

enum ScanType {
  full,
  quick,
  custom,
  app,
  wifi,
  qrCode,
}

enum ThreatLevel {
  critical,
  high,
  medium,
  low,
}

class Threat {
  final String id;
  final String name;
  final String description;
  final ThreatLevel level;
  final String location;
  final DateTime detectedAt;
  bool isFixed;

  Threat({
    String? id,
    required this.name,
    required this.description,
    required this.level,
    required this.location,
    DateTime? detectedAt,
    this.isFixed = false,
  }) : 
    this.id = id ?? const Uuid().v4(),
    this.detectedAt = detectedAt ?? DateTime.now();
    
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'level': level.toString(),
      'location': location,
      'detectedAt': detectedAt.toIso8601String(),
      'isFixed': isFixed,
    };
  }
}

class ScanResult {
  final String id;
  final ScanType type;
  final DateTime startTime;
  final DateTime? endTime;
  final int scannedItems;
  final List<Threat> threats;
  final bool isCompleted;

  ScanResult({
    String? id,
    required this.type,
    required this.startTime,
    this.endTime,
    this.scannedItems = 0,
    this.threats = const [],
    this.isCompleted = false,
  }) : this.id = id ?? const Uuid().v4();

  ScanResult copyWith({
    String? id,
    ScanType? type,
    DateTime? startTime,
    DateTime? endTime,
    int? scannedItems,
    List<Threat>? threats,
    bool? isCompleted,
  }) {
    return ScanResult(
      id: id ?? this.id,
      type: type ?? this.type,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      scannedItems: scannedItems ?? this.scannedItems,
      threats: threats ?? this.threats,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }
}

class ScanProvider with ChangeNotifier {
  ScanResult? _currentScan;
  List<ScanResult> _scanHistory = [];
  List<Threat> _detectedThreats = [];
  bool _isScanning = false;

  ScanResult? get currentScan => _currentScan;
  List<ScanResult> get scanHistory => _scanHistory;
  List<Threat> get detectedThreats => _detectedThreats;
  bool get isScanning => _isScanning;

  void startScan(ScanType type) {
    if (_isScanning) return;
    
    _isScanning = true;
    _currentScan = ScanResult(
      type: type,
      startTime: DateTime.now(),
    );
    notifyListeners();
    
    // Simulate scanning process
    Future.delayed(Duration(seconds: type == ScanType.quick ? 3 : 5), () {
      _completeScan();
    });
  }
  
  void _completeScan() {
    if (_currentScan == null) return;
    
    // Generate mock threats for demo
    final mockThreats = _generateMockThreats(_currentScan!.type);
    
    _currentScan = _currentScan!.copyWith(
      endTime: DateTime.now(),
      scannedItems: _currentScan!.type == ScanType.quick ? 100 : 250,
      threats: mockThreats,
      isCompleted: true,
    );
    
    _scanHistory.add(_currentScan!);
    _detectedThreats.addAll(mockThreats);
    _isScanning = false;
    notifyListeners();
  }
  
  void cancelScan() {
    if (!_isScanning) return;
    
    _isScanning = false;
    _currentScan = null;
    notifyListeners();
  }
  
  void fixThreat(String threatId) {
    // Find threat in detected threats list
    final index = _detectedThreats.indexWhere((threat) => threat.id == threatId);
    if (index != -1) {
      final updatedThreat = Threat(
        id: _detectedThreats[index].id,
        name: _detectedThreats[index].name,
        description: _detectedThreats[index].description,
        level: _detectedThreats[index].level,
        location: _detectedThreats[index].location,
        detectedAt: _detectedThreats[index].detectedAt,
        isFixed: true,
      );
      
      _detectedThreats[index] = updatedThreat;
      
      // Also update in scan history
      for (int i = 0; i < _scanHistory.length; i++) {
        final scan = _scanHistory[i];
        final threatIndex = scan.threats.indexWhere((t) => t.id == threatId);
        if (threatIndex != -1) {
          final updatedThreats = List<Threat>.from(scan.threats);
          updatedThreats[threatIndex] = updatedThreat;
          _scanHistory[i] = scan.copyWith(threats: updatedThreats);
          break;
        }
      }
      
      notifyListeners();
    }
  }
  
  void fixAllThreats() {
    // Mark all threats as fixed
    for (int i = 0; i < _detectedThreats.length; i++) {
      final threat = _detectedThreats[i];
      if (!threat.isFixed) {
        _detectedThreats[i] = Threat(
          id: threat.id,
          name: threat.name,
          description: threat.description,
          level: threat.level,
          location: threat.location,
          detectedAt: threat.detectedAt,
          isFixed: true,
        );
      }
    }
    
    // Update threats in scan history
    for (int i = 0; i < _scanHistory.length; i++) {
      final scan = _scanHistory[i];
      final updatedThreats = scan.threats.map((threat) {
        return Threat(
          id: threat.id,
          name: threat.name,
          description: threat.description,
          level: threat.level,
          location: threat.location,
          detectedAt: threat.detectedAt,
          isFixed: true,
        );
      }).toList();
      _scanHistory[i] = scan.copyWith(threats: updatedThreats);
    }
    
    notifyListeners();
  }
  
  List<Threat> _generateMockThreats(ScanType type) {
    // Sadece demo amaçlı örnek tehditler
    if (type == ScanType.quick) {
      return [
        Threat(
          name: 'Adware.AndroidOS.Agent',
          description: 'Reklam gösterimi yapan potansiyel istenmeyen uygulama',
          level: ThreatLevel.medium,
          location: '/data/app/com.example.adware',
        ),
      ];
    } else if (type == ScanType.full) {
      return [
        Threat(
          name: 'Trojan.AndroidOS.Boogr',
          description: 'Sistem izinlerini kötüye kullanan Truva atı',
          level: ThreatLevel.critical,
          location: '/data/app/com.malware.example',
        ),
        Threat(
          name: 'Spyware.AndroidOS.Agent',
          description: 'Kullanıcı verilerini toplayan casus yazılım',
          level: ThreatLevel.high,
          location: '/data/app/com.spy.tracker',
        ),
        Threat(
          name: 'Adware.AndroidOS.Youmi',
          description: 'Agresif reklam gösterimi yapan yazılım',
          level: ThreatLevel.low,
          location: '/data/app/com.ad.display',
        ),
      ];
    } else if (type == ScanType.wifi) {
      return [
        Threat(
          name: 'UnsecureWiFi',
          description: 'Şifrelemesi zayıf WiFi ağı tespit edildi',
          level: ThreatLevel.high,
          location: 'WiFi: HomeNetwork',
        ),
      ];
    } else if (type == ScanType.qrCode) {
      return [
        Threat(
          name: 'MaliciousURL',
          description: 'QR kodda zararlı URL adresi tespit edildi',
          level: ThreatLevel.medium,
          location: 'QR Code: https://malicious-site.example',
        ),
      ];
    }
    
    return [];
  }
}