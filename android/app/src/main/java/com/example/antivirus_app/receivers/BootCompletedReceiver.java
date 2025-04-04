package com.example.antivirus_app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import com.example.antivirus_app.services.ScanForegroundService;

public class BootCompletedReceiver extends BroadcastReceiver {
    private static final String TAG = "BootCompletedReceiver";
    private static final String PREF_FILE = "com.example.antivirus_app.preferences";
    private static final String PREF_SERVICE_ENABLED = "service_enabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() != null && intent.getAction().equals(Intent.ACTION_BOOT_COMPLETED)) {
            Log.d(TAG, "Boot completed received");
            
            // Kullanıcı servisin otomatik başlatılmasını istediyse
            SharedPreferences prefs = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE);
            boolean serviceEnabled = prefs.getBoolean(PREF_SERVICE_ENABLED, true);
            
            if (serviceEnabled) {
                Log.d(TAG, "Starting service on boot");
                
                // Tarama servisini başlat
                Intent serviceIntent = new Intent(context, ScanForegroundService.class);
                serviceIntent.setAction(ScanForegroundService.ACTION_START_FOREGROUND);
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            } else {
                Log.d(TAG, "Service disabled by user, not starting on boot");
            }
        }
    }
}