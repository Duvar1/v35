package com.vaktinamaz.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

import com.vaktinamaz.app.StepServicePlugin   // ✔ DOĞRU IMPORT

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        this.init(savedInstanceState, listOf(
            StepServicePlugin()   // ✔ DOĞRU PLUGIN
        ))
    }
}
