// src/services/exactAlarmService.ts
import { Capacitor } from "@capacitor/core";

// --------------------------------------------
// Android 12+ EXACT ALARM Permission Service
// --------------------------------------------

// ✔ Android değilse izin gerekmiyor
export const checkExactAlarmPermission = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() !== "android") return true;

  try {
    const sdkVersion =
      (window as any).device?.version ||
      (window as any).device?.platformVersion ||
      0;

    // ✔ Android 12 altı sistemlerde izin gerekmiyor
    if (parseInt(sdkVersion) < 31) return true;

    // Plugin seçenekleri
    const plugin =
      (window as any).ExactAlarm ||
      (window as any).AndroidExactAlarm ||
      (window as any).cordova?.plugins?.ExactAlarm;

    if (plugin?.checkPermission) {
      const result = await plugin.checkPermission();
      return result === true || result?.granted === true;
    }

    return false;
  } catch (err) {
    console.error("Exact alarm check error:", err);
    return false;
  }
};

// --------------------------------------------
// EXACT ALARM permission request
// --------------------------------------------
export const requestExactAlarmPermission = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() !== "android") return true;

  try {
    const sdkVersion =
      (window as any).device?.version ||
      (window as any).device?.platformVersion ||
      0;

    if (parseInt(sdkVersion) < 31) return true;

    const plugin =
      (window as any).ExactAlarm ||
      (window as any).AndroidExactAlarm ||
      (window as any).cordova?.plugins?.ExactAlarm;

    if (plugin?.requestPermission) {
      const result = await plugin.requestPermission();
      return result === true || result?.granted === true;
    }

    return false;
  } catch (err) {
    console.error("Exact alarm request error:", err);
    return false;
  }
};
