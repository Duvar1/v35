import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationService {

  static async requestPermissions(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'granted') return true;

      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';

    } catch (error) {
      console.error("İzin hatası:", error);
      return false;
    }
  }

  static async checkStatus(): Promise<string> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== "granted") return "İzin Gerekli";

      const scheduled = await this.getScheduledNotifications();
      return scheduled.length > 0 ? "Aktif" : "Pasif";

    } catch {
      return "Hata";
    }
  }

  // ---------------------------------------------------
  // ÇİFT BİLDİRİM: ÖNCE + VAKİT GELDİ
  // ---------------------------------------------------
  static async schedulePrayerNotification(prayer: {
    id: string;
    name: string;
    time: string;
    reminderOffset: number;
  }) {
    try {
      const [hour, minute] = prayer.time.split(":").map(Number);

      // TAM VAKTİ
      const exactTime = new Date();
      exactTime.setHours(hour);
      exactTime.setMinutes(minute);
      exactTime.setSeconds(0);

      if (exactTime < new Date()) {
        exactTime.setDate(exactTime.getDate() + 1);
      }

      // ÖNCE BİLDİRİM (OFFSET)
      const beforeTime = new Date(exactTime);
      beforeTime.setMinutes(beforeTime.getMinutes() - prayer.reminderOffset);

      const beforeId = Number(`${prayer.id}1`);
      const exactId  = Number(`${prayer.id}2`);

      await LocalNotifications.schedule({
        notifications: [
          // 1) Önce bildirim
          {
            id: beforeId,
            title: `⏰ ${prayer.name} ${prayer.reminderOffset} dk sonra`,
            body: `${prayer.time} → ${prayer.name} için hazırlanın.`,
            schedule: { at: beforeTime },
            sound: "alert_sound",   // 🔔 FIXED SOUND
            extra: {
              type: "before",
              prayerName: prayer.name
            }
          },

          // 2) Tam vakit bildirimi
          {
            id: exactId,
            title: `🕌 ${prayer.name} Vakti Geldi`,
            body: `${prayer.time} → ${prayer.name} vakti başladı.`,
            schedule: { at: exactTime },
            sound: "alert_sound",   // 🔔 FIXED SOUND
            extra: {
              type: "exact",
              prayerName: prayer.name
            }
          }
        ]
      });

      return true;

    } catch (error) {
      console.error("Çift bildirim zamanlama hatası:", error);
      throw error;
    }
  }

  // ---------------------------------------------------
  // Çift bildirimi iptal et
  // ---------------------------------------------------
  static async cancelPrayerNotification(prayerId: string) {
    try {
      const beforeId = Number(`${prayerId}1`);
      const exactId  = Number(`${prayerId}2`);

      await LocalNotifications.cancel({
        notifications: [
          { id: beforeId },
          { id: exactId }
        ]
      });

    } catch (error) {
      console.error("Bildirim iptal hatası:", error);
    }
  }

  static async cancelAllNotifications() {
    try {
      const scheduled = await this.getScheduledNotifications();

      await LocalNotifications.cancel({
        notifications: scheduled.map(n => ({ id: n.id }))
      });

    } catch (error) {
      console.error("Tüm bildirimler iptal hatası:", error);
    }
  }

  static async getScheduledNotifications(): Promise<any[]> {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications ?? [];

    } catch (error) {
      console.error("Zamanlanmış bildirimler alınamadı:", error);
      return [];
    }
  }

  // ---------------------------------------------------
  // TEST BİLDİRİMİ (her zaman sesli)
  // ---------------------------------------------------
  static async sendTestNotification() {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title: "🔊 Test Bildirimi",
            body: "Ses çalma testi!",
            schedule: { at: new Date(Date.now() + 1000) },
            sound: "alert_sound",    // 🔔 FIXED SOUND
            extra: { type: "test" }
          }
        ]
      });

    } catch (error) {
      console.error("Test bildirimi hatası:", error);
      throw error;
    }
  }
}
