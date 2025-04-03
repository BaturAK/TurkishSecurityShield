import 'package:flutter/material.dart';
import 'package:hive/hive.dart';

class SettingsProvider extends ChangeNotifier {
  final _settingsBox = Hive.box('settings');
  
  // Varsayılan ayarlar
  static const _defaultAutomaticScanning = true;
  static const _defaultScanInterval = 24; // saat
  static const _defaultScanOnBootComplete = true;
  static const _defaultScanNewApps = true;
  static const _defaultNotificationsEnabled = true;
  static const _defaultDarkMode = ThemeMode.system;
  
  // Getter metodları
  bool get automaticScanning => _settingsBox.get('automaticScanning', defaultValue: _defaultAutomaticScanning);
  int get scanInterval => _settingsBox.get('scanInterval', defaultValue: _defaultScanInterval);
  bool get scanOnBootComplete => _settingsBox.get('scanOnBootComplete', defaultValue: _defaultScanOnBootComplete);
  bool get scanNewApps => _settingsBox.get('scanNewApps', defaultValue: _defaultScanNewApps);
  bool get notificationsEnabled => _settingsBox.get('notificationsEnabled', defaultValue: _defaultNotificationsEnabled);
  ThemeMode get themeMode {
    final themeModeIndex = _settingsBox.get('themeMode', defaultValue: _defaultDarkMode.index);
    return ThemeMode.values[themeModeIndex];
  }
  
  Duration get scanIntervalDuration => Duration(hours: scanInterval);
  
  // Setter metodları
  Future<void> setAutomaticScanning(bool value) async {
    await _settingsBox.put('automaticScanning', value);
    notifyListeners();
  }
  
  Future<void> setScanInterval(int hours) async {
    await _settingsBox.put('scanInterval', hours);
    notifyListeners();
  }
  
  Future<void> setScanOnBootComplete(bool value) async {
    await _settingsBox.put('scanOnBootComplete', value);
    notifyListeners();
  }
  
  Future<void> setScanNewApps(bool value) async {
    await _settingsBox.put('scanNewApps', value);
    notifyListeners();
  }
  
  Future<void> setNotificationsEnabled(bool value) async {
    await _settingsBox.put('notificationsEnabled', value);
    notifyListeners();
  }
  
  Future<void> setThemeMode(ThemeMode mode) async {
    await _settingsBox.put('themeMode', mode.index);
    notifyListeners();
  }
  
  // Ayarları sıfırlama
  Future<void> resetSettings() async {
    await _settingsBox.put('automaticScanning', _defaultAutomaticScanning);
    await _settingsBox.put('scanInterval', _defaultScanInterval);
    await _settingsBox.put('scanOnBootComplete', _defaultScanOnBootComplete);
    await _settingsBox.put('scanNewApps', _defaultScanNewApps);
    await _settingsBox.put('notificationsEnabled', _defaultNotificationsEnabled);
    await _settingsBox.put('themeMode', _defaultDarkMode.index);
    notifyListeners();
  }
}
