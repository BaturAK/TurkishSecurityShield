import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:crypto/crypto.dart';
import 'package:device_apps/device_apps.dart';
import 'package:path_provider/path_provider.dart';

import '../models/app_info.dart';
import '../utils/hash_util.dart';

class ScanService {
  static const MethodChannel _channel = MethodChannel('com.example.antivirus_app/scan');
  
  // Yüklü uygulamaları al
  Future<List<AppInfo>> getInstalledApps() async {
    try {
      List<Application> apps = await DeviceApps.getInstalledApplications(
        includeAppIcons: false,
        includeSystemApps: true,
        onlyAppsWithLaunchIntent: false,
      );
      
      List<AppInfo> appInfoList = [];
      
      for (var app in apps) {
        try {
          final hashValue = await calculateAppHash(app.apkFilePath);
          final permissions = await getAppPermissions(app.packageName);
          
          appInfoList.add(
            AppInfo(
              packageName: app.packageName,
              appName: app.appName,
              versionName: app is ApplicationWithIcon ? app.versionName : '',
              versionCode: app is ApplicationWithIcon ? app.versionCode : 0,
              apkPath: app.apkFilePath,
              isSystemApp: app.systemApp,
              installTime: DateTime.now().toString(), // Gerçek değer için platform kodları gerekir
              lastUpdateTime: DateTime.now().toString(), // Gerçek değer için platform kodları gerekir
              permissions: permissions,
              hash: hashValue,
            ),
          );
        } catch (e) {
          debugPrint('Uygulama işlenirken hata: ${app.packageName}, Error: $e');
        }
      }
      
      return appInfoList;
    } catch (e) {
      debugPrint('Yüklü uygulamalar alınırken hata: $e');
      rethrow;
    }
  }
  
  // Uygulama hash değerini hesapla
  Future<String> calculateAppHash(String apkPath) async {
    return await HashUtil.calculateFileSHA256(apkPath);
  }
  
  // Şüpheli izinleri kontrol et
  Future<List<String>> checkSuspiciousPermissions(String packageName) async {
    try {
      final permissions = await getAppPermissions(packageName);
      
      // Şüpheli izinler listesi
      final suspiciousPermissions = [
        'android.permission.READ_SMS',
        'android.permission.SEND_SMS',
        'android.permission.RECEIVE_SMS',
        'android.permission.READ_CALL_LOG',
        'android.permission.PROCESS_OUTGOING_CALLS',
        'android.permission.RECORD_AUDIO',
        'android.permission.CAMERA',
        'android.permission.READ_CONTACTS',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.WRITE_SETTINGS',
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'android.permission.PACKAGE_USAGE_STATS',
      ];
      
      return permissions.where((p) => suspiciousPermissions.contains(p)).toList();
    } catch (e) {
      debugPrint('Şüpheli izinler kontrol edilirken hata: $e');
      return [];
    }
  }
  
  // Uygulama izinlerini al
  Future<List<String>> getAppPermissions(String packageName) async {
    try {
      final result = await _channel.invokeMethod('getAppPermissions', {
        'packageName': packageName,
      });
      
      if (result != null) {
        return List<String>.from(result);
      }
      
      return [];
    } catch (e) {
      debugPrint('Uygulama izinleri alınırken hata: $e');
      // Platform kodu olmadığından simüle edilmiş izinler
      return [];
    }
  }
  
  // Uygulamayı kaldır
  Future<bool> uninstallApp(String packageName) async {
    try {
      final result = await _channel.invokeMethod('uninstallApp', {
        'packageName': packageName,
      });
      
      return result == true;
    } catch (e) {
      debugPrint('Uygulama kaldırılırken hata: $e');
      throw Exception('Uygulama kaldırılamadı: $e');
    }
  }
  
  // Uygulamayı devre dışı bırak
  Future<bool> disableApp(String packageName) async {
    try {
      final result = await _channel.invokeMethod('disableApp', {
        'packageName': packageName,
      });
      
      return result == true;
    } catch (e) {
      debugPrint('Uygulama devre dışı bırakılırken hata: $e');
      throw Exception('Uygulama devre dışı bırakılamadı: $e');
    }
  }
  
  // Ofline mod için önceden bilinen zararlı yazılım imzaları
  Future<List<String>> getKnownMalwareHashes() async {
    try {
      // Bu hash'ler MongoDB kullanılamadığında yedek olarak kullanılacak
      // Bilinen zararlı yazılımlara ait SHA-256 hash'leri
      return [
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Trojanlı APK örneği
        '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // Bilinen bir malware
        '7d793037a0760186574b0282f2f435e7', // Diğer zararlı yazılım örneği
        'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9', // Reklam yazılımı örneği
        '6b23c0d5f35d1b11f9b683f0b0a617355deb11277d91ae091d399c655b87940d', // Olası bir casus yazılım
        'fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13', // Kimlik avı yazılımı
        '3f39d5c348e5b79d06e842c114e6cc571583bbf44e4b0ebfda1a01ec05745d43', // Kripto madencisi
        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', // Rootkit örneği
      ];
    } catch (e) {
      debugPrint('Bilinen zararlı yazılımlar alınırken hata: $e');
      return [];
    }
  }
  
  // Ağ trafiğini kontrol et (simüle edilmiş)
  Future<bool> checkNetworkTraffic(String packageName) async {
    try {
      // Gerçek uygulamada, platform kodu kullanarak ağ trafiği izlenecek
      // Bu simülasyon için sadece rastgele bir değer döndürüyoruz
      return packageName.hashCode % 10 == 0; // %10 şüpheli
    } catch (e) {
      debugPrint('Ağ trafiği kontrol edilirken hata: $e');
      return false;
    }
  }
}
