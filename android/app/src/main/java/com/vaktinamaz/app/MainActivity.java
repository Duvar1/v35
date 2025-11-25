package com.vaktinamaz.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(StepCounterPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
