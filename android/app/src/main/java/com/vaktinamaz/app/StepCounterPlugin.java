package com.vaktinamaz.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(strings = { Manifest.permission.BODY_SENSORS }, alias = "body_sensors"),
        @Permission(strings = { Manifest.permission.ACTIVITY_RECOGNITION }, alias = "activity_recognition")
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

    @PluginMethod
    public void startService(PluginCall call) {
        // İzin kontrolü
        if (!hasBodySensorsPermission()) {
            requestPermissions(call);
            return;
        }

        // Servisi başlat
        startStepService();
        call.resolve();
    }

    private boolean hasBodySensorsPermission() {
        return ContextCompat.checkSelfPermission(getContext(), 
               Manifest.permission.BODY_SENSORS) == PackageManager.PERMISSION_GRANTED;
    }

    private void startStepService() {
        try {
            android.content.Intent serviceIntent = new android.content.Intent(getContext(), StepService.class);
            getContext().startService(serviceIntent);
            Log.d(TAG, "Adım servisi başlatıldı");
        } catch (Exception e) {
            Log.e(TAG, "Servis başlatma hatası: " + e.getMessage());
        }
    }

    @Override
    public void handleOnStart() {
        super.handleOnStart();
        // Uygulama açılınca izin kontrol et
        if (hasBodySensorsPermission()) {
            startStepService();
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