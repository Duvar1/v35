package com.vaktinamaz.app;

import android.app.Application;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Capacitor;

public class MainApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // Capacitor başlangıcı
        Capacitor.init(this);
    }
}
