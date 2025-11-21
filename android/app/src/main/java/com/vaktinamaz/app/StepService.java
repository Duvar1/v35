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
import android.util.Log;
import android.widget.RemoteViews;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class StepService extends Service implements SensorEventListener {

    private static final String CHANNEL_ID = "step_foreground_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final String TAG = "StepService";

    private SensorManager sensorManager;
    private Sensor stepSensor;

    // 🔥 Plugin tarafından okunabilir global değer
    public static int currentSteps = 0;

    private float initialSteps = -1;
    private int todaySteps = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "StepService created");

        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);

        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

            if (stepSensor != null) {
                Log.d(TAG, "Step sensor found");
                sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
            } else {
                Log.e(TAG, "Step sensor NOT found! Stopping service.");
                stopSelf();
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "StepService onStartCommand");
        return START_STICKY;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_STEP_COUNTER) return;

        float totalSteps = event.values[0];

        if (initialSteps < 0) {
            initialSteps = totalSteps;
            Log.d(TAG, "Initial step count: " + initialSteps);
            return;
        }

        int newSteps = (int) (totalSteps - initialSteps);

        if (newSteps != todaySteps) {
            todaySteps = newSteps;
            currentSteps = newSteps;   //  ← 🔥 Plugin burayı okuyor!

            Log.d(TAG, "Updated steps: " + todaySteps);

            updateNotification();
            sendBroadcastToApp();
        }
    }

    private void sendBroadcastToApp() {
        try {
            Intent intent = new Intent("STEP_UPDATE_ACTION");
            intent.putExtra("steps", todaySteps);
            sendBroadcast(intent);
            Log.d(TAG, "Broadcast sent: " + todaySteps);
        } catch (Exception e) {
            Log.e(TAG, "Broadcast error: " + e.getMessage());
        }
    }

    private Notification createNotification() {
        RemoteViews layout = new RemoteViews(getPackageName(), R.layout.step_notification);
        layout.setTextViewText(R.id.step_count, String.valueOf(todaySteps));
        layout.setTextViewText(R.id.status, "Çalışıyor");

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(getNotificationIcon())
                .setCustomContentView(layout)
                .setOnlyAlertOnce(true)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void updateNotification() {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, createNotification());
            }
        } catch (Exception e) {
            Log.e(TAG, "Notification update failed: " + e.getMessage());
        }
    }

    private int getNotificationIcon() {
        int icon = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (icon == 0) icon = android.R.drawable.ic_dialog_info;
        return icon;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "Adım Sayar Servisi",
                    NotificationManager.IMPORTANCE_LOW
            );
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(ch);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "StepService destroyed");

        if (sensorManager != null) sensorManager.unregisterListener(this);
    }
}
