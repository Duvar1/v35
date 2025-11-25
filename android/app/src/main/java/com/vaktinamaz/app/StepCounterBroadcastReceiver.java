package com.vaktinamaz.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class StepCounterBroadcastReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
                Log.d("StepCounterReceiver", "Boot completed → StepService başlatılıyor...");

                Intent serviceIntent = new Intent(context, StepService.class);
                context.startForegroundService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e("StepCounterReceiver", "Receiver hata:", e);
        }
    }
}
