import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

class SettingsProvider extends ChangeNotifier {
  final _settingsBox = Hive.box('settings');
  
  // Varsayılan ayarlar
  static const _defaultDarkMode = false;
  static const _defaultBackgroundScanEnabled = true;
  static const _defaultBackgroundScanIntervalHours = 24;
  static const _defaultRealTimeProtectionEnabled = true;
  static const _defaultNotificationsEnabled = true;
  static const _defaultAutoUpdateEnabled = true;
  static const _defaultAppLockEnabled = false;
  static const _defaultAppLockPin = '';
  static const _defaultVpnEnabled = false;
  static const _defaultLanguage = 'tr';
  
  bool get darkMode => _settingsBox.get('darkMode', defaultValue: _defaultDarkMode);
  bool get backgroundScanEnabled => _settingsBox.get('backgroundScanEnabled', defaultValue: _defaultBackgroundScanEnabled);
  int get backgroundScanIntervalHours => _settingsBox.get('backgroundScanIntervalHours', defaultValue: _defaultBackgroundScanIntervalHours);
  bool get realTimeProtectionEnabled => _settingsBox.get('realTimeProtectionEnabled', defaultValue: _defaultRealTimeProtectionEnabled);
  bool get notificationsEnabled => _settingsBox.get('notificationsEnabled', defaultValue: _defaultNotificationsEnabled);
  bool get autoUpdateEnabled => _settingsBox.get('autoUpdateEnabled', defaultValue: _defaultAutoUpdateEnabled);
  bool get appLockEnabled => _settingsBox.get('appLockEnabled', defaultValue: _defaultAppLockEnabled);
  String get appLockPin => _settingsBox.get('appLockPin', defaultValue: _defaultAppLockPin);
  bool get vpnEnabled => _settingsBox.get('vpnEnabled', defaultValue: _defaultVpnEnabled);
  String get language => _settingsBox.get('language', defaultValue: _defaultLanguage);
  
  Future<void> setDarkMode(bool value) async {
    await _settingsBox.put('darkMode', value);
    notifyListeners();
  }
  
  Future<void> setBackgroundScanEnabled(bool value) async {
    await _settingsBox.put('backgroundScanEnabled', value);
    notifyListeners();
  }
  
  Future<void> setBackgroundScanIntervalHours(int value) async {
    await _settingsBox.put('backgroundScanIntervalHours', value);
    notifyListeners();
  }
  
  Future<void> setRealTimeProtectionEnabled(bool value) async {
    await _settingsBox.put('realTimeProtectionEnabled', value);
    notifyListeners();
  }
  
  Future<void> setNotificationsEnabled(bool value) async {
    await _settingsBox.put('notificationsEnabled', value);
    notifyListeners();
  }
  
  Future<void> setAutoUpdateEnabled(bool value) async {
    await _settingsBox.put('autoUpdateEnabled', value);
    notifyListeners();
  }
  
  Future<void> setAppLockEnabled(bool value) async {
    await _settingsBox.put('appLockEnabled', value);
    notifyListeners();
  }
  
  Future<void> setAppLockPin(String value) async {
    await _settingsBox.put('appLockPin', value);
    notifyListeners();
  }
  
  Future<void> setVpnEnabled(bool value) async {
    await _settingsBox.put('vpnEnabled', value);
    notifyListeners();
  }
  
  Future<void> setLanguage(String value) async {
    await _settingsBox.put('language', value);
    notifyListeners();
  }
  
  Future<void> resetSettings() async {
    await _settingsBox.put('darkMode', _defaultDarkMode);
    await _settingsBox.put('backgroundScanEnabled', _defaultBackgroundScanEnabled);
    await _settingsBox.put('backgroundScanIntervalHours', _defaultBackgroundScanIntervalHours);
    await _settingsBox.put('realTimeProtectionEnabled', _defaultRealTimeProtectionEnabled);
    await _settingsBox.put('notificationsEnabled', _defaultNotificationsEnabled);
    await _settingsBox.put('autoUpdateEnabled', _defaultAutoUpdateEnabled);
    await _settingsBox.put('appLockEnabled', _defaultAppLockEnabled);
    await _settingsBox.put('appLockPin', _defaultAppLockPin);
    await _settingsBox.put('vpnEnabled', _defaultVpnEnabled);
    await _settingsBox.put('language', _defaultLanguage);
    notifyListeners();
  }
}