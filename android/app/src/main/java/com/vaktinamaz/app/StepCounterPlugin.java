package com.vaktinamaz.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import android.Manifest;
import android.content.Context;
import android.content.Intent; // Intent eklendi
import android.os.Build;
import android.util.Log;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activity_recognition",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        ),
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
// implements SensorEventListener kaldırıldı
public class StepCounterPlugin extends Plugin { 

    private static final String TAG = "StepCounterPlugin";
    private PluginCall currentCall;
    // Step sensor initialization ve count değişkenleri kaldırıldı, çünkü artık servis yönetecek

    @Override
    public void load() {
        super.load();
        // SensorManager initialization kaldırıldı
        Log.d(TAG, "StepCounterPlugin yüklendi.");
    }

    @PluginMethod
    public void startStepCounting(PluginCall call) {
        Log.d(TAG, "startStepCounting çağrıldı");
        
        // 1. İzin kontrolü
        if (!hasAllRequiredPermissions()) {
            Log.d(TAG, "Tüm izinler verilmemiş, izin isteniyor...");
            currentCall = call;
            saveCall(call);
            // Tüm izinler için alias listesini ilet
            requestAllPermissions(call, "activity_recognition", "notifications"); 
            return;
        }

        // 2. İzinler verildiyse servisi başlat
        startStepService();
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Adım sayma servisi başlatıldı");
        call.resolve(ret);
    }
    
    // Servis başlatma metodunu ayırdık
    private void startStepService() {
        Intent serviceIntent = new Intent(getContext(), StepService.class);
        // Foreground servisini başlat
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        Log.d(TAG, "StepService başlatma çağrısı yapıldı.");
    }

    @PluginMethod
    public void stopStepCounting(PluginCall call) {
        Log.d(TAG, "stopStepCounting çağrıldı");
        
        // Servisi durdur
        Intent serviceIntent = new Intent(getContext(), StepService.class);
        getContext().stopService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Adım sayma servisi durduruldu");
        call.resolve(ret);
    }

    // StepCount metodları: Artık Servis ile iletişim kurmalıdır, ama basitlik için geçici olarak kaldırıldı.
    @PluginMethod
    public void getStepCount(PluginCall call) {
        // Doğru uygulama: StepService'ten adımı almak için LocalBroadcast veya Bind Service kullanılmalı.
        call.reject("Adım sayısını almak için servis iletişimi gerekli. Henüz uygulanmadı.");
    }

    // İzin kontrolleri (Önceki kodunuzdan gelen)
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        // ... (checkPermissions kodunuzu koruyun)
    }
    
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        // ... (requestPermissions kodunuzu koruyun)
    }
    
    private boolean hasAllRequiredPermissions() {
        boolean hasActivityRecognition = hasPermission(Manifest.permission.ACTIVITY_RECOGNITION);
        boolean hasNotifications = true;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotifications = hasPermission(Manifest.permission.POST_NOTIFICATIONS);
        }
        
        return hasActivityRecognition && hasNotifications;
    }

    // Eski methodlar için compatibility
    @PluginMethod
    public void startService(PluginCall call) {
        startStepCounting(call);
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        stopStepCounting(call);
    }

    @PluginMethod
    public void resetSteps(PluginCall call) {
        // Doğru uygulama: Servise adımı sıfırlama komutu göndermek gerekli.
        call.reject("Adımları sıfırlamak için servis iletişimi gerekli. Henüz uygulanmadı.");
    }

    // SensorEventListener metotları (onSensorChanged, onAccuracyChanged) kaldırıldı

    // handleOnResume ve handleOnPause metodları kaldırıldı
    
    // Permission callback (Önceki kodunuzdan gelen)
    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        PluginCall savedCall = getSavedCall();
        if (savedCall != null) {
            JSObject ret = new JSObject();
            boolean allGranted = hasAllRequiredPermissions();
            
            // ... (İzin sonuçlarını döndüren kodunuzu koruyun)
            
            if (allGranted) {
                savedCall.resolve(ret);
                // Tüm izinler verildiyse sensörü başlatmak yerine servisi başlat
                if ("startStepCounting".equals(savedCall.getMethodName())) {
                     startStepService(); // 🔥 İzin aldıktan sonra servisi başlat
                }
            } else {
                savedCall.reject("Some permissions were denied. Please grant all required permissions.");
            }
        }
    }
}