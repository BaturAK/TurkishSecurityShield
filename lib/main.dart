import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app.dart';
import 'providers/scan_provider.dart';
import 'providers/settings_provider.dart';
import 'services/notification_service.dart';
import 'services/mongodb_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // MongoDB servisini başlat
  final mongoDBService = MongoDBService();
  try {
    await mongoDBService.connect();
    debugPrint('MongoDB bağlantısı başarılı');
  } catch (e) {
    debugPrint('MongoDB bağlantısı başarısız: $e');
    // Uygulama çökmemeli, ofline modda çalışabilmeli
  }
  
  // Hive başlatma
  await Hive.initFlutter();
  await Hive.openBox('settings');
  await Hive.openBox('scan_results');
  
  // Bildirim servisini başlat
  await NotificationService.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ScanProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        Provider<MongoDBService>.value(value: mongoDBService),
      ],
      child: const AntivirusApp(),
    ),
  );
}
