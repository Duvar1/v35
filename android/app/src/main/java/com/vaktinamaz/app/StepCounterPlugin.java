package com.vaktinamaz.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.util.Log;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activity_recognition",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        ),
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    private static final String TAG = "StepCounterPlugin";
    private SensorManager sensorManager;
    private Sensor stepSensor;
    private int stepCount = 0;
    private PluginCall currentCall;

    @Override
    public void load() {
        super.load();
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
            Log.d(TAG, "Step sensor initialized: " + (stepSensor != null));
        }
    }

    @PluginMethod
    public void startStepCounting(PluginCall call) {
        Log.d(TAG, "startStepCounting called");
        
        if (stepSensor == null) {
            call.reject("Step counter sensor not available on this device");
            return;
        }

        // İzin kontrolü
        if (!hasAllRequiredPermissions()) {
            Log.d(TAG, "All permissions not granted, requesting...");
            currentCall = call;
            saveCall(call);
            requestAllPermissions(call, "activity_recognition"); // Sadece bir alias
            return;
        }

        startSensorListening();
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Step counting started");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopStepCounting(PluginCall call) {
        Log.d(TAG, "stopStepCounting called");
        
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Step counting stopped");
        call.resolve(ret);
    }

    @PluginMethod
    public void getStepCount(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("stepCount", stepCount);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        
        boolean hasActivityRecognition = hasPermission(Manifest.permission.ACTIVITY_RECOGNITION);
        boolean hasNotifications = true;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotifications = hasPermission(Manifest.permission.POST_NOTIFICATIONS);
        }
        
        boolean allPermissionsGranted = hasActivityRecognition && hasNotifications;
        
        ret.put("activity_recognition", hasActivityRecognition ? "granted" : "denied");
        ret.put("notifications", hasNotifications ? "granted" : "denied");
        ret.put("hasAllPermissions", allPermissionsGranted);
        ret.put("isSensorAvailable", stepSensor != null);
        ret.put("androidVersion", Build.VERSION.SDK_INT);
        
        Log.d(TAG, "checkPermissions - Activity: " + hasActivityRecognition + 
              ", Notifications: " + hasNotifications +
              ", All: " + allPermissionsGranted);
        
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        Log.d(TAG, "requestPermissions called");
        
        if (hasAllRequiredPermissions()) {
            JSObject ret = new JSObject();
            ret.put("activity_recognition", "granted");
            ret.put("notifications", "granted");
            ret.put("hasAllPermissions", true);
            call.resolve(ret);
        } else {
            currentCall = call;
            saveCall(call);
            requestAllPermissions(call, "activity_recognition"); // Sadece bir alias
        }
    }

    // Tüm gerekli izinlerin kontrolü
    private boolean hasAllRequiredPermissions() {
        boolean hasActivityRecognition = hasPermission(Manifest.permission.ACTIVITY_RECOGNITION);
        boolean hasNotifications = true;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotifications = hasPermission(Manifest.permission.POST_NOTIFICATIONS);
        }
        
        return hasActivityRecognition && hasNotifications;
    }

    // Eski methodlar için compatibility
    @PluginMethod
    public void startService(PluginCall call) {
        startStepCounting(call);
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        stopStepCounting(call);
    }

    @PluginMethod
    public void resetSteps(PluginCall call) {
        stepCount = 0;
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Steps reset to zero");
        call.resolve(ret);
    }

    private void startSensorListening() {
        if (sensorManager != null && stepSensor != null) {
            boolean registered = sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
            Log.d(TAG, "Sensor listener registered: " + registered);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            int newStepCount = (int) event.values[0];
            
            if (newStepCount != stepCount) {
                stepCount = newStepCount;
                Log.d(TAG, "Step count updated: " + stepCount);
                
                JSObject ret = new JSObject();
                ret.put("stepCount", stepCount);
                notifyListeners("stepCountUpdate", ret);
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Do nothing
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (hasAllRequiredPermissions() && stepSensor != null) {
            startSensorListening();
        }
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    // Permission callback - Capacitor 7
    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        PluginCall savedCall = getSavedCall();
        if (savedCall != null) {
            JSObject ret = new JSObject();
            
            boolean allGranted = hasAllRequiredPermissions();
            
            ret.put("activity_recognition", hasPermission(Manifest.permission.ACTIVITY_RECOGNITION) ? "granted" : "denied");
            
            boolean hasNotifications = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                hasNotifications = hasPermission(Manifest.permission.POST_NOTIFICATIONS);
            }
            ret.put("notifications", hasNotifications ? "granted" : "denied");
            
            ret.put("hasAllPermissions", allGranted);
            ret.put("success", allGranted);
            
            Log.d(TAG, "Permission request result - All granted: " + allGranted);
            
            if (allGranted) {
                savedCall.resolve(ret);
                // Tüm izinler verildiyse sensörü başlat
                if ("startStepCounting".equals(savedCall.getMethodName())) {
                    startSensorListening();
                }
            } else {
                savedCall.reject("Some permissions were denied. Please grant all required permissions.");
            }
        }
    }
}