package com.vaktinamaz.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;

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

        if (initialStepCount < 0) {
            initialStepCount = totalSteps;
        }

        todaySteps = totalSteps - initialStepCount;
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    public void getSteps(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("steps", todaySteps);
        call.resolve(ret);
    }
}
