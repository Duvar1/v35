// src/services/notificationsService.ts
import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationService {
  // İzinleri iste
  static async requestPermissions(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display === 'granted') {
        return true;
      }
      
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('İzin hatası:', error);
      return false;
    }
  }

  // Bildirim durumunu kontrol et
  static async checkStatus(): Promise<string> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display !== 'granted') {
        return 'İzin Gerekli';
      }
      
      const scheduled = await this.getScheduledNotifications();
      return scheduled.length > 0 ? 'Aktif' : 'Pasif';
    } catch (error) {
      return 'Hata';
    }
  }

  // Namaz bildirimi zamanla
  static async schedulePrayerNotification(prayer: {
    id: string;
    name: string;
    time: string;
    reminderOffset: number;
    soundEnabled: boolean;
  }) {
    try {
      // Zamanı hesapla
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const notificationTime = new Date();
      notificationTime.setHours(hours);
      notificationTime.setMinutes(minutes - prayer.reminderOffset);
      notificationTime.setSeconds(0);

      // Eğer geçmiş bir zamansa yarın için ayarla
      if (notificationTime < new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      // Bildirimi zamanla
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.generateNotificationId(prayer.id, notificationTime),
            title: `⏰ ${prayer.name} Vakti Yaklaşıyor`,
            body: `${prayer.reminderOffset} dakika sonra ${prayer.name} vakti (${prayer.time})`,
            schedule: { at: notificationTime },
            sound: prayer.soundEnabled ? 'azan.mp3' : null,
            extra: {
              prayerName: prayer.name,
              prayerTime: prayer.time,
              reminderOffset: prayer.reminderOffset,
              type: 'prayer_reminder'
            }
          },
        ],
      });

      return true;
    } catch (error) {
      console.error('Bildirim zamanlama hatası:', error);
      throw error;
    }
  }

  // Tekil namaz bildirimini iptal et
  static async cancelPrayerNotification(prayerId: string) {
    try {
      const scheduled = await this.getScheduledNotifications();
      const notificationToCancel = scheduled.find(n => 
        n.extra?.type === 'prayer_reminder' && 
        n.id.toString().includes(prayerId)
      );

      if (notificationToCancel) {
        await LocalNotifications.cancel({
          notifications: [{ id: notificationToCancel.id }]
        });
      }
    } catch (error) {
      console.error('Bildirim iptal hatası:', error);
    }
  }

  // Tüm bildirimleri iptal et - DÜZELTİLDİ: cancel kullan
  static async cancelAllNotifications() {
    try {
      const scheduled = await this.getScheduledNotifications();
      const ids = scheduled.map(n => ({ id: n.id }));
      
      if (ids.length > 0) {
        await LocalNotifications.cancel({ notifications: ids });
      }
    } catch (error) {
      console.error('Tüm bildirimler iptal hatası:', error);
    }
  }

  // Zamanlanmış bildirimleri getir
  static async getScheduledNotifications(): Promise<any[]> {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications || [];
    } catch (error) {
      console.error('Zamanlanmış bildirimler alınamadı:', error);
      return [];
    }
  }

  // Test bildirimi gönder
  static async sendTestNotification() {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title: '✅ Test Bildirimi',
            body: 'Namaz hatırlatma sistemi çalışıyor!',
            schedule: { at: new Date(Date.now() + 1000) }, // 1 saniye sonra
            sound: 'azan.mp3',
            extra: { type: 'test' }
          },
        ],
      });
    } catch (error) {
      console.error('Test bildirimi hatası:', error);
      throw error;
    }
  }

  // Benzersiz bildirim ID'si oluştur
  private static generateNotificationId(prayerId: string, date: Date): number {
    const baseId = prayerId.charCodeAt(0) + prayerId.charCodeAt(prayerId.length - 1);
    const dateId = date.getDate() * 100 + date.getHours() * 10 + date.getMinutes();
    return baseId * 10000 + dateId;
  }
}