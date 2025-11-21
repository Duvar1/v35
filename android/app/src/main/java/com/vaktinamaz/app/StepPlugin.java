package com.vaktinamaz.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import android.content.Intent;
import android.content.Context;

@CapacitorPlugin(name = "StepTracker")
public class StepPlugin extends Plugin {

    private StepService stepService;
    private boolean isServiceRunning = false;

    @PluginMethod
    public void startStepService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, StepService.class);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            isServiceRunning = true;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi başlatıldı");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Servis başlatılamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopStepService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, StepService.class);
            context.stopService(serviceIntent);
            
            isServiceRunning = false;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi durduruldu");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Servis durdurulamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getCurrentSteps(PluginCall call) {
        if (stepService != null) {
            int steps = stepService.getTodaySteps();
            JSObject result = new JSObject();
            result.put("steps", steps);
            call.resolve(result);
        } else {
            call.reject("Servis çalışmıyor");
        }
    }

    @PluginMethod
    public void isServiceRunning(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", isServiceRunning);
        call.resolve(result);
    }
}