package com.vaktinamaz.app

import com.vaktinamaz.stepcounter.StepServicePlugin
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.vaktinamaz.stepcounter.StepCounterPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        this.init(savedInstanceState, listOf(
            StepCounterPlugin()
        ))
    }
}
