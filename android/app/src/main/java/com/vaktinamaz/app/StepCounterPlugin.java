package com.vaktinamaz.app;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StepCounter")
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
        try {
            Intent serviceIntent = new Intent(getContext(), StepService.class);
            getContext().startForegroundService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi başlatıldı");
            call.resolve(result);
            
            Log.d(TAG, "Servis başlatıldı");
        } catch (Exception e) {
            Log.e(TAG, "Servis başlatma hatası: " + e.getMessage());
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
            
            Log.d(TAG, "Servis durduruldu");
        } catch (Exception e) {
            Log.e(TAG, "Servis durdurma hatası: " + e.getMessage());
            call.reject("Servis durdurulamadı: " + e.getMessage());
        }
    }

    public static void sendStepToJS(int steps) {
        if (instance == null) {
            Log.e(TAG, "Plugin instance null!");
            return;
        }

        try {
            JSObject ret = new JSObject();
            ret.put("steps", steps);
            ret.put("timestamp", System.currentTimeMillis());

            instance.notifyListeners("stepUpdate", ret, true);
            Log.d(TAG, "JS'ye adım gönderildi: " + steps);
        } catch (Exception e) {
            Log.e(TAG, "JS'ye adım gönderme hatası: " + e.getMessage());
        }
    }
}