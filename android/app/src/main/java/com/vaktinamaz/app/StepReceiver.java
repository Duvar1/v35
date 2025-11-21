package com.vaktinamaz.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class StepReceiver extends BroadcastReceiver {
    private static final String TAG = "StepReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        Log.d(TAG, "Broadcast received: " + action);

        if ("STEP_UPDATE_ACTION".equals(action)) {
            int steps = intent.getIntExtra("steps", 0);
            Log.d(TAG, "Steps updated: " + steps);
            
            // JavaScript'e direkt gönder
            sendStepsToJavaScript(context, steps);
        }
    }

    private void sendStepsToJavaScript(Context context, int steps) {
        try {
            // Capacitor bridge üzerinden JavaScript'e gönder
            Intent jsIntent = new Intent("STEP_UPDATE_JS");
            jsIntent.putExtra("steps", steps);
            context.sendBroadcast(jsIntent);
            
            Log.d(TAG, "Sent steps to JS: " + steps);
        } catch (Exception e) {
            Log.e(TAG, "Error sending to JavaScript: " + e.getMessage());
        }
    }
}