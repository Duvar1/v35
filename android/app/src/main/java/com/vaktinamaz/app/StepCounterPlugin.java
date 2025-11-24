package com.vaktinamaz.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.Log;

@CapacitorPlugin(name = "StepCounter")
public class StepCounterPlugin extends Plugin {

    private static final String TAG = "StepCounterPlugin";

    @PluginMethod
    public void startService(PluginCall call) {
        try {
            // Servisi başlat
            getActivity().startService(new android.content.Intent(getContext(), StepService.class));
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi başlatıldı");
            call.resolve(result);
            
            Log.d(TAG, "StepCounter servisi başlatıldı");
        } catch (Exception e) {
            Log.e(TAG, "Servis başlatma hatası: " + e.getMessage());
            call.reject("Servis başlatılamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            // Servisi durdur
            getActivity().stopService(new android.content.Intent(getContext(), StepService.class));
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adım sayar servisi durduruldu");
            call.resolve(result);
            
            Log.d(TAG, "StepCounter servisi durduruldu");
        } catch (Exception e) {
            Log.e(TAG, "Servis durdurma hatası: " + e.getMessage());
            call.reject("Servis durdurulamadı: " + e.getMessage());
        }
    }

    public static void sendStepToJS(int steps) {
        // Bu metod static olarak StepService'den çağrılacak
        StepCounterPlugin plugin = (StepCounterPlugin) getPluginInstance("StepCounter");
        if (plugin != null) {
            JSObject ret = new JSObject();
            ret.put("steps", steps);
            plugin.notifyListeners("stepUpdate", ret);
        }
    }

    private static Plugin getPluginInstance(String pluginId) {
        // Capacitor 7'de plugin instance'ı alma
        try {
            Bridge bridge = BridgeManager.getInstance().getBridge();
            return bridge.getPlugin(pluginId);
        } catch (Exception e) {
            Log.e(TAG, "Plugin instance alınamadı: " + e.getMessage());
            return null;
        }
    }
}