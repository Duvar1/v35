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

    @PluginMethod
    public void startStepService(PluginCall call) {
        try {
            Context context = getContext();
            Intent i = new Intent(context, StepService.class);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(i);
            } else {
                context.startService(i);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Service start error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopStepService(PluginCall call) {
        try {
            getContext().stopService(new Intent(getContext(), StepService.class));
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Service stop error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getCurrentSteps(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("steps", StepService.lastKnownSteps);
        call.resolve(ret);
    }
}
