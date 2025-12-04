// src/pages/PrayerTimesPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Clock, Bell, MapPin, RefreshCw, AlertCircle, Info, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import { AdPlaceholder } from '@/components/AdPlaceholder';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '@/store/userStore';
import { PrayerTimesService } from '../services/prayerTimesService';
import { NotificationService } from '../services/notificationsService';
import { toast } from 'sonner';

const DEFAULT_SOUND = "alert_sound";

export const PrayerTimesPage: React.FC = () => {
  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city } = useSettingsStore();
  const { user } = useUserStore();

  const [reminderSettings, setReminderSettings] = useState<{
    [key: string]: { enabled: boolean; reminderTime: string }
  }>({
    İmsak: { enabled: false, reminderTime: '10' },
    Güneş: { enabled: false, reminderTime: '10' },
    Öğle: { enabled: false, reminderTime: '10' },
    İkindi: { enabled: false, reminderTime: '10' },
    Akşam: { enabled: false, reminderTime: '10' },
    Yatsı: { enabled: false, reminderTime: '10' },
  });

  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<string>('Bekleniyor...');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Bildirim durumunu kontrol et
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const status = await NotificationService.getNotificationStatus();
        console.log('🔔 Bildirim Durumu:', status);
        setNotificationStatus(status.hasPermission ? 'Aktif' : 'İzin Gerekli');

        const scheduled = await NotificationService.getScheduledNotifications();
        console.log('📅 Zamanlanmış bildirimler:', scheduled);
        setScheduledNotifications(scheduled);

        if (prayerTimes) {
          const newSettings = { ...reminderSettings };
          prayerTimes.prayers.forEach(prayer => {
            const isScheduled = scheduled.some(
              notif => notif.extra?.prayerName === prayer.name || 
                      notif.extra?.prayerId === prayer.id
            );
            newSettings[prayer.name] = {
              ...newSettings[prayer.name],
              enabled: isScheduled
            };
          });
          setReminderSettings(newSettings);
        }
      } catch (error) {
        console.error('❌ Bildirim durumu hatası:', error);
        setNotificationStatus('Kontrol edilemedi');
      }
    };

    checkNotificationStatus();
  }, [prayerTimes]);

  // Namaz vakitlerini yükle
  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        const times = await PrayerTimesService.getPrayerTimes(city || 'İstanbul');
        setPrayerTimes(times);
      } catch {
        toast.error('Namaz vakitleri yüklenemedi');
      }
    };
    loadPrayerTimes();
  }, [city, setPrayerTimes]);

  // Tek bildirim aç/kapat
  const handleToggleReminder = async (prayerName: string) => {
    const newEnabled = !reminderSettings[prayerName].enabled;
    const prayer = prayerTimes?.prayers.find(p => p.name === prayerName);
    
    if (!prayer) {
      toast.error('Namaz bulunamadı');
      return;
    }

    console.log(`🔄 ${prayerName} hatırlatması ${newEnabled ? 'açılıyor' : 'kapatılıyor'}`);

    try {
      // İzin kontrolü
      const hasPermission = await NotificationService.checkPermissions();
      if (!hasPermission) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          toast.error('📢 Bildirim izni verilmedi! Ayarlardan izin verin.');
          return;
        }
      }

      // State'i güncelle
      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: { 
          ...prev[prayerName], 
          enabled: newEnabled 
        }
      }));

      if (newEnabled) {
        const result = await NotificationService.schedulePrayerNotification({
          id: prayer.id,
          name: prayer.name,
          time: prayer.time,
          minutesBefore: parseInt(reminderSettings[prayerName].reminderTime),
        });

        if (result?.success) {
          const offset = reminderSettings[prayerName].reminderTime;
          const msg = offset === "0" 
            ? `✅ ${prayerName} vakti geldiğinde hatırlatılacak`
            : `✅ ${prayerName} hatırlatması ${offset} dakika önce ayarlandı`;
          toast.success(msg);
        }
      } else {
        await NotificationService.cancelPrayerNotifications(prayer.id);
        toast.info(`📴 ${prayerName} hatırlatması kapatıldı`);
      }

      // Zamanlanan bildirimleri güncelle
      const scheduled = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
      setNotificationStatus('Aktif');

    } catch (error) {
      console.error('❌ Bildirim hatası:', error);
      toast.error('Bildirim ayarlanamadı');
      
      // Hata durumunda state'i geri al
      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: { 
          ...prev[prayerName], 
          enabled: !newEnabled 
        }
      }));
    }
  };

  // Hatırlatma süresi değiştiğinde
  const handleReminderTimeChange = async (prayerName: string, time: string) => {
    const oldTime = reminderSettings[prayerName].reminderTime;
    const prayer = prayerTimes?.prayers.find(p => p.name === prayerName);
    
    if (!prayer) return;

    console.log(`⏱️ ${prayerName} hatırlatma süresi ${oldTime} → ${time} dakika`);

    // State'i güncelle
    setReminderSettings(prev => ({
      ...prev,
      [prayerName]: { 
        ...prev[prayerName], 
        reminderTime: time 
      }
    }));

    try {
      // Eğer hatırlatma aktifse, yeniden zamanla
      if (reminderSettings[prayerName].enabled) {
        // Önceki bildirimi iptal et
        await NotificationService.cancelPrayerNotifications(prayer.id);
        
        // Yeni süre ile yeniden zamanla
        await NotificationService.schedulePrayerNotification({
          id: prayer.id,
          name: prayer.name,
          time: prayer.time,
          minutesBefore: parseInt(time),
        });

        const msg = time === "0"
          ? `✅ ${prayerName} hatırlatma süresi VAKTİNDE olarak güncellendi`
          : `✅ ${prayerName} hatırlatma süresi ${time} dakika önce olarak güncellendi`;

        toast.success(msg);

        // Zamanlanan bildirimleri güncelle
        const scheduled = await NotificationService.getScheduledNotifications();
        setScheduledNotifications(scheduled);
      }

    } catch (error) {
      console.error('❌ Süre güncelleme hatası:', error);
      
      // Hata durumunda eski değere dön
      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: { 
          ...prev[prayerName], 
          reminderTime: oldTime 
        }
      }));
      
      toast.error("Süre güncellenemedi");
    }
  };

  // Tüm bildirimleri aç/kapat
  const handleToggleAllReminders = async (checked: boolean) => {
    console.log(`🔔 Tüm hatırlatmalar ${checked ? 'açılıyor' : 'kapatılıyor'}`);

    try {
      // İzin kontrolü
      const hasPermission = await NotificationService.checkPermissions();
      if (!hasPermission) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          toast.error('📢 Bildirim izni gerekli!');
          return;
        }
      }

      const updated = { ...reminderSettings };

      if (checked) {
        // Tüm namaz vakitleri için bildirim ayarla
        for (const prayer of prayerTimes?.prayers || []) {
          await NotificationService.schedulePrayerNotification({
            id: prayer.id,
            name: prayer.name,
            time: prayer.time,
            minutesBefore: parseInt(updated[prayer.name].reminderTime),
          });

          updated[prayer.name].enabled = true;
        }
        toast.success("✅ Tüm hatırlatmalar açıldı");

      } else {
        // Tüm bildirimleri iptal et
        const cancelledCount = await NotificationService.cancelAllNotifications();
        Object.keys(updated).forEach(k => {
          updated[k].enabled = false;
        });
        toast.info(`📴 ${cancelledCount} hatırlatma kapatıldı`);
      }

      setReminderSettings(updated);
      
      // Zamanlanan bildirimleri güncelle
      const scheduled = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
      setNotificationStatus(checked ? 'Aktif' : 'Pasif');

    } catch (error) {
      console.error('❌ Toplu işlem hatası:', error);
      toast.error("Toplu işlem yapılamadı");
    }
  };

  // Sayfayı yenile
  const handleRefresh = () => {
    window.location.reload();
  };

  // Sonraki namazı bul
  const getNextPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const p of prayerTimes.prayers) {
      const [h, m] = p.time.split(":").map(Number);
      const total = h * 60 + m;
      if (total > nowMinutes) return p.name;
    }
    return prayerTimes.prayers[0]?.name || null;
  };

  const nextPrayer = getNextPrayer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90 dark:from-purple-900/90 dark:via-blue-900/90 dark:to-cyan-900/90 backdrop-blur-md border-b border-pink-200/50 dark:border-purple-500/30 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
            <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">Namaz Vakitleri</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-blue-600 dark:text-cyan-400 flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{city || 'İstanbul'}</span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/50"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="px-4 space-y-6 pb-20 pt-6">

        {/* Reklam */}
        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="w-full" />
        )}

        {/* Bilgi Kartı */}
        <Card className="bg-gradient-to-r from-amber-50/80 via-yellow-50/80 to-orange-50/80 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30 border-amber-200/50 dark:border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">{city || 'İstanbul'} için vakitler</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Bildirimler ezan vaktinden önce seçtiğiniz dakikada çalar.
                  📍 Sadece şehir merkezlerinin vakitleri dikkate alınmıştır.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Namaz Vakitleri */}
        <div className="space-y-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gradient-to-r from-pink-200/60 via-orange-200/60 to-blue-200/60 dark:from-purple-800/40 dark:via-blue-800/40 dark:to-cyan-800/40 h-20 rounded-xl"></div>
            ))
          ) : (
            prayerTimes?.prayers.map(prayer => (
              <PrayerTimeCard
                key={prayer.name}
                name={prayer.name}
                time={prayer.time}
                isNext={prayer.name === nextPrayer}
                enabled={reminderSettings[prayer.name].enabled}
                onToggle={() => handleToggleReminder(prayer.name)}
                reminderTime={reminderSettings[prayer.name].reminderTime}
                onReminderChange={t => handleReminderTimeChange(prayer.name, t)}
              />
            ))
          )}
        </div>

        {/* Bildirim Durumu */}
        <Card className="bg-gradient-to-r from-green-50/80 via-emerald-50/80 to-teal-50/80 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 border-green-200/50 dark:border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  🔔 Bildirim Durumu
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  {scheduledNotifications.length > 0 
                    ? `${scheduledNotifications.length} aktif hatırlatma`
                    : 'Aktif hatırlatma yok'}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                notificationStatus.includes('Aktif') 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
              }`}>
                {notificationStatus}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Genel Ayarlar */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm border-pink-200/50 dark:border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <Bell className="h-5 w-5 text-orange-600 dark:text-amber-400" />
              <span>Genel Ayarlar</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Tüm hatırlatmalar */}
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Tüm Hatırlatmaları Aç/Kapat</h3>
                <p className="text-sm text-blue-600 dark:text-cyan-400">
                  Bütün namaz vakitleri için hatırlatmayı tek tıkla yönet
                </p>
              </div>
              <Switch
                checked={Object.values(reminderSettings).every(s => s.enabled)}
                onCheckedChange={handleToggleAllReminders}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-blue-500"
              />
            </div>

            {/* Ezan Sesi */}
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Ezan Sesi</h3>
                <p className="text-sm text-blue-600 dark:text-cyan-400">
                  30 saniyelik ezan sesi
                </p>
              </div>
              <Switch 
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-blue-500"
              />
            </div>

            {/* Test Bildirimi */}
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Test Bildirimi</h3>
                <p className="text-sm text-blue-600 dark:text-cyan-400">
                  Bildirim sistemini test et
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-900/50"
                onClick={async () => {
                  try {
                    await NotificationService.sendTestNotification();
                    toast.success("🔔 Test bildirimi gönderildi! 3 saniye sonra çalar");
                  } catch {
                    toast.error("❌ Test bildirimi gönderilemedi");
                  }
                }}
              >
                Ses Testi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Önemli Uyarı */}
        <Card className="bg-gradient-to-r from-red-50/80 via-rose-50/80 to-pink-50/80 dark:from-red-900/30 dark:via-rose-900/30 dark:to-pink-900/30 border-red-200/50 dark:border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  ⚠️ Önemli Uyarı
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  • Bildirimlerin çalışması için uygulamayı tamamen kapatmayın<br/>
                  • Pil tasarrufu modu bildirimleri engelleyebilir<br/>
                  • Her gün otomatik olarak yenilenir
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reklam */}
        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="w-full" />
        )}

        {/* Debug Panel (Geliştirme için) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="text-sm">🔧 Debug Panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <p>Zamanlanmış: {scheduledNotifications.length}</p>
                <p>Durum: {notificationStatus}</p>
                <p>Saat: {new Date().toLocaleTimeString('tr-TR')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const status = await NotificationService.getNotificationStatus();
                    console.log('🔍 Bildirim Durumu:', status);
                    toast.info(`📊 Durum: ${status.scheduledCount} bildirim`);
                  }}
                >
                  Durum Kontrol
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const count = await NotificationService.cancelAllNotifications();
                    toast.info(`🗑️ ${count} bildirim iptal edildi`);
                    setScheduledNotifications([]);
                    setNotificationStatus('Pasif');
                  }}
                >
                  Tümünü Temizle
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};