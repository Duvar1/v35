package com.vaktinamaz.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.PendingIntent;

import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;

// ❗ Eksik olan import EKLENDİ
import com.vaktinamaz.app.R;

public class StepService extends Service implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepDetector;
    private int todaySteps = 0;

    @Override
    public void onCreate() {
        super.onCreate();

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);

        stepDetector = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

        if (stepDetector == null) {
            Log.e("StepService", "Step sensor not available!");
        } else {
            sensorManager.registerListener(this, stepDetector, SensorManager.SENSOR_DELAY_NORMAL);
        }

        createNotification();
    }

    private void createNotification() {
        String channelId = "step_counter_channel";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId,
                "Step Counter",
                NotificationManager.IMPORTANCE_LOW
            );

            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, channelId)
            .setContentTitle("Adım Sayar Çalışıyor")
            .setContentText("Arka planda adımlar takip ediliyor")
            .setSmallIcon(R.mipmap.ic_launcher);

        startForeground(1, notification.build());
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        todaySteps = (int) event.values[0];

        Log.d("StepService", "Adım güncellendi: " + todaySteps);

        JSObject data = new JSObject();
        data.put("stepCount", todaySteps);

        StepCounterPlugin.sendStepEvent(data);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        sensorManager.unregisterListener(this);
    }
}
