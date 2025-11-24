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
// import androidx.localbroadcastmanager.content.LocalBroadcastManager; // Veri iletişimi için gerekli olabilir

public class StepService extends Service implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private float initialSteps = 0f;
    private boolean isInitialized = false;

    private static final String TAG = "StepService";
    private static final String CHANNEL_ID = "step_counter_channel";
    private static final int NOTIFICATION_ID = 1; // Bildirim ID'si

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "StepService oluşturuldu");
        
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }

        createNotificationChannel();
        startForegroundService(); // Servis oluşturulur oluşturulmaz ön plana alınır
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "StepService başlatıldı");
        
        if (stepSensor != null) {
            // SENSOR_DELAY_UI yerine SENSOR_DELAY_NORMAL daha iyidir
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL); 
            Log.d(TAG, "Adım sensörü dinleniyor");
        } else {
            Log.e(TAG, "Adım sensörü bulunamadı!");
        }

        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
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
    }

    private void startForegroundService() {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar Çalışıyor")
                .setContentText("Adımlarınız sayılıyor...")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        startForeground(NOTIFICATION_ID, notification); // Kalıcı bildirim başlatılıyor
        Log.d(TAG, "startForeground çağrıldı.");
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            if (!isInitialized) {
                initialSteps = event.values[0];
                isInitialized = true;
                Log.d(TAG, "İlk adım değeri: " + initialSteps);
                return;
            }

            float currentSteps = event.values[0];
            int stepsSinceStart = (int) (currentSteps - initialSteps);

            Log.d(TAG, "Yeni adım: " + stepsSinceStart);
            
            // Bildirimi güncelle
            updateNotification(stepsSinceStart);
            
            // 🔥 Capacitor'a veri göndermek için StepCounterPlugin.java'ya event yayınlanmalı
            // Bunu yapmak için StepCounterPlugin'de notifyListeners() çağrılmalıdır.
        }
    }

    private void updateNotification(int steps) {
        Notification notification = new new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar")
                .setContentText("Toplam Adım: " + steps)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, notification); // Bildirimi güncellerken aynı ID kullanılır
            Log.d(TAG, "Bildirim güncellendi. Adım: " + steps);
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
        // Bu servis bind edilmediği için null döner
        return null;
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}