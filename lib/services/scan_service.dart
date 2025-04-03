import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/threat.dart';
import '../models/scan_result.dart';
import '../models/app_info.dart';
import 'mongodb_service.dart';

class ScanService {
  final MongoDBService _mongoDBService = MongoDBService();
  
  // Singleton pattern
  static final ScanService _instance = ScanService._internal();
  
  factory ScanService() {
    return _instance;
  }
  
  ScanService._internal();

  // Mock app list for demo purposes (in a real app, this would come from the device)
  final List<AppInfo> _installedApps = [];
  
  // Common malware signatures (in a real app, this would be a comprehensive database)
  final List<String> _malwareSignatures = [
    'com.malware.trojan',
    'com.hackers.spyware',
    'com.dangerous.adware',
    'com.unsafe.tracker',
    'com.risk.rootkit',
  ];
  
  // Threat definitions (for demonstration)
  final Map<String, Map<String, dynamic>> _threatDefinitions = {
    'com.malware.trojan': {
      'type': ThreatType.trojan,
      'severity': ThreatSeverity.high,
      'description': 'Truva atı tespit edildi. Bu uygulama hassas verilerinizi çalabilir.'
    },
    'com.hackers.spyware': {
      'type': ThreatType.spyware,
      'severity': ThreatSeverity.high,
      'description': 'Casus yazılım tespit edildi. Bu uygulama gizlice aktivitelerinizi izliyor.'
    },
    'com.dangerous.adware': {
      'type': ThreatType.adware,
      'severity': ThreatSeverity.medium,
      'description': 'Reklam yazılımı tespit edildi. Bu uygulama istenmeyen reklamlar gösterebilir.'
    },
    'com.unsafe.tracker': {
      'type': ThreatType.spyware,
      'severity': ThreatSeverity.medium,
      'description': 'İzleyici tespit edildi. Bu uygulama konumunuzu ve kişisel bilgilerinizi izleyebilir.'
    },
    'com.risk.rootkit': {
      'type': ThreatType.rootkit,
      'severity': ThreatSeverity.high,
      'description': 'Rootkit tespit edildi. Bu uygulama cihazınızın güvenlik sistemini atlatmaya çalışabilir.'
    },
  };
  
  Future<void> initialize() async {
    await _mongoDBService.initialize();
    await _loadMockApps();
  }
  
  Future<void> _loadMockApps() async {
    // In a real app, this would retrieve the actual installed apps
    // For this demo, we'll create mock apps based on saved preferences
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? appJsonStr = prefs.getString('mock_installed_apps');
    
    if (appJsonStr != null) {
      try {
        List<dynamic> appsJson = jsonDecode(appJsonStr);
        _installedApps.clear();
        _installedApps.addAll(appsJson.map((json) => AppInfo.fromJson(json)).toList());
      } catch (e) {
        debugPrint('Error loading mock apps: $e');
        _generateMockApps();
      }
    } else {
      _generateMockApps();
    }
  }
  
  void _generateMockApps() {
    _installedApps.clear();
    
    // Common legitimate apps
    _installedApps.addAll([
      AppInfo(
        packageName: 'com.whatsapp',
        appName: 'WhatsApp',
        versionName: '2.23.5.12',
        versionCode: 2307,
        installDate: '2023-01-15',
        updateDate: '2023-04-22',
        appSize: '48.5 MB',
        isSystemApp: false,
        permissions: 'Kamera, Mikrofon, Kişiler, Depolama',
        appIcon: 'whatsapp_icon',
        isRunning: true,
      ),
      AppInfo(
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        versionName: '253.0.0.23.108',
        versionCode: 4253,
        installDate: '2022-11-05',
        updateDate: '2023-04-18',
        appSize: '55.2 MB',
        isSystemApp: false,
        permissions: 'Kamera, Mikrofon, Kişiler, Depolama, Konum',
        appIcon: 'instagram_icon',
        isRunning: true,
      ),
      AppInfo(
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        versionName: '18.15.40',
        versionCode: 1537,
        installDate: '2022-09-12',
        updateDate: '2023-04-10',
        appSize: '36.8 MB',
        isSystemApp: true,
        permissions: 'Kamera, Mikrofon, Depolama',
        appIcon: 'youtube_icon',
        isRunning: false,
      ),
      AppInfo(
        packageName: 'com.spotify.music',
        appName: 'Spotify',
        versionName: '8.8.22.510',
        versionCode: 905,
        installDate: '2022-10-18',
        updateDate: '2023-03-28',
        appSize: '30.4 MB',
        isSystemApp: false,
        permissions: 'Depolama, Mikrofon',
        appIcon: 'spotify_icon',
        isRunning: true,
      ),
    ]);
    
    // Add one of our malware signatures randomly to simulate a malware
    final random = Random();
    if (random.nextBool()) {
      final randomMalwareIndex = random.nextInt(_malwareSignatures.length);
      final malwarePackage = _malwareSignatures[randomMalwareIndex];
      
      _installedApps.add(
        AppInfo(
          packageName: malwarePackage,
          appName: 'FlashLight Pro', // Innocent looking name
          versionName: '2.1.5',
          versionCode: 215,
          installDate: '2023-03-10',
          updateDate: '2023-03-10',
          appSize: '4.2 MB',
          isSystemApp: false,
          permissions: 'Kamera, Mikrofon, Kişiler, Depolama, Konum, Telefon, SMS',
          appIcon: 'flashlight_icon',
          isRunning: true,
        ),
      );
    }
    
    // Save mock apps
    _saveMockApps();
  }
  
  Future<void> _saveMockApps() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      List<Map<String, dynamic>> appsJson = _installedApps.map((app) => app.toJson()).toList();
      await prefs.setString('mock_installed_apps', jsonEncode(appsJson));
    } catch (e) {
      debugPrint('Error saving mock apps: $e');
    }
  }
  
  // Get installed apps
  List<AppInfo> getInstalledApps() {
    return _installedApps;
  }
  
  // Perform a quick scan
  Future<ScanResult> performQuickScan() async {
    // Start the scan
    final startTime = DateTime.now();
    
    // Simulate scan delay - quick scan scans core system areas and recently installed apps
    await Future.delayed(const Duration(seconds: 2));
    
    // Get threats
    final threats = await _scanForThreats(quick: true);
    
    // Calculate duration
    final endTime = DateTime.now();
    final duration = endTime.difference(startTime);
    
    // Create scan result
    final scanResult = ScanResult(
      id: const Uuid().v4(),
      scanType: ScanType.quick,
      scanTime: startTime,
      duration: duration,
      scannedItems: _installedApps.length,
      threats: threats,
      status: ScanStatus.completed,
    );
    
    // Save to MongoDB (if online)
    await _mongoDBService.addScanResult(scanResult);
    
    return scanResult;
  }
  
  // Perform a full scan
  Future<ScanResult> performFullScan() async {
    // Start the scan
    final startTime = DateTime.now();
    
    // Simulate scan delay - full scan is more thorough
    await Future.delayed(const Duration(seconds: 5));
    
    // Get threats
    final threats = await _scanForThreats(quick: false);
    
    // Calculate duration
    final endTime = DateTime.now();
    final duration = endTime.difference(startTime);
    
    // Create scan result
    final scanResult = ScanResult(
      id: const Uuid().v4(),
      scanType: ScanType.full,
      scanTime: startTime,
      duration: duration,
      scannedItems: _installedApps.length * 3, // Full scan checks more items
      threats: threats,
      status: ScanStatus.completed,
    );
    
    // Save to MongoDB (if online)
    await _mongoDBService.addScanResult(scanResult);
    
    return scanResult;
  }
  
  // Scan app by package name
  Future<ScanResult> scanApp(String packageName) async {
    // Start the scan
    final startTime = DateTime.now();
    
    // Find the app
    final app = _installedApps.firstWhere(
      (app) => app.packageName == packageName,
      orElse: () => AppInfo(
        packageName: packageName,
        appName: 'Unknown App',
        versionName: '1.0.0',
        versionCode: 100,
        installDate: DateTime.now().toString(),
        updateDate: DateTime.now().toString(),
        appSize: '0 MB',
        isSystemApp: false,
        permissions: '',
        appIcon: '',
        isRunning: false,
      ),
    );
    
    // Simulate scan delay
    await Future.delayed(const Duration(seconds: 1));
    
    // Check if the app is malware
    List<Threat> threats = [];
    if (_malwareSignatures.contains(packageName)) {
      final threatDef = _threatDefinitions[packageName]!;
      
      threats.add(Threat(
        id: const Uuid().v4(),
        appName: app.appName,
        packageName: app.packageName,
        description: threatDef['description'] as String,
        type: threatDef['type'] as ThreatType,
        severity: threatDef['severity'] as ThreatSeverity,
        filePath: '/data/app/${app.packageName}',
        fileSize: 4200000,
        detectedTime: DateTime.now(),
      ));
    }
    
    // Calculate duration
    final endTime = DateTime.now();
    final duration = endTime.difference(startTime);
    
    // Create scan result
    final scanResult = ScanResult(
      id: const Uuid().v4(),
      scanType: ScanType.app,
      scanTime: startTime,
      duration: duration,
      scannedItems: 1,
      threats: threats,
      status: ScanStatus.completed,
    );
    
    // Save to MongoDB (if online)
    await _mongoDBService.addScanResult(scanResult);
    
    return scanResult;
  }
  
  // Background scan - used for real-time protection
  Future<ScanResult> performBackgroundScan() async {
    // Start the scan
    final startTime = DateTime.now();
    
    // Get threats but do less thorough checking
    final threats = await _scanForThreats(quick: true);
    
    // Calculate duration
    final endTime = DateTime.now();
    final duration = endTime.difference(startTime);
    
    // Create scan result
    final scanResult = ScanResult(
      id: const Uuid().v4(),
      scanType: ScanType.background,
      scanTime: startTime,
      duration: duration,
      scannedItems: _installedApps.length,
      threats: threats,
      status: ScanStatus.completed,
    );
    
    // Save to MongoDB (if online) only if threats are found
    if (threats.isNotEmpty) {
      await _mongoDBService.addScanResult(scanResult);
    }
    
    return scanResult;
  }
  
  // Scan for threats
  Future<List<Threat>> _scanForThreats({required bool quick}) async {
    List<Threat> threats = [];
    
    for (var app in _installedApps) {
      // Check if app is in our malware list
      if (_malwareSignatures.contains(app.packageName)) {
        final threatDef = _threatDefinitions[app.packageName]!;
        
        threats.add(Threat(
          id: const Uuid().v4(),
          appName: app.appName,
          packageName: app.packageName,
          description: threatDef['description'] as String,
          type: threatDef['type'] as ThreatType,
          severity: threatDef['severity'] as ThreatSeverity,
          filePath: '/data/app/${app.packageName}',
          fileSize: 4200000,
          detectedTime: DateTime.now(),
        ));
      }
    }
    
    // In a full scan, we might detect additional threats like malicious files
    if (!quick) {
      final random = Random();
      if (random.nextInt(5) == 0) {  // 20% chance to find additional threat
        threats.add(Threat(
          id: const Uuid().v4(),
          appName: 'Şüpheli Dosya',
          packageName: 'file://storage/emulated/0/Download/suspicious.apk',
          description: 'Bu APK dosyası bilinen bir zararlı yazılım imzası içeriyor.',
          type: ThreatType.malware,
          severity: ThreatSeverity.medium,
          filePath: '/storage/emulated/0/Download/suspicious.apk',
          fileSize: 3500000,
          detectedTime: DateTime.now(),
        ));
      }
    }
    
    // Add threats to the database
    for (var threat in threats) {
      await _mongoDBService.addThreat(threat);
    }
    
    return threats;
  }
  
  // Quarantine threat
  Future<bool> quarantineThreat(Threat threat) async {
    // In a real app, this would move the file to a quarantine area
    // For our demo, we'll just update the threat status
    
    threat.status = ThreatStatus.quarantined;
    
    // Update in MongoDB
    final success = await _mongoDBService.updateThreat(threat);
    
    return success;
  }
  
  // Remove threat
  Future<bool> removeThreat(Threat threat) async {
    // In a real app, this would delete the file or uninstall the app
    // For our demo, we'll just update the threat status
    
    threat.status = ThreatStatus.removed;
    
    // Update in MongoDB
    final success = await _mongoDBService.updateThreat(threat);
    
    // If it was an app, remove it from our mock installed apps
    _installedApps.removeWhere((app) => app.packageName == threat.packageName);
    _saveMockApps();
    
    return success;
  }
  
  // Ignore threat
  Future<bool> ignoreThreat(Threat threat) async {
    // Update the threat status
    threat.status = ThreatStatus.ignored;
    
    // Update in MongoDB
    final success = await _mongoDBService.updateThreat(threat);
    
    return success;
  }
  
  // Get scan history
  Future<List<ScanResult>> getScanHistory() async {
    return await _mongoDBService.getScanResults();
  }
  
  // Get threats
  Future<List<Threat>> getThreats() async {
    return await _mongoDBService.getThreats();
  }
  
  // Scan WiFi network
  Future<bool> scanWiFiNetwork() async {
    // In a real app, this would analyze the current WiFi connection
    // For our demo, we'll just return a random result
    await Future.delayed(const Duration(seconds: 2));
    return Random().nextDouble() > 0.2; // 80% chance it's secure
  }
  
  // Scan QR code
  Future<Map<String, dynamic>> scanQRCode(String qrData) async {
    // In a real app, this would analyze the QR code content for security risks
    // For our demo, we'll check for some common red flags
    
    await Future.delayed(const Duration(seconds: 1));
    
    bool isSafe = true;
    String risk = '';
    
    // Check if it's a URL
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      // Check for suspicious domains
      if (qrData.contains('bit.ly') || 
          qrData.contains('tinyurl.com') || 
          qrData.contains('goo.gl')) {
        isSafe = false;
        risk = 'QR kod kısaltılmış bir URL içeriyor. Bu tür bağlantılar tehlikeli olabilir.';
      }
      
      // Check for phishing keywords
      final phishingKeywords = ['login', 'signin', 'verify', 'account', 'password', 'secure'];
      if (phishingKeywords.any((keyword) => qrData.toLowerCase().contains(keyword))) {
        isSafe = Random().nextBool(); // 50% chance it's safe
        if (!isSafe) {
          risk = 'QR kod, oltalama saldırısı olabilecek şüpheli bir URL içeriyor.';
        }
      }
    }
    
    return {
      'isSafe': isSafe,
      'risk': risk,
      'data': qrData,
    };
  }
}