package com.vaktinamaz.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import android.Manifest;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Log;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activity_recognition",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        )
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    private static final String TAG = "StepCounterPlugin";
    private SensorManager sensorManager;
    private Sensor stepSensor;
    private int stepCount = 0;

    @Override
    public void load() {
        super.load();
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }
    }

    @PluginMethod
    public void startStepCounting(PluginCall call) {
        if (stepSensor == null) {
            call.reject("Step counter sensor not available on this device");
            return;
        }

        // İzin kontrolü - Capacitor 7'de yeni yöntem
        if (!hasRequiredPermissions()) {
            // İzin yoksa, izin iste ve call'ı kaydet
            saveCall(call);
            requestAllPermissions(call);
            return;
        }

        sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Step counting started");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopStepCounting(PluginCall call) {
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
        
        // Capacitor 7 permission formatı
        String permissionState = getPermissionState(Manifest.permission.ACTIVITY_RECOGNITION).toString().toLowerCase();
        ret.put("activity_recognition", permissionState);
        
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        // Capacitor 7'de izin yönetimi
        if (!hasRequiredPermissions()) {
            saveCall(call);
            requestAllPermissions(call);
        } else {
            JSObject ret = new JSObject();
            ret.put("activity_recognition", "granted");
            call.resolve(ret);
        }
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

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            stepCount = (int) event.values[0];
            
            JSObject ret = new JSObject();
            ret.put("stepCount", stepCount);
            notifyListeners("stepCountUpdate", ret);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Do nothing
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (stepSensor != null) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
        }
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    // Capacitor 7'de izin callback'i - DÜZELTİLMİŞ VERSİYON
    @Override
    protected void handleOnRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleOnRequestPermissionsResult(requestCode, permissions, grantResults);
        
        // Bekleyen çağrıyı al
        PluginCall savedCall = getSavedCall();
        if (savedCall != null) {
            JSObject ret = new JSObject();
            
            if (hasRequiredPermissions()) {
                ret.put("activity_recognition", "granted");
                savedCall.resolve(ret);
                
                // Eğer startStepCounting çağrıldıysa, otomatik başlat
                if ("startStepCounting".equals(savedCall.getMethodName())) {
                    startStepCountingAfterPermission();
                }
            } else {
                ret.put("activity_recognition", "denied");
                savedCall.reject("Permission denied");
            }
        }
    }

    private void startStepCountingAfterPermission() {
        if (stepSensor == null) {
            return;
        }

        sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
        
        // Event gönder
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Step counting started after permission granted");
        notifyListeners("serviceStatus", ret);
    }

    // StepService'den adım almak için static method - KALDIRILDI
    // Bu method artık gerekli değil, doğrudan listener kullanıyoruz
}