package com.vaktinamaz.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Capacitor default init — hiçbir plugin eklemeden
        this.init(savedInstanceState, new java.util.ArrayList<>());
    }
}
