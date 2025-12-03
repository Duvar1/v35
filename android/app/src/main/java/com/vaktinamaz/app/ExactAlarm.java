package com.vaktinamaz.app;

import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;

public class ExactAlarm extends Plugin {

    // Capacitor 7'de @PluginMethod yoktur → doğrudan public method yazılır
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            getActivity().startActivity(intent);
        }

        call.resolve();
    }
}
