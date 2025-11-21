package com.vaktinamaz.app;  // AYNI PAKET

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class StepReceiver extends BroadcastReceiver {
    private static final String TAG = "StepReceiver";

    // Adım güncellemelerini dinleyecek
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        Log.d(TAG, "Broadcast received: " + action);

        if ("STEP_UPDATE_ACTION".equals(action)) {
            int steps = intent.getIntExtra("steps", 0);
            Log.d(TAG, "Steps updated: " + steps);
            
            // Burada WebView'e veri gönderebilirsin
            sendStepsToWebView(context, steps);
        }
    }

    private void sendStepsToWebView(Context context, int steps) {
        try {
            // Capacitor bridge üzerinden JavaScript'e mesaj gönder
            if (context instanceof MainActivity) {
                MainActivity activity = (MainActivity) context;
                activity.sendStepsToJavaScript(steps);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending to WebView: " + e.getMessage());
        }
    }
}