package com.vaktinamaz.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.vaktinamaz.app.StepServicePlugin    // Plugin import

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Plugin register
        this.init(savedInstanceState, listOf(
            StepServicePlugin()
        ))
    }
}
