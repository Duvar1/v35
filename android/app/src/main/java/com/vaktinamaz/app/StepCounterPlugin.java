package com.vaktinamaz.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

@CapacitorPlugin(name = "StepCounter")
public class StepCounterPlugin extends Plugin {

    private static StepCounterPlugin instance;
    private static final String TAG = "StepCounterPlugin";
    private static final int ACTIVITY_RECOGNITION_REQUEST_CODE = 1001;

    @Override
    public void load() {
        super.load();
        instance = this;
        Log.d(TAG, "Plugin yüklendi");
        
        // Uygulama açılınca otomatik izin kontrolü ve servis başlatma
        checkAndStartService();
    }

    private void checkAndStartService() {
        if (hasActivityRecognitionPermission()) {
            startStepService();
        } else {
            // İzin yoksa otomatik iste
            requestActivityRecognitionPermission();
        }
    }

    private boolean hasActivityRecognitionPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            return ContextCompat.checkSelfPermission(getContext(), 
                android.Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        }
        return true; // Android 10 altında izin gerekmez
    }

    private void requestActivityRecognitionPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            ActivityCompat.requestPermissions(getActivity(),
                new String[]{android.Manifest.permission.ACTIVITY_RECOGNITION},
                ACTIVITY_RECOGNITION_REQUEST_CODE);
        }
    }

    private void startStepService() {
        try {
            Intent serviceIntent = new Intent(getContext(), StepService.class);
            getContext().startForegroundService(serviceIntent);
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

    // İzin sonucu
    @Override
    public void handleOnRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleOnRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == ACTIVITY_RECOGNITION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // İzin verildi, servisi başlat
                startStepService();
            } else {
                Log.e(TAG, "ACTIVITY_RECOGNITION izni reddedildi");
            }
        }
    }

    public static void sendStepToJS(int steps) {
        if (instance == null) return;

        try {
            JSObject ret = new JSObject();
            ret.put("steps", steps);
            ret.put("timestamp", System.currentTimeMillis());

            instance.notifyListeners("stepUpdate", ret, true);
        } catch (Exception e) {
            Log.e(TAG, "JS'ye adım gönderme hatası: " + e.getMessage());
        }
    }
}