package com.example.antivirus_app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import android.app.PendingIntent;
import android.app.Notification;

import com.example.antivirus_app.Application;
import com.example.antivirus_app.MainActivity;
import com.example.antivirus_app.R;

import java.util.Arrays;
import java.util.List;

public class PackageChangeReceiver extends BroadcastReceiver {
    private static final String TAG = "PackageChangeReceiver";
    private static final String PREF_FILE = "com.example.antivirus_app.preferences";
    private static final String PREF_APP_SCAN_ENABLED = "app_scan_enabled";
    private static final int NOTIFICATION_ID = 2001;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;
        
        // Uygulama kurulum ve güncelleme olaylarını izle
        if (action.equals(Intent.ACTION_PACKAGE_ADDED) || 
            action.equals(Intent.ACTION_PACKAGE_REPLACED)) {
            
            // Ayarlardan tarama özelliği açık mı kontrol et
            SharedPreferences prefs = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE);
            boolean scanEnabled = prefs.getBoolean(PREF_APP_SCAN_ENABLED, true);
            
            if (!scanEnabled) {
                Log.d(TAG, "App scan disabled in settings");
                return;
            }
            
            // Kurulan/güncellenen uygulama paketini al
            String packageName = intent.getData().getSchemeSpecificPart();
            Log.d(TAG, "Package event: " + action + " for " + packageName);
            
            try {
                // Uygulama bilgilerini al
                PackageManager packageManager = context.getPackageManager();
                PackageInfo packageInfo = packageManager.getPackageInfo(packageName, 0);
                ApplicationInfo appInfo = packageInfo.applicationInfo;
                
                // Uygulama adı
                String appName = appInfo.loadLabel(packageManager).toString();
                
                // Şüpheli davranış içeren uygulamaları tespit et
                if (isSuspiciousApp(packageName, appInfo)) {
                    // Şüpheli uygulama bildirimi gönder
                    showSuspiciousAppNotification(context, packageName, appName);
                } else {
                    Log.d(TAG, "App " + appName + " installed/updated, no suspicious behavior detected");
                }
            } catch (PackageManager.NameNotFoundException e) {
                Log.e(TAG, "Could not find package info", e);
            }
        }
    }
    
    private boolean isSuspiciousApp(String packageName, ApplicationInfo appInfo) {
        // Şüpheli izinleri kontrol et
        List<String> suspiciousPermissions = Arrays.asList(
            "android.permission.READ_SMS",
            "android.permission.RECEIVE_SMS",
            "android.permission.SEND_SMS",
            "android.permission.CALL_PHONE",
            "android.permission.READ_CONTACTS",
            "android.permission.WRITE_CONTACTS",
            "android.permission.RECORD_AUDIO",
            "android.permission.CAMERA",
            "android.permission.READ_CALL_LOG"
        );
        
        // Şüpheli uygulama isimleri
        List<String> suspiciousPatterns = Arrays.asList(
            "hack", "crack", "cheat", "spy", "track", "malware"
        );
        
        // Paket adında şüpheli desenler var mı kontrol et
        String lowerPackageName = packageName.toLowerCase();
        for (String pattern : suspiciousPatterns) {
            if (lowerPackageName.contains(pattern)) {
                Log.d(TAG, "Suspicious pattern found in package name: " + pattern);
                return true;
            }
        }
        
        // Gerçek uygulamada burada daha karmaşık analizler yapılabilir
        // Örneğin, APK dosyasının hash'i çıkarılarak known-malware veritabanı ile karşılaştırılabilir
        
        return false;
    }
    
    private void showSuspiciousAppNotification(Context context, String packageName, String appName) {
        // Ana aktiviteye dönmek için intent
        Intent notificationIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );
        
        // Bildirim oluştur
        String title = "Şüpheli Uygulama Tespit Edildi";
        String text = appName + " uygulaması şüpheli olarak tespit edildi. Detaylar için tıklayın.";
        
        Notification notification = new NotificationCompat.Builder(context, Application.THREAT_NOTIFICATION_CHANNEL)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build();
            
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        notificationManager.notify(NOTIFICATION_ID, notification);
        
        Log.d(TAG, "Suspicious app notification shown for: " + appName);
    }
}