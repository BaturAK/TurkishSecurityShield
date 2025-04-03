import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app.dart';
import 'providers/scan_provider.dart';
import 'providers/settings_provider.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase başlatma
  await Firebase.initializeApp();
  
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
      ],
      child: const AntivirusApp(),
    ),
  );
}
