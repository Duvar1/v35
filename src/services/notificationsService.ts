// src/services/notificationsService.ts
import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationService {

  // ---------------------------------------------------
  // 1) Bildirim izinleri
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // 2) Durum kontrol
  // ---------------------------------------------------
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
  // 3) Namaz bildirimi oluştur
  // ---------------------------------------------------
  static async schedulePrayerNotification(prayer: {
    id: string;
    name: string;
    time: string;
    reminderOffset: number;
    sound?: string | null;
  }) {
    try {
      // Namaz saatinden önce kaç dakika?
      const [h, m] = prayer.time.split(":").map(Number);
      const notifTime = new Date();
      notifTime.setHours(h);
      notifTime.setMinutes(m - prayer.reminderOffset);
      notifTime.setSeconds(0);

      // Geçmiş saatse → yarına at
      if (notifTime < new Date()) {
        notifTime.setDate(notifTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.generateNotificationId(prayer.id, notifTime),
            title: `⏰ ${prayer.name} Vakti Yaklaşıyor`,
            body: `${prayer.reminderOffset} dakika sonra ${prayer.name} vakti (${prayer.time})`,
            schedule: { at: notifTime },
            sound: prayer.sound ?? undefined,   // ← SES BURADA DEVREYE GİRİYOR
            extra: {
              prayerName: prayer.name,
              prayerTime: prayer.time,
              reminderOffset: prayer.reminderOffset,
              type: "prayer_reminder",
            },
          },
        ],
      });

      return true;

    } catch (error) {
      console.error("Bildirim zamanlama hatası:", error);
      throw error;
    }
  }

  // ---------------------------------------------------
  // 4) Tek namaz bildirimi iptal
  // ---------------------------------------------------
  static async cancelPrayerNotification(prayerId: string) {
    try {
      const scheduled = await this.getScheduledNotifications();
      const found = scheduled.find(
        n =>
          n.extra?.type === "prayer_reminder" &&
          n.id.toString().includes(prayerId)
      );

      if (found) {
        await LocalNotifications.cancel({
          notifications: [{ id: found.id }],
        });
      }

    } catch (error) {
      console.error("Bildirim iptal hatası:", error);
    }
  }

  // ---------------------------------------------------
  // 5) Tüm bildirimleri iptal et
  // ---------------------------------------------------
  static async cancelAllNotifications() {
    try {
      const scheduled = await this.getScheduledNotifications();
      if (scheduled.length === 0) return;

      await LocalNotifications.cancel({
        notifications: scheduled.map(n => ({ id: n.id })),
      });

    } catch (error) {
      console.error("Tüm bildirimler iptal hatası:", error);
    }
  }

  // ---------------------------------------------------
  // 6) Pending bildirimleri getir
  // ---------------------------------------------------
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
  // 7) TEST BİLDİRİMİ (SES DESTEKLİ)
  // ---------------------------------------------------
  static async sendTestNotification(sound?: string | null) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title: "🔊 Test Bildirimi",
            body: "Sesli bildirim testi!",
            schedule: { at: new Date(Date.now() + 1000) },
            sound: sound ?? undefined,   // ← SES İSTEĞE BAĞLI
            extra: { type: "test" },
          },
        ],
      });

    } catch (error) {
      console.error("Test bildirimi hatası:", error);
      throw error;
    }
  }

  // ---------------------------------------------------
  // 8) ID Üretici
  // ---------------------------------------------------
  private static generateNotificationId(prayerId: string, date: Date): number {
    const base = prayerId.charCodeAt(0) + prayerId.charCodeAt(prayerId.length - 1);
    const dateId = date.getHours() * 100 + date.getMinutes();
    return base * 10000 + dateId;
  }
}
