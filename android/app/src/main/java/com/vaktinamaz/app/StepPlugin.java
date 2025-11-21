package com.vaktinamaz.app;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "StepTracker")
public class StepPlugin extends Plugin {

    private static final String TAG = "StepPlugin";

    @PluginMethod
    public void start(PluginCall call) {
        try {
            Context ctx = getContext();

            Intent service = new Intent(ctx, StepService.class);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                ctx.startForegroundService(service);
            } else {
                ctx.startService(service);
            }

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("message", "StepService started");
            call.resolve(res);

        } catch (Exception e) {
            Log.e(TAG, "Error starting service: " + e.getMessage());
            call.reject("Cannot start StepService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent service = new Intent(ctx, StepService.class);
            ctx.stopService(service);

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("message", "StepService stopped");
            call.resolve(res);

        } catch (Exception e) {
            call.reject("Cannot stop StepService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        // Android’da foreground servis çalışıp çalışmadığını kontrol eden basit yöntem
        JSObject res = new JSObject();
        res.put("running", StepServiceIsAliveChecker.isServiceRunning(getContext(), StepService.class));
        call.resolve(res);
    }

    @PluginMethod
    public void getSteps(PluginCall call) {
        try {
            int steps = StepServiceStateHolder.getSteps();

            JSObject json = new JSObject();
            json.put("steps", steps);

            call.resolve(json);

        } catch (Exception e) {
            call.reject("Cannot get steps: " + e.getMessage());
        }
    }
}
