package com.vaktinamaz.app;

import android.Manifest;
import android.os.Bundle;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // İzinleri kontrol et ve iste
        checkAndRequestPermissions();
    }

    private void checkAndRequestPermissions() {
        String[] requiredPermissions = {
            Manifest.permission.ACTIVITY_RECOGNITION,
            Manifest.permission.FOREGROUND_SERVICE
        };

        boolean allPermissionsGranted = true;
        
        for (String permission : requiredPermissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                allPermissionsGranted = false;
                break;
            }
        }

        if (allPermissionsGranted) {
            Log.d(TAG, "All permissions granted, starting service...");
            startStepService();
        } else {
            Log.d(TAG, "Requesting permissions...");
            ActivityCompat.requestPermissions(this, requiredPermissions, PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (allGranted) {
                Log.d(TAG, "All permissions granted!");
                startStepService();
            } else {
                Log.w(TAG, "Some permissions denied");
                Toast.makeText(this, 
                    "Adım sayma özelliği çalışmayacak. İzinleri ayarlardan açabilirsiniz.", 
                    Toast.LENGTH_LONG).show();
            }
        }
    }

    private void startStepService() {
        try {
            Log.d(TAG, "Starting StepService with foreground service...");
            Intent serviceIntent = new Intent(this, StepService.class);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                // Android 8+ için foreground service başlat
                startForegroundService(serviceIntent);
            } else {
                // Android 7 ve altı
                startService(serviceIntent);
            }
            
            Log.d(TAG, "StepService started successfully");
            
        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException - Permission missing: " + e.getMessage());
            Toast.makeText(this, "Servis başlatma izni yok", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.e(TAG, "Failed to start StepService: " + e.getMessage());
        }
    }

    public void sendStepsToJavaScript(int steps) {
        try {
            if (bridge != null && bridge.getWebView() != null) {
                String js = String.format(
                    "window.dispatchEvent(new CustomEvent('stepUpdate', { detail: { steps: %d } }));",
                    steps
                );
                bridge.getWebView().evaluateJavascript(js, null);
                Log.d(TAG, "Sent steps to JavaScript: " + steps);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending steps to JavaScript: " + e.getMessage());
        }
    }

    public void onStepUpdate(int steps) {
        Log.d(TAG, "Step update received: " + steps);
        sendStepsToJavaScript(steps);
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "App resumed");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "App destroyed");
    }
    // MainActivity.java'ye ekleyin:
private BroadcastReceiver jsReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("STEP_UPDATE_JS".equals(intent.getAction())) {
            int steps = intent.getIntExtra("steps", 0);
            sendStepsToJavaScript(steps);
        }
    }
};

@Override
protected void onResume() {
    super.onResume();
    // Receiver'ı kaydet
    registerReceiver(jsReceiver, new IntentFilter("STEP_UPDATE_JS"));
}

@Override
protected void onPause() {
    super.onPause();
    // Receiver'ı temizle
    unregisterReceiver(jsReceiver);
}
}