import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/premium_screen.dart';
import 'screens/scan_results_screen.dart';
import 'screens/settings_screen.dart';
import 'providers/auth_provider.dart';
import 'utils/constants.dart';

class AntivirusApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Sistem barlarını güncelle
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
    );

    return MaterialApp(
      title: 'AntiVirüs',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        primaryColor: AppColors.primaryColor,
        accentColor: AppColors.accentColor,
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Roboto',
        appBarTheme: AppBarTheme(
          color: Colors.white,
          elevation: 0,
          iconTheme: IconThemeData(color: AppColors.primaryColor),
          textTheme: TextTheme(
            headline6: TextStyle(
              color: AppColors.textPrimaryColor,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        buttonTheme: ButtonThemeData(
          buttonColor: AppColors.primaryColor,
          textTheme: ButtonTextTheme.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
        ),
      ),
      routes: {
        '/': (context) => AuthWrapper(),
        '/home': (context) => HomeScreen(),
        '/login': (context) => LoginScreen(),
        '/premium': (context) => PremiumScreen(),
        '/scan_results': (context) => ScanResultsScreen(),
        '/settings': (context) => SettingsScreen(),
      },
      initialRoute: '/',
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    // Kullanıcı oturum durumuna göre doğru ekranı göster
    if (authProvider.isLoggedIn) {
      return HomeScreen();
    } else {
      return LoginScreen();
    }
  }
}