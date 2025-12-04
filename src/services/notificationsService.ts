// src/services/notificationsService.ts
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  // Platform kontrolü
  static isAndroid = Capacitor.getPlatform() === 'android';
  static isIOS = Capacitor.getPlatform() === 'ios';
  static isWeb = Capacitor.getPlatform() === 'web';

  // İzinleri kontrol et
  static async checkPermissions(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      const granted = permission.display === 'granted';
      console.log('🔔 İzin durumu:', permission.display);
      return granted;
    } catch (error) {
      console.error('❌ İzin kontrol hatası:', error);
      return false;
    }
  }

  // İzin iste
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔔 İzin isteniyor...');
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      console.log('🔔 İzin sonucu:', result.display);
      
      if (granted && this.isAndroid) {
        // Android için notification channel oluştur
        await this.createAndroidChannel();
      }
      
      return granted;
    } catch (error) {
      console.error('❌ İzin isteme hatası:', error);
      return false;
    }
  }

  // Android için notification channel oluştur
  static async createAndroidChannel() {
    try {
      await LocalNotifications.createChannel({
        id: 'prayer_reminders',
        name: 'Namaz Hatırlatmaları',
        description: 'Namaz vakitleri için hatırlatmalar',
        importance: 5, // HIGH
        sound: 'alert_sound.wav',
        vibration: true,
        lights: true,
        lightColor: '#FF5733',
      });
      console.log('✅ Android notification channel oluşturuldu');
    } catch (error) {
      console.error('❌ Channel oluşturma hatası:', error);
    }
  }

  // Namaz bildirimi zamanla
  static async schedulePrayerNotification(prayer: {
    id: string;
    name: string;
    time: string;
    minutesBefore: number;
  }) {
    try {
      console.log('⏰ Bildirim zamanlanıyor:', prayer);
      
      // Zamanı hesapla
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const notificationTime = new Date();
      notificationTime.setHours(hours);
      notificationTime.setMinutes(minutes - prayer.minutesBefore);
      notificationTime.setSeconds(0);

      // Eğer geçmiş bir zamansa yarın için ayarla
      if (notificationTime < new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
        console.log('📅 Geçmiş zaman, yarına ayarlandı');
      }

      // Bildirim ID'si oluştur
      const notificationId = this.generateId(prayer.id, notificationTime);
      
      // Ses dosyası ayarla
      let soundFile = null;
      if (this.isAndroid) {
        soundFile = 'alert_sound.wav';
      } else if (this.isIOS) {
        soundFile = 'alert_sound.wav';
      } else {
        soundFile = 'alert_sound.wav'; // Web için
      }

      // Bildirim ayarları
      const notification = {
        id: notificationId,
        title: `⏰ ${prayer.name} Vakti Yaklaşıyor`,
        body: `${prayer.minutesBefore} dakika sonra ${prayer.name} vakti (${prayer.time})`,
        schedule: { at: notificationTime },
        sound: soundFile,
        extra: {
          prayerName: prayer.name,
          prayerTime: prayer.time,
          prayerId: prayer.id,
          minutesBefore: prayer.minutesBefore,
          type: 'prayer_reminder',
          timestamp: notificationTime.getTime()
        }
      };

      // Android için channel ekle
      if (this.isAndroid) {
        notification['channelId'] = 'prayer_reminders';
      }

      console.log('📋 Bildirim ayarları:', notification);
      
      // Bildirimi zamanla
      await LocalNotifications.schedule({
        notifications: [notification]
      });

      console.log(`✅ ${prayer.name} için bildirim zamanlandı:`, notificationTime.toLocaleString('tr-TR'));
      return { success: true, time: notificationTime };
      
    } catch (error) {
      console.error('❌ Bildirim zamanlama hatası:', error);
      throw error;
    }
  }

  // Belirli bir namaz için tüm bildirimleri iptal et
  static async cancelPrayerNotifications(prayerId: string) {
    try {
      const scheduled = await this.getScheduledNotifications();
      const notificationsToCancel = scheduled.filter(n => 
        n.extra?.prayerId === prayerId || n.extra?.type === 'prayer_reminder'
      );

      if (notificationsToCancel.length > 0) {
        await LocalNotifications.cancel({
          notifications: notificationsToCancel.map(n => ({ id: n.id }))
        });
        console.log(`🗑️ ${notificationsToCancel.length} bildirim iptal edildi`);
      }
      
      return notificationsToCancel.length;
    } catch (error) {
      console.error('❌ Bildirim iptal hatası:', error);
      return 0;
    }
  }

  // Tüm bildirimleri iptal et
  static async cancelAllNotifications() {
    try {
      const scheduled = await this.getScheduledNotifications();
      
      if (scheduled.length > 0) {
        await LocalNotifications.cancel({
          notifications: scheduled.map(n => ({ id: n.id }))
        });
        console.log(`🗑️ Tüm ${scheduled.length} bildirim iptal edildi`);
      }
      
      return scheduled.length;
    } catch (error) {
      console.error('❌ Tüm bildirimler iptal hatası:', error);
      return 0;
    }
  }

  // Zamanlanmış bildirimleri getir
  static async getScheduledNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      const notifications = pending.notifications || [];
      console.log(`📅 ${notifications.length} zamanlanmış bildirim`);
      return notifications;
    } catch (error) {
      console.error('❌ Zamanlanmış bildirimler alınamadı:', error);
      return [];
    }
  }

  // Hangi namazlar için bildirim var
  static async getScheduledPrayers(): Promise<string[]> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const prayerNames = scheduled
        .filter(n => n.extra?.type === 'prayer_reminder')
        .map(n => n.extra?.prayerName)
        .filter(Boolean) as string[];
      
      return [...new Set(prayerNames)]; // Benzersiz isimler
    } catch (error) {
      console.error('❌ Zamanlanmış namazlar alınamadı:', error);
      return [];
    }
  }

  // Test bildirimi gönder (hemen)
  static async sendTestNotification() {
    try {
      console.log('🧪 Test bildirimi gönderiliyor...');
      
      // 3 saniye sonra test bildirimi
      const testTime = new Date(Date.now() + 3000);
      
      await LocalNotifications.schedule({
        notifications: [{
          id: 99999,
          title: '🔔 Ezan Sesi Testi',
          body: '30 saniyelik ezan sesini dinleyin...',
          schedule: { at: testTime },
          sound: 'alert_sound.wav',
          extra: {
            type: 'test',
            timestamp: Date.now()
          }
        }]
      });

      console.log('✅ Test bildirimi zamanlandı');
      return { success: true, time: testTime };
      
    } catch (error) {
      console.error('❌ Test bildirimi hatası:', error);
      throw error;
    }
  }

  // Bildirim durumunu kontrol et
  static async getNotificationStatus() {
    try {
      const hasPermission = await this.checkPermissions();
      const scheduled = await this.getScheduledNotifications();
      const scheduledPrayers = await this.getScheduledPrayers();
      
      return {
        hasPermission,
        scheduledCount: scheduled.length,
        scheduledPrayers,
        platform: Capacitor.getPlatform(),
        time: new Date().toLocaleString('tr-TR')
      };
    } catch (error) {
      console.error('❌ Durum kontrol hatası:', error);
      return {
        hasPermission: false,
        scheduledCount: 0,
        scheduledPrayers: [],
        platform: Capacitor.getPlatform(),
        error: error.message
      };
    }
  }

  // Benzersiz ID oluştur
  private static generateId(prayerId: string, date: Date): number {
    // prayerId'den bir sayı oluştur (ör: "imsak" → 105, 109, 115, 97, 107)
    let idHash = 0;
    for (let i = 0; i < prayerId.length; i++) {
      idHash += prayerId.charCodeAt(i);
    }
    
    // Tarih bilgisini ekle (ggssdd formatında)
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const dateHash = day * 10000 + hour * 100 + minute;
    
    // Benzersiz ID (max 2147483647)
    const finalId = (idHash % 1000) * 1000000 + (dateHash % 1000000);
    return Math.abs(finalId % 2147483647);
  }
}