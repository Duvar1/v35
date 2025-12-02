package com.yourapp.plugins;

import android.app.Activity;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationSound")
public class NotificationSoundPlugin extends Plugin {

    private static final int REQUEST_SOUND = 5001;
    private PluginCall savedCall;

    @PluginMethod
    public void pick(PluginCall call) {
        savedCall = call;

        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Melodi Seç");
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);

        startActivityForResult(call, intent, REQUEST_SOUND);
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode != REQUEST_SOUND || savedCall == null) return;

        if (resultCode == Activity.RESULT_OK) {
            Uri uri = data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);

            JSObject ret = new JSObject();
            ret.put("uri", uri != null ? uri.toString() : null);

            savedCall.resolve(ret);
        } else {
            savedCall.reject("Melodi seçilmedi");
        }

        savedCall = null;
    }
}
