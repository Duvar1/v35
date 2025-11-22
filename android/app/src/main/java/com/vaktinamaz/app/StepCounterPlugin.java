package com.vaktinamaz.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

import androidx.core.content.ContextCompat;

@CapacitorPlugin(name = "StepCounter")
public class StepCounterPlugin extends Plugin {

    private static StepCounterPlugin instance;
    private static final String TAG = "StepCounterPlugin";

    @Override
    public void load() {
        super.load();
        instance = this;
        Log.d(TAG, "Plugin yüklendi");
        
        // İzin kontrolü ve servis başlatma
        if (hasActivityRecognitionPermission()) {
            startStepService();
        }
        // İzin yoksa React tarafında isteyeceğiz
    }

    private boolean hasActivityRecognitionPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            return ContextCompat.checkSelfPermission(getContext(), 
                android.Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        }
        return true; // Android 10 altında izin gerekmez
    }

    private void startStepService() {
        try {
            Intent serviceIntent = new Intent(getContext(), StepService.class);
            getContext().startService(serviceIntent);
            Log.d(TAG, "Adım servisi başlatıldı");
        } catch (Exception e) {
            Log.e(TAG, "Servis başlatma hatası: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startService(PluginCall call) {
        try {
            startStepService();
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi başlatıldı");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Servis başlatılamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), StepService.class);
            getContext().stopService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi durduruldu");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Servis durdurulamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasActivityRecognitionPermission());
        call.resolve(result);
    }

    public static void sendStepToJS(int steps) {
        if (instance == null) return;

        try {
            JSObject ret = new JSObject();
            ret.put("steps", steps);
            instance.notifyListeners("stepUpdate", ret, true);
        } catch (Exception e) {
            Log.e(TAG, "JS'ye adım gönderme hatası: " + e.getMessage());
        }
    }
}