package com.example.antivirus_app.services;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.example.antivirus_app.MainActivity;
import com.example.antivirus_app.Application;
import com.example.antivirus_app.R;

import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class ScanForegroundService extends Service {
    public static final String ACTION_START_FOREGROUND = "com.example.antivirus_app.action.START_FOREGROUND";
    public static final String ACTION_START_BACKGROUND = "com.example.antivirus_app.action.START_BACKGROUND";
    public static final String ACTION_STOP = "com.example.antivirus_app.action.STOP";
    
    private static final int NOTIFICATION_ID = 1001;
    private static final String TAG = "ScanForegroundService";
    
    private Timer scanTimer;
    private ExecutorService executor;
    private AtomicBoolean isScanning = new AtomicBoolean(false);
    private Handler mainHandler;
    
    // Tarama istatistikleri
    private int scannedApps = 0;
    private int scannedFiles = 0;
    private int threatsFound = 0;
    
    @Override
    public void onCreate() {
        super.onCreate();
        mainHandler = new Handler(Looper.getMainLooper());
        executor = Executors.newSingleThreadExecutor();
        Log.d(TAG, "Service created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (action != null) {
                switch (action) {
                    case ACTION_START_FOREGROUND:
                        startForegroundService();
                        startScanSchedule();
                        break;
                    case ACTION_START_BACKGROUND:
                        startScanSchedule();
                        break;
                    case ACTION_STOP:
                        stopSelf();
                        break;
                }
            }
        }
        
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopScanSchedule();
        executor.shutdownNow();
        Log.d(TAG, "Service destroyed");
        super.onDestroy();
    }

    private void startForegroundService() {
        // Ana aktiviteye dönmek için intent
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );
        
        // Servisi durdurmak için intent
        Intent stopIntent = new Intent(this, ScanForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE
        );
        
        // Bildirim oluştur
        Notification notification = new NotificationCompat.Builder(this, Application.CHANNEL_ID)
            .setContentTitle("Antivirüs Koruması Etkin")
            .setContentText("Cihazınız gerçek zamanlı olarak korunuyor")
            .setSmallIcon(R.drawable.ic_notification) // Bu simgeyi res/drawable/ klasörüne eklemelisiniz
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Kapat", stopPendingIntent)
            .build();
        
        // Servisi ön planda başlat
        startForeground(NOTIFICATION_ID, notification);
        Log.d(TAG, "Foreground service started");
    }

    private void startScanSchedule() {
        if (scanTimer != null) {
            scanTimer.cancel();
        }
        
        scanTimer = new Timer();
        
        // Periyodik tarama zamanlaması
        scanTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                if (!isScanning.get()) {
                    performQuickScan();
                }
            }
        }, 1000, 30 * 60 * 1000); // 30 dakikada bir tarama yap
        
        Log.d(TAG, "Scan schedule started");
    }

    private void stopScanSchedule() {
        if (scanTimer != null) {
            scanTimer.cancel();
            scanTimer = null;
        }
        
        isScanning.set(false);
        Log.d(TAG, "Scan schedule stopped");
    }

    private void performQuickScan() {
        if (isScanning.getAndSet(true)) {
            return;
        }
        
        // Tarama istatistiklerini sıfırla
        scannedApps = 0;
        scannedFiles = 0;
        threatsFound = 0;
        
        Log.d(TAG, "Starting quick scan");
        updateNotification("Hızlı tarama başlatıldı", "Tarama devam ediyor...");
        
        executor.execute(() -> {
            try {
                // Yüklü uygulamaları tara
                scanInstalledApps();
                
                // Tarama tamamlandı
                Log.d(TAG, "Quick scan completed. Scanned apps: " + scannedApps + ", Files: " + scannedFiles + ", Threats: " + threatsFound);
                
                if (threatsFound > 0) {
                    // Tehdit bulundu bildirimi
                    showThreatNotification(threatsFound);
                }
                
                mainHandler.post(() -> {
                    updateNotification(
                        "Tarama tamamlandı",
                        "Taranan uygulama: " + scannedApps + " - Tehdit: " + threatsFound
                    );
                });
            } catch (Exception e) {
                Log.e(TAG, "Error during scan", e);
                mainHandler.post(() -> {
                    updateNotification("Tarama hatası", e.getMessage());
                });
            } finally {
                isScanning.set(false);
            }
        });
    }

    private void scanInstalledApps() {
        PackageManager packageManager = getPackageManager();
        List<PackageInfo> packages = packageManager.getInstalledPackages(0);
        
        for (PackageInfo packageInfo : packages) {
            ApplicationInfo appInfo = packageInfo.applicationInfo;
            
            // Sistem uygulamalarını atla
            if ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                scannedApps++;
                
                // APK dosya yolunu al
                String apkPath = appInfo.sourceDir;
                
                // Normalde, burada APK dosyasının hash'i hesaplanır ve veritabanı ile karşılaştırılır
                // Örnek olarak, basit bir simülasyon yapıyoruz
                if (shouldFlagAsSuspicious(packageInfo.packageName, apkPath)) {
                    threatsFound++;
                }
                
                // İşlemciyi çok fazla kullanmamak için kısa bir bekleme
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    Log.e(TAG, "Scan interrupted", e);
                    return;
                }
            }
        }
    }

    private boolean shouldFlagAsSuspicious(String packageName, String apkPath) {
        // Bu örnek için, belirli isim desenlerini içeren paketleri şüpheli olarak işaretliyoruz
        // Gerçek bir antivirüs yazılımında, hash veritabanları, davranış analizi vb. kullanılır
        String[] suspiciousPatterns = {
            "hack", "crack", "cheat", "spy", "track", "malware", "trojan"
        };
        
        String lowerPackageName = packageName.toLowerCase();
        for (String pattern : suspiciousPatterns) {
            if (lowerPackageName.contains(pattern)) {
                return true;
            }
        }
        
        return false;
    }

    private void updateNotification(String title, String text) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification notification = new NotificationCompat.Builder(this, Application.CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(R.drawable.ic_notification)
                .build();
                
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.notify(NOTIFICATION_ID, notification);
        }
    }

    private void showThreatNotification(int threatCount) {
        // Ana aktiviteye dönmek için intent
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            2,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );
        
        String title = threatCount + " tehdit tespit edildi!";
        String text = "Cihazınızda " + threatCount + " tehdit tespit edildi. Detaylar için tıklayın.";
        
        Notification notification = new NotificationCompat.Builder(this, Application.THREAT_NOTIFICATION_CHANNEL)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build();
            
        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        notificationManager.notify(1002, notification);
    }
}