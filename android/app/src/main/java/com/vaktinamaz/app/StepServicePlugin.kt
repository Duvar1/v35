package com.vaktinamaz.app

import android.content.Intent
import com.getcapacitor.*

@CapacitorPlugin(name = "StepServicePlugin")
class StepServicePlugin : Plugin() {

    override fun load() {
        StepService.bridge = this.bridge
    }

    @PluginMethod
    fun startService(call: PluginCall) {
        val intent = Intent(context, StepService::class.java)
        context.startForegroundService(intent)
        call.resolve()
    }

    @PluginMethod
    fun stopService(call: PluginCall) {
        val intent = Intent(context, StepService::class.java)
        context.stopService(intent)
        call.resolve()
    }
}
