package com.vaktinamaz.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class StepService extends Service implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private float initialSteps = 0f;
    private boolean isInitialized = false;
    private PowerManager.WakeLock wakeLock;
    private SharedPreferences prefs;

    private static final String TAG = "StepService";
    private static final String CHANNEL_ID = "step_counter_channel";
    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_INITIAL_STEPS = "initial_steps";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Servis oluşturuldu");
        
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        
        // WakeLock al (10 saatlik timeout ile)
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "StepService:WakeLock");
        wakeLock.acquire(10 * 60 * 60 * 1000L); // 10 saat

        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }

        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Servis başlatıldı");
        
        // Foreground service başlat
        startForegroundService();

        if (stepSensor != null) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_UI);
            Log.d(TAG, "Sensör dinleyici kaydedildi");
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
        channel.setShowBadge(false);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private void startForegroundService() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar Çalışıyor")
                .setContentText("Adımlarınız sayılıyor...")
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();

        startForeground(1, notification);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (!isInitialized) {
            // İlk değeri SharedPreferences'tan al veya şimdi kaydet
            float savedInitial = prefs.getFloat(KEY_INITIAL_STEPS, -1f);
            if (savedInitial == -1f) {
                initialSteps = event.values[0];
                prefs.edit().putFloat(KEY_INITIAL_STEPS, initialSteps).apply();
            } else {
                initialSteps = savedInitial;
            }
            isInitialized = true;
            Log.d(TAG, "İlk adım değeri: " + initialSteps);
        }

        float currentSteps = event.values[0];
        int stepsSinceStart = (int) (currentSteps - initialSteps);

        // Negatif değerleri engelle (cihaz yeniden başlatma durumu)
        if (stepsSinceStart < 0) {
            initialSteps = currentSteps;
            prefs.edit().putFloat(KEY_INITIAL_STEPS, initialSteps).apply();
            stepsSinceStart = 0;
        }

        Log.d(TAG, "Yeni adım: " + stepsSinceStart);
        StepCounterPlugin.sendStepToJS(stepsSinceStart);
        
        // Bildirimi güncelle
        updateNotification(stepsSinceStart);
    }

    private void updateNotification(int steps) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar")
                .setContentText("Toplam Adım: " + steps)
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
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
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        Log.d(TAG, "Servis durduruldu");
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { 
        return null; 
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}