package com.example.antivirus_app

import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugins.GeneratedPluginRegistrant
import com.example.antivirus_app.services.ScanForegroundService

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.antivirus_app/scan"
    private val BACKGROUND_CHANNEL = "com.example.antivirus_app/background"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        GeneratedPluginRegistrant.registerWith(flutterEngine)
        
        // Tarama kanalı
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getAppPermissions" -> {
                    val packageName = call.argument<String>("packageName")
                    if (packageName != null) {
                        result.success(getAppPermissions(packageName))
                    } else {
                        result.error("INVALID_ARGUMENT", "Package name is required", null)
                    }
                }
                "uninstallApp" -> {
                    val packageName = call.argument<String>("packageName")
                    if (packageName != null) {
                        uninstallApp(packageName)
                        result.success(true)
                    } else {
                        result.error("INVALID_ARGUMENT", "Package name is required", null)
                    }
                }
                "disableApp" -> {
                    val packageName = call.argument<String>("packageName")
                    if (packageName != null) {
                        disableApp(packageName)
                        result.success(true)
                    } else {
                        result.error("INVALID_ARGUMENT", "Package name is required", null)
                    }
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
        
        // Arka plan kanalı
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, BACKGROUND_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "startForegroundService" -> {
                    startForegroundService()
                    result.success(true)
                }
                "stopForegroundService" -> {
                    stopForegroundService()
                    result.success(true)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }
    
    // Uygulama izinlerini al
    private fun getAppPermissions(packageName: String): List<String> {
        val pm = context.packageManager
        return try {
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(PackageManager.GET_PERMISSIONS.toLong()))
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            }
            
            packageInfo.requestedPermissions?.toList() ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    // Uygulamayı kaldır
    private fun uninstallApp(packageName: String) {
        val intent = Intent(Intent.ACTION_DELETE)
        intent.data = android.net.Uri.parse("package:$packageName")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }
    
    // Uygulamayı devre dışı bırak
    private fun disableApp(packageName: String) {
        // Not: Bu işlev cihaz yönetici iznine veya root erişimine ihtiyaç duyar
        // Bu örnek için gerçek bir implementasyon sağlamıyoruz
        // Gerçek uygulamada, bu işlev için Device Policy Manager kullanılabilir
    }
    
    // Foreground servisi başlat
    private fun startForegroundService() {
        val serviceIntent = Intent(this, ScanForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
    
    // Foreground servisi durdur
    private fun stopForegroundService() {
        val serviceIntent = Intent(this, ScanForegroundService::class.java)
        stopService(serviceIntent)
    }
}
