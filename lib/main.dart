import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/firebase_service.dart';
import 'providers/auth_provider.dart';
import 'providers/scan_provider.dart';
import 'providers/premium_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/home_screen.dart';
import 'screens/premium_screen.dart';
import 'screens/scan_results_screen.dart';
import 'utils/constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase'i başlat
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await FirebaseService.init();
  } catch (e) {
    print('Firebase initialization error: $e');
  }
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ScanProvider()),
        ChangeNotifierProvider(create: (_) => PremiumProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: const AntivirusApp(),
    ),
  );
}

class AntivirusApp extends StatelessWidget {
  const AntivirusApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Ayarlar provider'ından tema tercihi
    final settingsProvider = Provider.of<SettingsProvider>(context);
    final darkMode = settingsProvider.darkMode;

    return MaterialApp(
      title: AppTexts.appName,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        primaryColor: AppColors.primaryColor,
        hintColor: AppColors.accentColor,
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 1,
          centerTitle: true,
        ),
        fontFamily: 'Roboto',
        textTheme: TextTheme(
          bodyLarge: TextStyle(
            color: AppColors.textPrimaryColor,
            fontSize: 16,
          ),
          bodyMedium: TextStyle(
            color: AppColors.textSecondaryColor,
            fontSize: 14,
          ),
          titleLarge: TextStyle(
            color: AppColors.textPrimaryColor,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.blue,
        primaryColor: AppColors.primaryColor,
        hintColor: AppColors.accentColor,
        scaffoldBackgroundColor: Color(0xFF121212),
        appBarTheme: AppBarTheme(
          backgroundColor: Color(0xFF1E1E1E),
          elevation: 1,
          centerTitle: true,
        ),
        fontFamily: 'Roboto',
        textTheme: TextTheme(
          bodyLarge: TextStyle(
            color: Colors.white.withOpacity(0.9),
            fontSize: 16,
          ),
          bodyMedium: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 14,
          ),
          titleLarge: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      themeMode: darkMode ? ThemeMode.dark : ThemeMode.light,
      
      // Başlangıç rotası
      initialRoute: '/home',
      
      // Tanımlı rotalar
      routes: {
        '/home': (context) => HomeScreen(),
        '/premium': (context) => PremiumScreen(),
        '/scan_results': (context) => ScanResultsScreen(),
      },
    );
  }
}