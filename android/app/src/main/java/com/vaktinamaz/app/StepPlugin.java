package com.vaktinamaz.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

@CapacitorPlugin(name = "Steps")
public class StepPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepSensor;

    @Override
    public void load() {
        super.load();

        // Foreground service başlat
        Intent i = new Intent(getContext(), StepService.class);
        getContext().startForegroundService(i);
    }

    // ------------ JS tarafının çağırdığı method ------------
    @PluginMethod
    public void getSteps(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("steps", StepService.getTodaySteps());
        call.resolve(ret);
    }

    // Plugin içi sensör gerekmez → tüm sensör StepService içinde
    @Override public void onSensorChanged(SensorEvent event) {}
    @Override public void onAccuracyChanged(Sensor s, int a) {}
}
