import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'screens/home_screen.dart';
import 'screens/scan_results_screen.dart';
import 'screens/settings_screen.dart';
import 'services/mongodb_service.dart';
import 'providers/scan_provider.dart';

class AntivirusApp extends StatelessWidget {
  const AntivirusApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // MongoDBService örneğini al
    final mongoDBService = Provider.of<MongoDBService>(context, listen: false);
    
    // ScanProvider'a MongoDB servisini enjekte et
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    scanProvider.setMongoDBService(mongoDBService);
    
    return MaterialApp(
      title: 'AntiVirüs Uygulaması',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('tr', 'TR'),
        Locale('en', 'US'),
      ],
      locale: const Locale('tr', 'TR'),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/scanResults': (context) => const ScanResultsScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}
