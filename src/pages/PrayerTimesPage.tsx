// src/pages/PrayerTimesPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Clock, Bell, MapPin, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import { AdPlaceholder } from '@/components/AdPlaceholder';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { PrayerTimesService } from '../services/prayerTimesService';
import { NotificationService } from '../services/notificationsService';
import { toast } from 'sonner';

const DEFAULT_SOUND = "alert_sound_long.wav";

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

  // Bildirim durumunu kontrol et
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const status = await NotificationService.checkStatus();
        setNotificationStatus(status);

        const scheduled = await NotificationService.getScheduledNotifications();
        setScheduledNotifications(scheduled);

        if (prayerTimes) {
          const newSettings = { ...reminderSettings };
          prayerTimes.prayers.forEach(prayer => {
            const isScheduled = scheduled.some(
              notif => notif.extra?.prayerName === prayer.name
            );
            newSettings[prayer.name].enabled = isScheduled;
          });
          setReminderSettings(newSettings);
        }
      } catch {
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

    try {
      await NotificationService.requestPermissions();

      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: { ...prev[prayerName], enabled: newEnabled }
      }));

      const prayer = prayerTimes?.prayers.find(p => p.name === prayerName);

      if (!prayer) return;

      if (newEnabled) {
        await NotificationService.schedulePrayerNotification({
          id: prayer.id,
          name: prayer.name,
          time: prayer.time,
          reminderOffset: parseInt(reminderSettings[prayerName].reminderTime),
          sound: DEFAULT_SOUND
        });

        toast.success(`${prayerName} hatırlatması açıldı`);
      } else {
        await NotificationService.cancelPrayerNotification(prayer.id);
        toast.info(`${prayerName} hatırlatması kapatıldı`);
      }

      setScheduledNotifications(await NotificationService.getScheduledNotifications());

    } catch {
      toast.error("Bildirim ayarlanamadı");
    }
  };

  // Hatırlatma süresi değiştiğinde
  const handleReminderTimeChange = async (prayerName: string, time: string) => {
    const oldTime = reminderSettings[prayerName].reminderTime;

    setReminderSettings(prev => ({
      ...prev,
      [prayerName]: { ...prev[prayerName], reminderTime: time }
    }));

    try {
      const prayer = prayerTimes?.prayers.find(p => p.name === prayerName);
      if (!prayer) return;

      if (reminderSettings[prayerName].enabled) {
        await NotificationService.cancelPrayerNotification(prayer.id);

        await NotificationService.schedulePrayerNotification({
          id: prayer.id,
          name: prayer.name,
          time: prayer.time,
          reminderOffset: parseInt(time),
          sound: DEFAULT_SOUND
        });

        toast.success(`${prayerName} hatırlatma süresi güncellendi`);

        setScheduledNotifications(await NotificationService.getScheduledNotifications());
      }

    } catch {
      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: { ...prev[prayerName], reminderTime: oldTime }
      }));
      toast.error("Süre güncellenemedi");
    }
  };

  // Tüm bildirimleri aç/kapat
  const handleToggleAllReminders = async (checked: boolean) => {
    try {
      await NotificationService.requestPermissions();

      const updated = { ...reminderSettings };

      if (checked) {
        for (const prayer of prayerTimes?.prayers || []) {
          await NotificationService.schedulePrayerNotification({
            id: prayer.id,
            name: prayer.name,
            time: prayer.time,
            reminderOffset: parseInt(updated[prayer.name].reminderTime),
            sound: DEFAULT_SOUND
          });

          updated[prayer.name].enabled = true;
        }
        toast.success("Tüm hatırlatmalar açıldı");

      } else {
        await NotificationService.cancelAllNotifications();
        Object.keys(updated).forEach(k => (updated[k].enabled = false));
        toast.info("Tüm hatırlatmalar kapatıldı");
      }

      setReminderSettings(updated);
      setScheduledNotifications(await NotificationService.getScheduledNotifications());

    } catch {
      toast.error("Toplu işlem yapılamadı");
    }
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
      <div className="sticky top-0 z-10 backdrop-blur-md border-b p-4 bg-gradient-to-r">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-light text-pink-800">Namaz Vakitleri</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-blue-600 flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{city}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="px-4 space-y-6 pb-20 pt-6">

        {!user?.isPremium && (
          <AdPlaceholder type="banner" />
        )}

        {/* Namaz Vakitleri */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">{city} için vakitler</p>
                <p className="text-xs text-amber-600">
                  Bildirimler ezan vaktinden önce seçtiğiniz dakikada çalar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-pink-200 h-20 rounded-xl"></div>
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

        {/* Genel Ayarlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <span>Genel Ayarlar</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Tüm hatırlatmalar */}
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Tüm Hatırlatmaları Aç/Kapat</h3>
              <Switch
                checked={Object.values(reminderSettings).every(s => s.enabled)}
                onCheckedChange={handleToggleAllReminders}
              />
            </div>

            {/* Test Bildirimi */}
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Test Bildirimi</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await NotificationService.sendTestNotification(DEFAULT_SOUND);
                    toast.success("Test bildirimi gönderildi");
                  } catch {
                    toast.error("Gönderilemedi");
                  }
                }}
              >
                Test Et
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};
