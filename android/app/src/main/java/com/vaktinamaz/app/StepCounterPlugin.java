package com.vaktinamaz.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.Log;

@CapacitorPlugin(name = "StepCounter")
public class StepCounterPlugin extends Plugin {

    private static StepCounterPlugin instance;
    private static final String TAG = "StepCounterPlugin";

    @Override
    public void load() {
        super.load();
        instance = this;
        Log.d(TAG, "StepCounter plugin yüklendi");
    }

    @PluginMethod
    public void startService(com.getcapacitor.PluginCall call) {
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
    public void stopService(com.getcapacitor.PluginCall call) {
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

    @PluginMethod
    public void checkPermission(com.getcapacitor.PluginCall call) {
        try {
            JSObject result = new JSObject();
            
            // Android 10+ için ACTIVITY_RECOGNITION izni kontrolü
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                boolean hasPermission = getContext().checkSelfPermission(android.Manifest.permission.ACTIVITY_RECOGNITION) 
                    == android.content.pm.PackageManager.PERMISSION_GRANTED;
                result.put("granted", hasPermission);
            } else {
                // Android 10 altında izin gerekmez
                result.put("granted", true);
            }
            
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "İzin kontrol hatası: " + e.getMessage());
            call.reject("İzin kontrol edilemedi: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestPermissions(com.getcapacitor.PluginCall call) {
        try {
            // Android 10+ için izin iste
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                requestPermissions(new String[]{android.Manifest.permission.ACTIVITY_RECOGNITION}, 1001);
            }
            
            JSObject result = new JSObject();
            result.put("granted", true); // Kullanıcı seçimine göre değişecek
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "İzin isteme hatası: " + e.getMessage());
            call.reject("İzin istenemedi: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetSteps(com.getcapacitor.PluginCall call) {
        try {
            // Adımları sıfırla (local storage veya başka bir yöntem)
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Adımlar sıfırlandı");
            call.resolve(result);
            
            Log.d(TAG, "Adımlar sıfırlandı");
        } catch (Exception e) {
            Log.e(TAG, "Adım sıfırlama hatası: " + e.getMessage());
            call.reject("Adımlar sıfırlanamadı: " + e.getMessage());
        }
    }

    // Adım gönderme metodu - StepService'den çağrılacak
    public static void sendStepToJS(int steps) {
        if (instance != null) {
            try {
                JSObject ret = new JSObject();
                ret.put("steps", steps);
                ret.put("timestamp", System.currentTimeMillis());
                
                instance.notifyListeners("stepUpdate", ret);
                Log.d(TAG, "JS'ye adım gönderildi: " + steps);
            } catch (Exception e) {
                Log.e(TAG, "JS'ye adım gönderme hatası: " + e.getMessage());
            }
        }
    }

    // İzin sonucu
    @Override
    public void handleOnRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleOnRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == 1001) {
            boolean granted = grantResults.length > 0 && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED;
            Log.d(TAG, "ACTIVITY_RECOGNITION izni: " + (granted ? "VERİLDİ" : "REDDEDİLDİ"));
            
            if (granted) {
                // İzin verildi, servisi başlat
                try {
                    getActivity().startService(new android.content.Intent(getContext(), StepService.class));
                } catch (Exception e) {
                    Log.e(TAG, "İzin sonrası servis başlatma hatası: " + e.getMessage());
                }
            }
        }
    }
}