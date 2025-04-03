import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  
  static const NotificationDetails _platformChannelSpecifics = NotificationDetails(
    android: AndroidNotificationDetails(
      'antivirus_channel',
      'Antivirüs Bildirimleri',
      channelDescription: 'Tehdit tespiti ve tarama sonuçları için bildirimler',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    ),
    iOS: DarwinNotificationDetails(),
  );
  
  /// Bildirim servisini başlat
  static Future<void> initialize() async {
    // Zaman dilimi verisini yükle
    tz_data.initializeTimeZones();
    
    // Bildirim ayarlarını yap
    const initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initializationSettingsIOS = DarwinInitializationSettings();
    const initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );
    
    await _notifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse notificationResponse) {
        debugPrint('Bildirime tıklandı: ${notificationResponse.payload}');
        // Burada bildirime tıklandığında yapılacak işlemleri tanımlayabilirsiniz
      },
    );
  }
  
  /// Tehdit tespit edildiğinde bildirim göster
  static Future<void> showThreatNotification(
    String id,
    String title,
    String body,
  ) async {
    await _notifications.show(
      id.hashCode,
      title,
      body,
      _platformChannelSpecifics,
      payload: 'threat_$id',
    );
  }
  
  /// Tarama tamamlandığında bildirim göster
  static Future<void> showScanCompleteNotification(
    String title,
    String body,
  ) async {
    await _notifications.show(
      0,
      title,
      body,
      _platformChannelSpecifics,
      payload: 'scan_complete',
    );
  }
  
  /// Programlanmış bir bildirim oluştur
  static Future<void> scheduleNotification(
    int id,
    String title,
    String body,
    DateTime scheduledTime,
  ) async {
    await _notifications.zonedSchedule(
      id,
      title,
      body,
      tz.TZDateTime.from(scheduledTime, tz.local),
      _platformChannelSpecifics,
      androidAllowWhileIdle: true,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: 'scheduled_$id',
    );
  }
  
  /// Tüm bildirimleri iptal et
  static Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }
  
  /// Belirtilen ID'ye sahip bildirimi iptal et
  static Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }
}