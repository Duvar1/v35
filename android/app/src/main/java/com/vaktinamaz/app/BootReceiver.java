package com.vaktinamaz.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import android.Manifest;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Telefon yeniden başlatıldı, izin kontrolü yapılıyor...");
            
            // KRİTİK DÜZELTME: Servis başlatılmadan önce izin kontrolü
            if (context.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED) {
                 Log.d(TAG, "ACTIVITY_RECOGNITION izni verildi. StepService başlatılıyor...");
                 
                 Intent serviceIntent = new Intent(context, StepService.class);
                 if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                     // Android 8.0 ve sonrası için
                     context.startForegroundService(serviceIntent);
                 } else {
                     context.startService(serviceIntent);
                 }
            } else {
                 // İzin verilmediyse servis başlatılamaz
                 Log.d(TAG, "ACTIVITY_RECOGNITION izni verilmedi. StepService başlatılamadı. Kullanıcı uygulamayı açmalıdır.");
            }
        }
    }
}