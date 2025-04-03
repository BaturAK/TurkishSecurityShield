import 'package:flutter/services.dart';
import 'package:workmanager/workmanager.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _periodicScanTaskName = 'periodicScan';
const String _bootCompleteScanTaskName = 'bootCompleteScan';

class BackgroundService {
  static const MethodChannel _channel = MethodChannel('com.example.antivirus_app/background');
  
  // Arka plan servisini başlat
  static Future<void> startService() async {
    try {
      await Workmanager().initialize(
        callbackDispatcher,
        isInDebugMode: false,
      );
      
      // Önceki kayıtları iptal et
      await Workmanager().cancelAll();
      
      // Periyodik tarama görevini kaydet
      await _registerPeriodicTask();
      
      // Cihaz açıldığında çalışan görevi kaydet
      await _registerBootCompleteTask();
      
      // Native foreground servisi başlat
      await _channel.invokeMethod('startForegroundService');
    } catch (e) {
      print('Arka plan servisi başlatılırken hata: $e');
    }
  }
  
  // Arka plan servisini durdur
  static Future<void> stopService() async {
    try {
      await Workmanager().cancelAll();
      await _channel.invokeMethod('stopForegroundService');
    } catch (e) {
      print('Arka plan servisi durdurulurken hata: $e');
    }
  }
  
  // Tarama aralığını güncelle
  static Future<void> updateInterval(Duration interval) async {
    try {
      // Önceki periyodik görevi iptal et
      await Workmanager().cancelByUniqueName(_periodicScanTaskName);
      
      // Yeni aralıkla tekrar kaydet
      await _registerPeriodicTask(interval: interval);
    } catch (e) {
      print('Tarama aralığı güncellenirken hata: $e');
    }
  }
  
  // Periyodik tarama görevini kaydet
  static Future<void> _registerPeriodicTask({Duration? interval}) async {
    final prefs = await SharedPreferences.getInstance();
    final intervalHours = interval?.inHours ?? prefs.getInt('scanInterval') ?? 24;
    
    await Workmanager().registerPeriodicTask(
      _periodicScanTaskName,
      'periodicScan',
      frequency: Duration(hours: intervalHours),
      constraints: Constraints(
        networkType: NetworkType.connected,
        batteryNotLow: true,
      ),
      existingWorkPolicy: ExistingWorkPolicy.replace,
    );
  }
  
  // Cihaz açıldığında çalışan görevi kaydet
  static Future<void> _registerBootCompleteTask() async {
    final prefs = await SharedPreferences.getInstance();
    final scanOnBoot = prefs.getBool('scanOnBootComplete') ?? true;
    
    if (scanOnBoot) {
      await Workmanager().registerOneOffTask(
        _bootCompleteScanTaskName,
        'bootCompleteScan',
        constraints: Constraints(
          networkType: NetworkType.connected,
        ),
        existingWorkPolicy: ExistingWorkPolicy.replace,
        initialDelay: const Duration(minutes: 1),
      );
    }
  }
}

// Bu fonksiyon uygulama ana işleminin dışında çalışır
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      switch (task) {
        case _periodicScanTaskName:
          await _performBackgroundScan();
          break;
        case _bootCompleteScanTaskName:
          await _performBackgroundScan();
          break;
        default:
          print('Bilinmeyen görev: $task');
      }
      
      return true;
    } catch (e) {
      print('Arka planda tarama yapılırken hata: $e');
      return false;
    }
  });
}

Future<void> _performBackgroundScan() async {
  // Burada native tarafta tarama işlemi başlatılır
  // Normalde bu, platform kanalı üzerinden tarama servisini başlatır
  
  // Simüle edilmiş uygulama: Native kod ile entegrasyon için
  // Burada gerçekte bridge kodlar olacak
  print('Arka planda tarama başlatıldı');
  
  // Şu anda, birlikte çalışma için gerekli uygulama kodunu Java/Kotlin tarafında yazmak gerekiyor
  
  // Bildirim göstermek için
  // NotificationService.showScanCompleteNotification(
  //  'Arka Plan Taraması Tamamlandı',
  //  'Cihazınız güvenle tarandı.'
  // );
}
