package com.example.antivirus_app;

import androidx.annotation.NonNull;
import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugins.GeneratedPluginRegistrant;
import android.os.Bundle;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.Context;
import android.util.Log;
import android.os.Build;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import io.flutter.plugin.common.MethodChannel;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.Manifest;

public class MainActivity extends FlutterActivity {
    private static final String CHANNEL = "com.example.antivirus_app/native";
    private static final int PERMISSION_REQUEST_CODE = 123;
    private static final String TAG = "MainActivity";

    @Override
    public void configureFlutterEngine(@NonNull FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);
        
        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL)
            .setMethodCallHandler(
                (call, result) -> {
                    switch (call.method) {
                        case "getInstalledApps":
                            try {
                                List<Map<String, Object>> apps = getInstalledApplications();
                                result.success(apps);
                            } catch (Exception e) {
                                Log.e(TAG, "Error getting installed apps", e);
                                result.error("UNAVAILABLE", "Error getting installed apps: " + e.getMessage(), null);
                            }
                            break;
                        case "scanFile":
                            String filePath = call.argument("filePath");
                            if (filePath != null) {
                                try {
                                    Map<String, Object> scanResult = scanFile(filePath);
                                    result.success(scanResult);
                                } catch (Exception e) {
                                    Log.e(TAG, "Error scanning file", e);
                                    result.error("SCAN_ERROR", "Error scanning file: " + e.getMessage(), null);
                                }
                            } else {
                                result.error("INVALID_ARGUMENT", "File path is null", null);
                            }
                            break;
                        case "startScanService":
                            boolean startInForeground = call.argument("foreground");
                            startScanService(startInForeground);
                            result.success(true);
                            break;
                        case "stopScanService":
                            stopScanService();
                            result.success(true);
                            break;
                        case "checkPermissions":
                            boolean hasPermissions = checkPermissions();
                            result.success(hasPermissions);
                            break;
                        case "requestPermissions":
                            requestPermissions();
                            result.success(true);
                            break;
                        default:
                            result.notImplemented();
                            break;
                    }
                }
            );
    }

    private List<Map<String, Object>> getInstalledApplications() {
        List<Map<String, Object>> apps = new ArrayList<>();
        PackageManager packageManager = getPackageManager();
        List<PackageInfo> packages = packageManager.getInstalledPackages(PackageManager.GET_PERMISSIONS);

        for (PackageInfo packageInfo : packages) {
            ApplicationInfo appInfo = packageInfo.applicationInfo;
            
            // Sistem uygulamalarını hariç tutmak için kontrol
            if ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                Map<String, Object> appData = new HashMap<>();
                appData.put("packageName", packageInfo.packageName);
                appData.put("appName", appInfo.loadLabel(packageManager).toString());
                appData.put("versionName", packageInfo.versionName);
                appData.put("versionCode", packageInfo.versionCode);
                appData.put("apkPath", appInfo.sourceDir);
                appData.put("installedDate", packageInfo.firstInstallTime);
                appData.put("lastUpdatedDate", packageInfo.lastUpdateTime);

                // Uygulama izinlerini al
                String[] permissions = packageInfo.requestedPermissions;
                List<String> permissionList = new ArrayList<>();
                if (permissions != null) {
                    for (String permission : permissions) {
                        permissionList.add(permission);
                    }
                }
                appData.put("permissions", permissionList);
                
                apps.add(appData);
            }
        }
        
        return apps;
    }

    private Map<String, Object> scanFile(String filePath) {
        Map<String, Object> result = new HashMap<>();
        File file = new File(filePath);
        
        if (!file.exists()) {
            result.put("status", "ERROR");
            result.put("message", "File does not exist");
            return result;
        }
        
        // Dosya hakkında bilgi topla
        result.put("filePath", filePath);
        result.put("fileName", file.getName());
        result.put("fileSize", file.length());
        result.put("lastModified", file.lastModified());
        result.put("isReadable", file.canRead());
        result.put("isExecutable", file.canExecute());
        
        // Normalde burada dosya hash'i çıkarılıp tehdit veritabanıyla karşılaştırılır
        // Bu örnek için basit bir simülasyon yapıyoruz
        result.put("status", "CLEAN");
        result.put("message", "No threats detected");
        
        return result;
    }

    private void startScanService(boolean foreground) {
        Intent serviceIntent = new Intent(this, ScanForegroundService.class);
        serviceIntent.setAction(foreground ? ScanForegroundService.ACTION_START_FOREGROUND : ScanForegroundService.ACTION_START_BACKGROUND);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && foreground) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
        
        Log.d(TAG, "Scan service started. Foreground: " + foreground);
    }

    private void stopScanService() {
        Intent serviceIntent = new Intent(this, ScanForegroundService.class);
        serviceIntent.setAction(ScanForegroundService.ACTION_STOP);
        startService(serviceIntent);
        Log.d(TAG, "Scan service stopped");
    }

    private boolean checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(this, Manifest.permission.QUERY_ALL_PACKAGES) == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    private void requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> permissionsToRequest = new ArrayList<>();
            
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.QUERY_ALL_PACKAGES) != PackageManager.PERMISSION_GRANTED) {
                    permissionsToRequest.add(Manifest.permission.QUERY_ALL_PACKAGES);
                }
            }
            
            if (!permissionsToRequest.isEmpty()) {
                ActivityCompat.requestPermissions(this, permissionsToRequest.toArray(new String[0]), PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            
            Log.d(TAG, "Permissions granted: " + allGranted);
        }
    }
}