package com.vaktinamaz.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
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
// Artık SensorEventListener değil
public class StepCounterPlugin extends Plugin { 

    private static final String TAG = "StepCounterPlugin";
    private PluginCall currentCall;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "StepCounterPlugin yüklendi.");
    }

    @PluginMethod
    public void startStepCounting(PluginCall call) {
        Log.d(TAG, "startStepCounting çağrıldı");
        
        // 1. İzin kontrolü ve isteme
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
    
    // Servis başlatma metodu
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

    // Bu metodun doğru çalışması için Servis ile iletişim (LocalBroadcast) kurulması gerekir.
    // Şimdilik sadece örnek amaçlı.
    @PluginMethod
    public void getStepCount(PluginCall call) {
        call.reject("Adım sayısını almak için servis iletişimi gerekli. Henüz uygulanmadı.");
    }

    // İzin kontrolleri
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        
        boolean hasActivityRecognition = hasPermission(Manifest.permission.ACTIVITY_RECOGNITION);
        boolean hasNotifications = true;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotifications = hasPermission(Manifest.permission.POST_NOTIFICATIONS);
        }
        
        boolean allPermissionsGranted = hasActivityRecognition && hasNotifications;
        
        ret.put("activity_recognition", hasActivityRecognition ? "granted" : "denied");
        ret.put("notifications", hasNotifications ? "granted" : "denied");
        ret.put("hasAllPermissions", allPermissionsGranted);
        ret.put("isSensorAvailable", true); // Sensör kontrolü servise devredilebilir
        ret.put("androidVersion", Build.VERSION.SDK_INT);
        
        Log.d(TAG, "checkPermissions - Activity: " + hasActivityRecognition + 
              ", Notifications: " + hasNotifications +
              ", All: " + allPermissionsGranted);
        
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        Log.d(TAG, "requestPermissions çağrıldı");
        
        if (hasAllRequiredPermissions()) {
            JSObject ret = new JSObject();
            ret.put("activity_recognition", "granted");
            ret.put("notifications", "granted");
            ret.put("hasAllPermissions", true);
            call.resolve(ret);
        } else {
            currentCall = call;
            saveCall(call);
            requestAllPermissions(call, "activity_recognition", "notifications");
        }
    }

    // Tüm gerekli izinlerin kontrolü
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
        call.reject("Adımları sıfırlamak için servis iletişimi gerekli. Henüz uygulanmadı.");
    }

    // Permission callback
    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        PluginCall savedCall = getSavedCall();
        if (savedCall != null) {
            JSObject ret = new JSObject();
            
            boolean allGranted = hasAllRequiredPermissions();
            
            ret.put("activity_recognition", hasPermission(Manifest.permission.ACTIVITY_RECOGNITION) ? "granted" : "denied");
            
            boolean hasNotifications = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                hasNotifications = hasPermission(Manifest.permission.POST_NOTIFICATIONS);
            }
            ret.put("notifications", hasNotifications ? "granted" : "denied");
            
            ret.put("hasAllPermissions", allGranted);
            ret.put("success", allGranted);
            
            Log.d(TAG, "Permission request result - All granted: " + allGranted);
            
            if (allGranted) {
                savedCall.resolve(ret);
                // Tüm izinler verildiyse servisi başlat
                if ("startStepCounting".equals(savedCall.getMethodName())) {
                    startStepService();
                }
            } else {
                savedCall.reject("Some permissions were denied. Please grant all required permissions.");
            }
        }
    }
}