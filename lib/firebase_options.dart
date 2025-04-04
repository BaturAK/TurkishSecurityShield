import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Firebase yapılandırma seçenekleri
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'Web platformu için DefaultFirebaseOptions.web kullanın',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError(
          'iOS platformu desteklenmiyor',
        );
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'macOS platformu desteklenmiyor',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'Windows platformu desteklenmiyor',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'Linux platformu desteklenmiyor',
        );
      default:
        throw UnsupportedError(
          'Bilinmeyen platform $defaultTargetPlatform için DefaultFirebaseOptions mevcut değil',
        );
    }
  }

  static FirebaseOptions android = FirebaseOptions(
    apiKey: const String.fromEnvironment('FIREBASE_API_KEY'),
    appId: const String.fromEnvironment('FIREBASE_APP_ID'),
    messagingSenderId: '000000000000',
    projectId: const String.fromEnvironment('FIREBASE_PROJECT_ID'),
    storageBucket: '${const String.fromEnvironment('FIREBASE_PROJECT_ID')}.appspot.com',
  );
}