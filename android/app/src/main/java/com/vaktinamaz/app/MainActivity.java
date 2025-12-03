package com.vaktinamaz.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onStart() {
        super.onStart();
        registerPlugin(ExactAlarm.class);
    }
}
