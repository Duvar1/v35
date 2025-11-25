package com.vaktinamaz.app;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StepCounter")
public class StepCounterPlugin extends Plugin {

    private static StepCounterPlugin instance;

    public StepCounterPlugin() {
        instance = this;
    }

    public static void sendStepEvent(JSObject data) {
        if (instance == null) return;
        instance.notifyListeners("stepCountUpdate", data);
    }

    public void startStepCounting(PluginCall call) {
        Intent service = new Intent(getContext(), StepService.class);
        getContext().startForegroundService(service);
        call.resolve();
    }

    public void stopStepCounting(PluginCall call) {
        Intent service = new Intent(getContext(), StepService.class);
        getContext().stopService(service);
        call.resolve();
    }
}
