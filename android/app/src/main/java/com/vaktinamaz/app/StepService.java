package com.vaktinamaz.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class StepService extends Service implements SensorEventListener {

    private static final String CHANNEL_ID = "step_foreground_channel";

    private SensorManager sensorManager;
    private Sensor stepSensor;

    private float initialSteps = -1;
    private static float todaySteps = 0;

    public static float getTodaySteps() {
        return todaySteps;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        createNotificationChannel();

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar Aktif")
                .setContentText("Adımlar izleniyor…")
                .setSmallIcon(R.mipmap.ic_launcher)   // icon buraya
                .setOngoing(true)
                .build();

        startForeground(1, notification);

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

        if (stepSensor != null) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float total = event.values[0];

        if (initialSteps < 0) {
            initialSteps = total;
        }

        todaySteps = total - initialSteps;
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel chan = new NotificationChannel(
                    CHANNEL_ID,
                    "Step Counter Service",
                    NotificationManager.IMPORTANCE_LOW
            );

            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(chan);
        }
    }
}
