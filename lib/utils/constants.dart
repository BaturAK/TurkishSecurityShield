import 'package:flutter/material.dart';

/// Uygulama Renk Teması
class AppColors {
  static const primaryColor = Color(0xFF2196F3);
  static const accentColor = Color(0xFF1565C0);
  static const secondaryColor = Color(0xFFFF9800);
  static const backgroundColor = Color(0xFFF5F5F5);
  static const textPrimaryColor = Color(0xFF212121);
  static const textSecondaryColor = Color(0xFF757575);
  static const captionColor = Color(0xFF9E9E9E);
  static const dividerColor = Color(0xFFE0E0E0);
  
  static const errorColor = Color(0xFFF44336);
  static const successColor = Color(0xFF4CAF50);
  static const warningColor = Color(0xFFFF9800);
  
  static const scanComplete = Color(0xFF4CAF50);
  static const scanWarning = Color(0xFFFF9800);
  static const scanInProgress = Color(0xFF2196F3);
  static const scanError = Color(0xFFF44336);
}

/// Uygulama Metinleri
class AppTexts {
  static const appName = 'Antivirüs Koruma';
  
  // Ana Sayfa
  static const securityStatus = 'Güvenlik Durumu';
  static const deviceProtected = 'Cihazınız Korunuyor';
  static const deviceVulnerable = 'Tehditler Tespit Edildi';
  static const scanNow = 'Şimdi Tara';
  static const quickScan = 'Hızlı Tarama';
  static const fullScan = 'Tam Tarama';
  static const wifiScan = 'Wi-Fi Taraması';
  static const qrScan = 'QR Kod Taraması';
  static const apkScan = 'APK Taraması';
  
  // Tarama Sonuçları
  static const scanResults = 'Tarama Sonuçları';
  static const scanCompleted = 'Tarama Tamamlandı';
  static const scanInProgress = 'Tarama Devam Ediyor';
  static const threatsFound = 'Tehdit Tespit Edildi';
  static const scanDate = 'Tarama Tarihi';
  static const duration = 'Süre';
  static const totalScanned = 'Taranan Öğe';
  static const clean = 'Temizle';
  static const cleanAll = 'Tümünü Temizle';
  static const details = 'Detaylar';
  
  // Premium
  static const goPremium = 'Premium\'a Geç';
  static const premiumTitle = 'Premium Özellikleri';
  static const alreadyPremium = 'Premium Üyelik Aktif';
  static const premiumDescription = 'Daha fazla güvenlik ve koruma için tüm özellikleri açın.';
  static const enterPremiumCode = 'Premium Kodunuzu Girin';
  static const activate = 'Etkinleştir';
  static const activationSuccess = 'Premium başarıyla etkinleştirildi!';
  static const invalidCode = 'Geçersiz kod. Lütfen tekrar deneyin.';
  static const activationFailed = 'Etkinleştirme başarısız. Lütfen tekrar deneyin.';
  static const premiumFeatures = 'Premium Özellikler';
  
  // Premium Özellikler
  static const premiumFeatureTitle1 = 'Gerçek Zamanlı Koruma';
  static const premiumFeatureDesc1 = 'Uygulamaları ve dosyaları indirildiği anda otomatik olarak tarar ve tehditleri engeller.';
  
  static const premiumFeatureTitle2 = 'VPN Koruması';
  static const premiumFeatureDesc2 = 'Güvenli ve anonim internet bağlantısı için VPN hizmeti.';
  
  static const premiumFeatureTitle3 = 'Uygulama Kilidi';
  static const premiumFeatureDesc3 = 'Hassas uygulamalarınızı şifre veya biyometrik doğrulama ile koruyun.';
  
  static const premiumFeatureTitle4 = 'Reklam Engelleyici';
  static const premiumFeatureDesc4 = 'Web tarayıcıları ve uygulamalardaki rahatsız edici reklamları engeller.';
  
  // Genel
  static const settings = 'Ayarlar';
  static const help = 'Yardım';
  static const about = 'Hakkında';
  static const logout = 'Çıkış Yap';
  static const cancel = 'İptal';
}

/// Tarama Tipleri
class ScanTypes {
  static const quick = 'QUICK';
  static const full = 'FULL';
  static const wifi = 'WIFI';
  static const qr = 'QR';
  static const apk = 'APK';
  static const custom = 'CUSTOM';
}

/// Uygulama Config
class AppConfig {
  static const apiBaseUrl = 'http://10.0.2.2:5000/api'; // Android Emülatör için localhost
  static const premiumCode = '7426270308'; // Demo: Premium aktivasyon kodu
  static const packageName = 'com.example.antivirus_app';
  static const updateCheckInterval = Duration(hours: 12);
  static const scanTimeoutDuration = Duration(minutes: 30);
}

/// API Endpoints
class ApiEndpoints {
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const getUserInfo = '/users/';
  static const startScan = '/scans/start';
  static const getScanStatus = '/scans/';
  static const getThreats = '/threats';
  static const cleanThreat = '/threats/clean';
  static const activatePremium = '/premium/activate';
  static const checkPremium = '/premium/check';
}

/// Bildirim Kanalları
class NotificationChannels {
  static const scanResults = 'scan_results';
  static const threatAlerts = 'threat_alerts';
  static const updates = 'app_updates';
  static const premium = 'premium_notifications';
}