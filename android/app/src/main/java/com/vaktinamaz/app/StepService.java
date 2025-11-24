package com.vaktinamaz.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class StepService extends Service implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private float initialSteps = 0f;
    private boolean isInitialized = false;

    private static final String TAG = "StepService";
    private static final String CHANNEL_ID = "step_counter_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "StepService oluşturuldu");
        
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }

        createNotificationChannel();
        startForegroundService();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "StepService başlatıldı");
        
        if (stepSensor != null) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_UI);
            Log.d(TAG, "Adım sensörü dinleniyor");
        } else {
            Log.e(TAG, "Adım sensörü bulunamadı!");
        }

        return START_STICKY;
    }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Adım Sayar",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Adım sayar arka planda çalışıyor");

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private void startForegroundService() {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar Çalışıyor")
                .setContentText("Adımlarınız sayılıyor...")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        startForeground(1, notification);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (!isInitialized) {
            initialSteps = event.values[0];
            isInitialized = true;
            Log.d(TAG, "İlk adım değeri: " + initialSteps);
            return;
        }

        float currentSteps = event.values[0];
        int stepsSinceStart = (int) (currentSteps - initialSteps);

        Log.d(TAG, "Yeni adım: " + stepsSinceStart);
        
        // React'e adım gönder
        StepCounterPlugin.sendStepToJS(stepsSinceStart);
        
        // Bildirimi güncelle
        updateNotification(stepsSinceStart);
    }

    private void updateNotification(int steps) {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar")
                .setContentText("Toplam Adım: " + steps)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(1, notification);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        Log.d(TAG, "StepService durduruldu");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}