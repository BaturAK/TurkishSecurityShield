#!/bin/bash

# Flutter Antivirüs Uygulaması APK Oluşturma Betiği
echo "Flutter Antivirüs Uygulaması APK oluşturma işlemi başlatılıyor..."

# Geliştirme ortamını kontrol et
echo "Flutter ortamı kontrol ediliyor..."
flutter doctor

# Bağımlılıkları güncelle
echo "Proje bağımlılıkları güncelleniyor..."
flutter pub get

# Eski derleme klasörlerini temizle
echo "Eski derleme dosyaları temizleniyor..."
flutter clean

# Debug APK Oluştur
echo "Debug APK oluşturuluyor..."
flutter build apk --debug
if [ $? -eq 0 ]; then
    echo "Debug APK başarıyla oluşturuldu: build/app/outputs/flutter-apk/app-debug.apk"
else
    echo "Debug APK oluşturma başarısız!"
    exit 1
fi

# Release APK Oluştur
echo "Release APK oluşturuluyor..."
flutter build apk --release
if [ $? -eq 0 ]; then
    echo "Release APK başarıyla oluşturuldu: build/app/outputs/flutter-apk/app-release.apk"
else
    echo "Release APK oluşturma başarısız!"
    exit 1
fi

# Farklı mimari versiyonları için Split APK'lar oluştur
echo "Split APK'lar oluşturuluyor..."
flutter build apk --split-per-abi --release
if [ $? -eq 0 ]; then
    echo "Split APK'lar başarıyla oluşturuldu:"
    echo "- build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk (ARM v7)"
    echo "- build/app/outputs/flutter-apk/app-arm64-v8a-release.apk (ARM64)"
    echo "- build/app/outputs/flutter-apk/app-x86_64-release.apk (x86_64)"
else
    echo "Split APK oluşturma başarısız!"
    exit 1
fi

# App Bundle Oluştur (Google Play Store için)
echo "App Bundle oluşturuluyor..."
flutter build appbundle --release
if [ $? -eq 0 ]; then
    echo "App Bundle başarıyla oluşturuldu: build/app/outputs/bundle/release/app-release.aab"
else
    echo "App Bundle oluşturma başarısız!"
    exit 1
fi

echo "APK oluşturma işlemi tamamlandı!"
echo "Oluşturulan dosyaları şu konumlarda bulabilirsiniz:"
echo "- Debug APK: build/app/outputs/flutter-apk/app-debug.apk"
echo "- Release APK: build/app/outputs/flutter-apk/app-release.apk"
echo "- ARM v7 APK: build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk"
echo "- ARM64 APK: build/app/outputs/flutter-apk/app-arm64-v8a-release.apk"
echo "- x86_64 APK: build/app/outputs/flutter-apk/app-x86_64-release.apk"
echo "- App Bundle: build/app/outputs/bundle/release/app-release.aab"