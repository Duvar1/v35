package com.vaktinamaz.app;

import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StepCounter")
public class StepCounterPlugin extends Plugin {

    private static StepCounterPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @PluginMethod
    public void startService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), StepService.class);
        getContext().startForegroundService(serviceIntent);
        call.resolve();
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), StepService.class);
        getContext().stopService(serviceIntent);
        call.resolve();
    }

    public static void sendStepToJS(int steps) {
        if (instance == null) return;

        JSObject ret = new JSObject();
        ret.put("steps", steps);

        instance.notifyListeners("stepUpdate", ret, true);
    }
}
