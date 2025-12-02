import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;

public class MainActivity extends BridgeActivity {

    private static final int REQUEST_SOUND = 9999;
    private PluginCall pendingCall;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @PluginMethod
    public void pickNotificationSound(PluginCall call) {
        pendingCall = call;

        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Bildirim sesi seç");
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);

        startActivityForResult(intent, REQUEST_SOUND);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_SOUND) {
            if (resultCode == RESULT_OK && data != null) {
                Uri uri = data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
                if (uri != null) {
                    pendingCall.resolve(jsObject("uri", uri.toString()));
                } else {
                    pendingCall.reject("Seçim yapılmadı");
                }
            }
        }
    }
}
