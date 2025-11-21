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
            
            // MainActivity'ye gönder
            sendStepsToMainActivity(context, steps);
        }
    }

    private void sendStepsToMainActivity(Context context, int steps) {
        try {
            if (context instanceof MainActivity) {
                MainActivity activity = (MainActivity) context;
                activity.onStepUpdate(steps);
            } else {
                // Context MainActivity değilse, intent ile başlat
                Intent activityIntent = new Intent(context, MainActivity.class);
                activityIntent.putExtra("steps", steps);
                activityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(activityIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending to MainActivity: " + e.getMessage());
        }
    }
}