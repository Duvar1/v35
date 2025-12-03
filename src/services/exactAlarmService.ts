import { Capacitor } from "@capacitor/core";

export const requestExactAlarmPermission = async () => {
  // Sadece Android'de çalışır
  if (Capacitor.getPlatform() !== "android") return;

  try {
    const plugin = (window as any).ExactAlarm;

    if (!plugin) {
      console.warn("ExactAlarm plugin bulunamadı!");
      return;
    }

    await plugin.requestPermission();
    console.log("Exact Alarm izni istendi.");
  } catch (error) {
    console.error("Exact alarm permission error:", error);
  }
};
