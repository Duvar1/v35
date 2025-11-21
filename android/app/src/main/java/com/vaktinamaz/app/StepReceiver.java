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
        if (!"STEP_UPDATE_ACTION".equals(action)) return;

        int steps = intent.getIntExtra("steps", 0);

        Log.d(TAG, "Step update received → " + steps);

        // 🔥 Bu broadcast MainActivity’ye aktarılır
        sendToMainActivity(context, steps);
    }

    private void sendToMainActivity(Context context, int steps) {
        try {
            Intent jsIntent = new Intent("STEP_UPDATE_JS");
            jsIntent.putExtra("steps", steps);

            context.sendBroadcast(jsIntent);
            Log.d(TAG, "Forwarded to JS dispatcher → " + steps);

        } catch (Exception e) {
            Log.e(TAG, "Error forwarding to JS: " + e.getMessage());
        }
    }
}
