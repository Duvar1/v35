package com.vaktinamaz.app;

import android.content.Intent;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "StepTracker")
public class StepPlugin extends Plugin {

    @PluginMethod
    public void startStepService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, StepService.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to start StepService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopStepService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, StepService.class);
            context.stopService(serviceIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to stop StepService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getCurrentSteps(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("steps", StepService.currentSteps);   // 🔥 buradan okuyoruz
        call.resolve(ret);
    }
}
