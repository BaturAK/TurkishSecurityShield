# Flutter özellikleri için korunacak kurallar
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.plugin.editing.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keepnames class com.google.firebase.** { *; }
-keepnames class com.firebase.** { *; }

# Http requests
-keep class com.google.gson.** { *; }
-keep public class com.google.gson.** {public private protected *;}
-keep class org.apache.http.** { *; }
-keepattributes *Annotation*

# Model sınıflarını koru
-keep class com.example.antivirus_app.models.** { *; }

# SharedPreferences
-keep class androidx.preference.Preference** { *; }

# Local Auth
-keep class androidx.biometric.** { *; }

# QR Scanner
-keep class com.google.zxing.** { *; }

# Cihaz bilgi modülleri
-keep class android.os.** { *; }
-keep class android.provider.** { *; }
-keep class android.net.** { *; }
-keep class android.content.** { *; }

# WorkManager
-keep class androidx.work.** { *; }