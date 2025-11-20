package com.vaktinamaz.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "Steps")
public class StepPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepSensor;

    private float initialStepCount = -1;
    private float todaySteps = 0;

    @Override
    public void load() {
        super.load();

        Context context = getContext();
        sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);

        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

        if (stepSensor != null) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float totalSteps = event.values[0];

        // İlk kez çalışıyorsa referansı al
        if (initialStepCount < 0) {
            initialStepCount = totalSteps;
        }

        todaySteps = totalSteps - initialStepCount;

        if (todaySteps < 0) {
            todaySteps = 0; // Güvenlik için
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Gerek yok
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    // JS tarafı buradan çağırır
    @PluginMethod
    public void getSteps(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("steps", todaySteps);
        call.resolve(ret);
    }
}
