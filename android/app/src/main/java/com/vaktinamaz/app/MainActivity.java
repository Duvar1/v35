package com.vaktinamaz.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 2001;
    private static final String TAG = "MainActivity";

    private final BroadcastReceiver jsReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("STEP_UPDATE_ACTION".equals(intent.getAction())) {  // ✔ Düzeltilmiş
                int steps = intent.getIntExtra("steps", 0);
                sendStepsToJS(steps);
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestStepPermissions();
    }

    private void requestStepPermissions() {
        String[] permissions = {
                Manifest.permission.ACTIVITY_RECOGNITION,
                Manifest.permission.FOREGROUND_SERVICE
        };

        boolean granted = true;
        for (String p : permissions) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                granted = false;
                break;
            }
        }

        if (granted) {
            startStepService();
        } else {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] perms, int[] results) {
        super.onRequestPermissionsResult(requestCode, perms, results);

        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean ok = true;

            for (int r : results) {
                if (r != PackageManager.PERMISSION_GRANTED) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                startStepService();
            } else {
                Toast.makeText(this, "Adım sayar için izin gerekli.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void startStepService() {
        try {
            Intent intent = new Intent(this, StepService.class);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }

            Log.d(TAG, "StepService started successfully.");

        } catch (Exception e) {
            Log.e(TAG, "Failed to start StepService: " + e.getMessage());
        }
    }

    private void sendStepsToJS(int steps) {
        try {
            if (bridge != null && bridge.getWebView() != null) {
                String js =
                        "window.dispatchEvent(new CustomEvent('stepUpdate', { detail: { steps: " +
                                steps + " }}));";

                bridge.getWebView().post(() ->
                        bridge.getWebView().evaluateJavascript(js, null));

                Log.d(TAG, "Steps sent to JS: " + steps);
            }
        } catch (Exception e) {
            Log.e(TAG, "JS dispatch error: " + e.getMessage());
        }
    }

    @Override
    public void onResume() {
        super.onResume();  
        registerReceiver(jsReceiver, new IntentFilter("STEP_UPDATE_ACTION")); // ✔ Düzeltilmiş
    }

    @Override
    public void onPause() {
        unregisterReceiver(jsReceiver);
        super.onPause();
    }
}
