import 'package:flutter/foundation.dart';
import '../services/local_storage_service.dart';

class SettingsProvider with ChangeNotifier {
  // Varsayılan ayarlar
  static const Map<String, dynamic> _defaultSettings = {
    'autoScan': true,
    'scanOnAppInstall': true,
    'scanOnDownload': true,
    'realTimeProtection': true,
    'autoUpdate': true,
    'darkMode': false,
    'notifications': true,
    'scanSchedule': 'weekly', // daily, weekly, monthly
    'scanScheduleDayOfWeek': 1, // 1 = Pazartesi
    'scanScheduleHour': 14, // 14:00
    'scanScheduleMinute': 0,
    'language': 'tr',
    'wifiScanEnabled': true,
    'appLockEnabled': false,
    'useBiometrics': false,
    'vpnEnabled': false,
    'adBlockerEnabled': false,
  };
  
  Map<String, dynamic> _settings = Map.from(_defaultSettings);
  bool _isLoading = false;
  String? _error;
  final LocalStorageService _storage = LocalStorageService();

  // Getters
  Map<String, dynamic> get settings => _settings;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Spesifik ayarlar için getter'lar
  bool get autoScan => _settings['autoScan'] ?? _defaultSettings['autoScan'];
  bool get scanOnAppInstall => _settings['scanOnAppInstall'] ?? _defaultSettings['scanOnAppInstall'];
  bool get scanOnDownload => _settings['scanOnDownload'] ?? _defaultSettings['scanOnDownload'];
  bool get realTimeProtection => _settings['realTimeProtection'] ?? _defaultSettings['realTimeProtection'];
  bool get autoUpdate => _settings['autoUpdate'] ?? _defaultSettings['autoUpdate'];
  bool get darkMode => _settings['darkMode'] ?? _defaultSettings['darkMode'];
  bool get notifications => _settings['notifications'] ?? _defaultSettings['notifications'];
  String get scanSchedule => _settings['scanSchedule'] ?? _defaultSettings['scanSchedule'];
  String get language => _settings['language'] ?? _defaultSettings['language'];
  bool get wifiScanEnabled => _settings['wifiScanEnabled'] ?? _defaultSettings['wifiScanEnabled'];
  bool get appLockEnabled => _settings['appLockEnabled'] ?? _defaultSettings['appLockEnabled'];
  bool get useBiometrics => _settings['useBiometrics'] ?? _defaultSettings['useBiometrics'];
  bool get vpnEnabled => _settings['vpnEnabled'] ?? _defaultSettings['vpnEnabled'];
  bool get adBlockerEnabled => _settings['adBlockerEnabled'] ?? _defaultSettings['adBlockerEnabled'];

  SettingsProvider() {
    _loadSettings();
  }

  // Ayarları yükle
  Future<void> _loadSettings() async {
    try {
      _isLoading = true;
      notifyListeners();

      final savedSettings = await _storage.getSettings();
      
      if (savedSettings != null) {
        _settings = savedSettings;
      } else {
        // Kayıtlı ayarlar yoksa varsayılan ayarları kullan
        _settings = Map.from(_defaultSettings);
        // Varsayılan ayarları kaydet
        await _storage.saveSettings(_settings);
      }
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = 'Ayarlar yüklenirken bir hata oluştu: $e';
      notifyListeners();
    }
  }

  // Tüm ayarları güncelle
  Future<bool> updateSettings(Map<String, dynamic> newSettings) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Ayarları güncelle
      _settings = {..._settings, ...newSettings};
      
      // Güncellenmiş ayarları kaydet
      await _storage.saveSettings(_settings);
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = 'Ayarlar güncellenirken bir hata oluştu: $e';
      notifyListeners();
      return false;
    }
  }

  // Tek bir ayarı güncelle
  Future<bool> updateSetting(String key, dynamic value) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Ayarı güncelle
      _settings[key] = value;
      
      // Güncellenmiş ayarları kaydet
      await _storage.saveSettings(_settings);
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = 'Ayar güncellenirken bir hata oluştu: $e';
      notifyListeners();
      return false;
    }
  }

  // Tema değiştir
  Future<bool> toggleDarkMode() async {
    final newValue = !darkMode;
    return await updateSetting('darkMode', newValue);
  }

  // Dil değiştir
  Future<bool> changeLanguage(String languageCode) async {
    return await updateSetting('language', languageCode);
  }

  // Gerçek zamanlı korumayı aç/kapat
  Future<bool> toggleRealTimeProtection() async {
    final newValue = !realTimeProtection;
    return await updateSetting('realTimeProtection', newValue);
  }

  // Bildirimleri aç/kapat
  Future<bool> toggleNotifications() async {
    final newValue = !notifications;
    return await updateSetting('notifications', newValue);
  }

  // Varsayılan ayarlara dön
  Future<bool> resetToDefaults() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Varsayılan ayarları kullan
      _settings = Map.from(_defaultSettings);
      
      // Varsayılan ayarları kaydet
      await _storage.saveSettings(_settings);
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = 'Ayarlar sıfırlanırken bir hata oluştu: $e';
      notifyListeners();
      return false;
    }
  }
}