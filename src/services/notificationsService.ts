// src/services/notificationsService.ts
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

// -----------------------------------------------
// 🔔 Notification Service - Full Rewrite
// -----------------------------------------------
export class NotificationService {
  static isAndroid = Capacitor.getPlatform() === "android";
  static isIOS = Capacitor.getPlatform() === "ios";
  static isWeb = Capacitor.getPlatform() === "web";

  // ----------------------------------------------------
  // APP VERSION (gerekirse değiştir)
  // ----------------------------------------------------
  private static getAppVersion() {
    return "1.0.0";
  }

  // ----------------------------------------------------
  // 🔐 Permission Check
  // ----------------------------------------------------
  static async checkPermissions(): Promise<boolean> {
    try {
      let permission = await LocalNotifications.checkPermissions();

      if (permission.display !== "granted") {
        permission = await LocalNotifications.requestPermissions();
      }

      return permission.display === "granted";
    } catch (err) {
      console.error("Permission error:", err);
      return false;
    }
  }

  // ----------------------------------------------------
  // 📡 Android Channel (Gerekli)
  // ----------------------------------------------------
  static async createAndroidChannel() {
    if (!this.isAndroid) return;

    try {
      const channels = await LocalNotifications.listChannels();
      const exists = channels.channels?.find(c => c.id === "prayer_reminders");

      if (exists) return;

      await LocalNotifications.createChannel({
        id: "prayer_reminders",
        name: "Namaz Hatırlatmaları",
        description: "Namaz vakitleri bildirimleri",
        importance: 5,
        sound: "alert_sound.wav",
        vibration: true,
        lights: true,
        lightColor: "#FF5733",
        visibility: 1
      });
    } catch (err) {
      console.error("Channel error:", err);
    }
  }

  // ----------------------------------------------------
  // 🔄 Initialization
  // ----------------------------------------------------
  static async initialize() {
    try {
      const hasPermission = await this.checkPermissions();
      if (this.isAndroid && hasPermission) {
        await this.createAndroidChannel();
      }
      await this.validateScheduledNotifications();
      return true;
    } catch (err) {
      console.error("Init error:", err);
      return false;
    }
  }

  // ----------------------------------------------------
  // 🔍 Status for UI
  // ----------------------------------------------------
  static async getNotificationStatus() {
    try {
      const hasPermission = await this.checkPermissions();
      const scheduled = await this.getScheduledNotifications();

      return {
        hasPermission,
        scheduledCount: scheduled.length,
        scheduledPrayers: scheduled
          .filter(n => n.extra?.type === "prayer_reminder")
          .map(n => n.extra.prayerName),
        platform: Capacitor.getPlatform(),
        time: new Date().toLocaleString("tr-TR"),
        version: this.getAppVersion()
      };
    } catch (err: any) {
      return {
        hasPermission: false,
        scheduledCount: 0,
        scheduledPrayers: [],
        platform: Capacitor.getPlatform(),
        error: err.message
      };
    }
  }

  // ----------------------------------------------------
  // 📅 Schedule Prayer Notification
  // ----------------------------------------------------
  static async schedulePrayerNotification(prayer: {
    id: string;
    name: string;
    time: string;
    minutesBefore: number;
  }) {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return { success: false, error: "Permission denied" };
      }

      // Saat hesaplama
      const [h, m] = prayer.time.split(":").map(Number);
      const date = new Date();
      date.setHours(h);
      date.setMinutes(m - prayer.minutesBefore);
      date.setSeconds(0);

      // Geçmişse ertesi gün
      if (date <= new Date()) date.setDate(date.getDate() + 1);

      const id = this.generateStableId(prayer.id, date);

      // Önce eski bildirimleri temizle
      await this.cancelPrayerNotifications(prayer.id);

      // Bildirim
      const notification: any = {
        id,
        title: `⏰ ${prayer.name} Vakti Yaklaşıyor`,
        body: `${prayer.minutesBefore} dakika sonra ${prayer.name} vakti`,
        sound: "alert_sound.wav",
        schedule: { at: date, allowWhileIdle: true },
        extra: {
          type: "prayer_reminder",
          prayerId: prayer.id,
          prayerName: prayer.name,
          prayerTime: prayer.time,
          minutesBefore: prayer.minutesBefore
        }
      };

      if (this.isAndroid) notification.channelId = "prayer_reminders";

      await LocalNotifications.schedule({ notifications: [notification] });

      return { success: true, id, time: date };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ----------------------------------------------------
  // 🔎 Verify
  // ----------------------------------------------------
  static async validateScheduledNotifications() {
    try {
      const scheduled = await this.getScheduledNotifications();
      const now = Date.now();

      const valid = scheduled.filter(n => {
        if (!n.schedule?.at) return false;
        return new Date(n.schedule.at).getTime() > now;
      });

      return valid;
    } catch {
      return [];
    }
  }

  // ----------------------------------------------------
  // ❌ Cancel by prayer
  // ----------------------------------------------------
  static async cancelPrayerNotifications(prayerId: string) {
    const list = await this.getScheduledNotifications();
    const cancelList = list.filter(n => n.extra?.prayerId === prayerId);

    if (cancelList.length)
      await LocalNotifications.cancel({
        notifications: cancelList.map(n => ({ id: n.id }))
      });

    return cancelList.length;
  }

  // ----------------------------------------------------
  // ❌ Cancel ALL
  // ----------------------------------------------------
  static async cancelAllNotifications() {
    const list = await this.getScheduledNotifications();

    if (list.length)
      await LocalNotifications.cancel({
        notifications: list.map(n => ({ id: n.id }))
      });

    return list.length;
  }

  // ----------------------------------------------------
  // 📋 Pending list
  // ----------------------------------------------------
  static async getScheduledNotifications() {
    const pending = await LocalNotifications.getPending();
    return pending.notifications || [];
  }

  // ----------------------------------------------------
  // 🧪 Test Notification
  // ----------------------------------------------------
  static async sendTestNotification() {
    const time = new Date(Date.now() + 3000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 99999,
          title: "🔔 Ezan Sesi Testi",
          body: "Bildirim çalışıyor",
          sound: "alert_sound.wav",
          schedule: { at: time },
          channelId: "prayer_reminders"
        }
      ]
    });

    return { success: true, time, id: 99999 };
  }

  // ----------------------------------------------------
  // 🧠 Stable ID
  // ----------------------------------------------------
  private static generateStableId(key: string, date: Date): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash + date.getHours() * 60 + date.getMinutes());
  }

  // ----------------------------------------------------
  // 📱 Android Exact Alarm Permission
  // ----------------------------------------------------
  static async checkExactAlarmPermission(): Promise<boolean> {
    try {
      const plugin =
        (window as any).ExactAlarm ||
        (window as any).AndroidExactAlarm ||
        (window as any).cordova?.plugins?.ExactAlarm;

      if (plugin?.checkPermission) {
        const res = await plugin.checkPermission();
        return res === true || res?.granted === true;
      }

      return true; // Eski Android
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------
  // 🔄 App Resume
  // ----------------------------------------------------
  static async onAppResume() {
    try {
      await this.checkPermissions();
      await this.validateScheduledNotifications();
      if (this.isAndroid) await this.createAndroidChannel();
      return true;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------
  // 🧪 Debug (App.tsx için)
  // ----------------------------------------------------
  static async debugNotifications() {
    try {
      const status = await this.getNotificationStatus();
      const scheduled = await this.getScheduledNotifications();
      const channels = await LocalNotifications.listChannels();

      console.log("DEBUG INFO:", {
        status,
        scheduled,
        channels: channels.channels
      });

      return { status, scheduled, channels: channels.channels };
    } catch {
      return null;
    }
  }
}
