package com.example.antivirus_app;

import io.flutter.app.FlutterApplication;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

public class Application extends FlutterApplication {
    public static final String CHANNEL_ID = "antivirus_scan_channel";
    public static final String SCAN_NOTIFICATION_CHANNEL = "antivirus_scan_notifications";
    public static final String THREAT_NOTIFICATION_CHANNEL = "antivirus_threat_notifications";
    
    private static final String TAG = "Application";

    @Override
    public void onCreate() {
        super.onCreate();
        
        // Bildirim kanallarını oluştur
        createNotificationChannels();
        
        Log.d(TAG, "Application started");
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Tarama kanalı
            NotificationChannel scanChannel = new NotificationChannel(
                SCAN_NOTIFICATION_CHANNEL,
                "Tarama Bildirimleri",
                NotificationManager.IMPORTANCE_LOW
            );
            scanChannel.setDescription("Antivirüs tarama işlemleri için bildirimler");
            
            // Tehdit uyarıları kanalı
            NotificationChannel threatChannel = new NotificationChannel(
                THREAT_NOTIFICATION_CHANNEL,
                "Tehdit Uyarıları",
                NotificationManager.IMPORTANCE_HIGH
            );
            threatChannel.setDescription("Tespit edilen tehditlere ilişkin önemli uyarılar");
            threatChannel.enableVibration(true);
            threatChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
            
            // Foreground service kanalı
            NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "Antivirüs Servis",
                NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Arka planda çalışan antivirüs koruma servisi için bildirim");
            
            // Kanalları kaydet
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(scanChannel);
            manager.createNotificationChannel(threatChannel);
            manager.createNotificationChannel(serviceChannel);
            
            Log.d(TAG, "Notification channels created");
        }
    }
}