package com.vaktinamaz.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import androidx.core.content.ContextCompat;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(strings = { "android.permission.ACTIVITY_RECOGNITION" }, alias = "activity")
    }
)
public class StepCounterPlugin extends Plugin {

    private static StepCounterPlugin instance;
    private static final String TAG = "StepCounterPlugin";

    @Override
    public void load() {
        super.load();
        instance = this;
        Log.d(TAG, "Plugin yüklendi");
    }

    private boolean hasActivityRecognitionPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return ContextCompat.checkSelfPermission(
                getContext(), 
                android.Manifest.permission.ACTIVITY_RECOGNITION
            ) == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            requestPermissionForAlias("activity", call, "permissionCallback");
        } else {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
        }
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasActivityRecognitionPermission());
        call.resolve(result);
    }

    @PluginMethod
    public void startService(PluginCall call) {
        try {
            if (!hasActivityRecognitionPermission()) {
                call.reject("İzin gerekli. Önce requestPermissions() çağırın.");
                return;
            }

            Intent serviceIntent = new Intent(getContext(), StepService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            
            Log.d(TAG, "Adım servisi başlatıldı");
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi başlatıldı");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Servis başlatma hatası: " + e.getMessage());
            call.reject("Servis başlatılamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), StepService.class);
            boolean stopped = getContext().stopService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", stopped);
            result.put("message", stopped ? "Adım sayar servisi durduruldu" : "Servis zaten durdurulmuş");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Servis durdurulamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetSteps(PluginCall call) {
        try {
            getContext().getSharedPreferences("StepCounterPrefs", 0)
                .edit()
                .remove("initial_steps")
                .apply();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adımlar sıfırlandı");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Sıfırlama hatası: " + e.getMessage());
        }
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

