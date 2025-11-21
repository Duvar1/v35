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
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class StepService extends Service implements SensorEventListener {

    private static final String CHANNEL_ID = "step_foreground_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final String TAG = "StepService";

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private float initialSteps = -1;
    private int todaySteps = 0;

    private final IBinder binder = new StepBinder();

    public class StepBinder extends Binder {
        StepService getService() {
            return StepService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "StepService onCreate");
        startStepTracking();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "StepService onStartCommand");
        startForeground(NOTIFICATION_ID, createNotification());
        return START_STICKY;
    }

    private void startStepTracking() {
        Log.d(TAG, "Starting step tracking...");
        
        createNotificationChannel();

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager == null) {
            Log.e(TAG, "SensorManager is null!");
            stopSelf();
            return;
        }

        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

        if (stepSensor != null) {
            Log.d(TAG, "Step counter sensor found, registering listener...");
            boolean registered = sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
            if (registered) {
                Log.d(TAG, "Sensor listener registered successfully");
            } else {
                Log.e(TAG, "Failed to register sensor listener");
            }
        } else {
            Log.e(TAG, "Step counter sensor not available on this device");
            // Sensör yoksa servisi durdur
            stopSelf();
            return;
        }

        // Foreground service başlat
        startForeground(NOTIFICATION_ID, createNotification());
        Log.d(TAG, "Foreground service started");
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            float totalSteps = event.values[0];
            Log.d(TAG, "Raw step count: " + totalSteps);

            if (initialSteps < 0) {
                initialSteps = totalSteps;
                Log.d(TAG, "Initial steps set to: " + initialSteps);
            }

            int newSteps = (int) (totalSteps - initialSteps);
            
            // Sadece değişiklik varsa güncelle
            if (newSteps != todaySteps) {
                todaySteps = newSteps;
                Log.d(TAG, "Today steps updated: " + todaySteps);
                
                // Bildirimi güncelle
                updateNotification();
                
                // MainActivity'ye veri gönder
                sendStepsToActivity();
            }
        }
    }

    private void sendStepsToActivity() {
        try {
            Log.d(TAG, "Sending steps to activity: " + todaySteps);
            
            // Broadcast olarak gönder
            Intent intent = new Intent("STEP_UPDATE_ACTION");
            intent.putExtra("steps", todaySteps);
            sendBroadcast(intent);
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending steps to activity: " + e.getMessage());
        }
    }

    private Notification createNotification() {
        try {
            Log.d(TAG, "Creating custom notification with steps: " + todaySteps);
            
            // Özel bildirim layout'u
            RemoteViews notificationLayout = new RemoteViews(getPackageName(), R.layout.step_notification);
            notificationLayout.setTextViewText(R.id.step_count, String.valueOf(todaySteps));
            notificationLayout.setTextViewText(R.id.status, "Çalışıyor");

            return new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setCustomContentView(notificationLayout)
                    .setSmallIcon(getNotificationIcon())
                    .setOngoing(true)
                    .setOnlyAlertOnce(true)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .build();
                    
        } catch (Exception e) {
            Log.e(TAG, "Error creating custom notification, using fallback: " + e.getMessage());
            return createFallbackNotification();
        }
    }

    private Notification createFallbackNotification() {
        Log.d(TAG, "Creating fallback notification");
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Adım Sayar")
                .setContentText(todaySteps + " adım")
                .setSmallIcon(getNotificationIcon())
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build();
    }

    private int getNotificationIcon() {
        // Önce uygulama icon'unu dene
        int icon = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (icon == 0) {
            // Alternatif icon'lar dene
            icon = getResources().getIdentifier("ic_launcher_round", "mipmap", getPackageName());
            if (icon == 0) {
                // Sistem icon'u fallback
                icon = android.R.drawable.ic_dialog_info;
                Log.d(TAG, "Using system fallback icon");
            }
        }
        Log.d(TAG, "Using icon resource: " + icon);
        return icon;
    }

    private void updateNotification() {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, createNotification());
                Log.d(TAG, "Notification updated");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error updating notification: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Adım Sayar Servisi",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Adım sayma servisi çalışıyor");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setImportance(NotificationManager.IMPORTANCE_LOW);

            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "Notification channel created");
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        Log.d(TAG, "Sensor accuracy changed: " + accuracy);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "StepService onDestroy");
        
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
            Log.d(TAG, "Sensor listener unregistered");
        }
    }

    public int getTodaySteps() {
        return todaySteps;
    }
}