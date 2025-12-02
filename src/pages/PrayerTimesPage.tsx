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

export const PrayerTimesPage: React.FC = () => {
  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city } = useSettingsStore();   // << DISTRICT SİLİNDİ
  const { user } = useUserStore();

  const [reminderSettings, setReminderSettings] = useState<{
    [key: string]: { enabled: boolean; reminderTime: string }
  }>({
    'İmsak': { enabled: false, reminderTime: '10' },
    'Güneş': { enabled: false, reminderTime: '10' },
    'Öğle': { enabled: false, reminderTime: '10' },
    'İkindi': { enabled: false, reminderTime: '10' },
    'Akşam': { enabled: false, reminderTime: '10' },
    'Yatsı': { enabled: false, reminderTime: '10' },
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
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
            const isScheduled = scheduled.some(notif => 
              notif.extra?.prayerName === prayer.name
            );
            newSettings[prayer.name] = {
              ...newSettings[prayer.name],
              enabled: isScheduled
            };
          });
          setReminderSettings(newSettings);
        }
      } catch (error) {
        console.log('Bildirim durumu kontrol edilemedi:', error);
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
      } catch (error) {
        console.error('Namaz vakitleri yüklenemedi:', error);
        toast.error('Namaz vakitleri yüklenemedi');
      }
    };

    loadPrayerTimes();
  }, [city, setPrayerTimes]);

  const handleToggleReminder = async (prayerName: string) => {
    const newEnabled = !reminderSettings[prayerName]?.enabled;
    
    try {
      await NotificationService.requestPermissions();
      
      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: {
          ...prev[prayerName],
          enabled: newEnabled
        }
      }));

      if (newEnabled && prayerTimes) {
        const prayer = prayerTimes.prayers.find(p => p.name === prayerName);
        if (prayer) {
          await NotificationService.schedulePrayerNotification({
            id: prayer.id,
            name: prayer.name,
            time: prayer.time,
            reminderOffset: parseInt(reminderSettings[prayerName]?.reminderTime || '10'),
            soundEnabled: soundEnabled
          });
          
          toast.success(`${prayerName} hatırlatması ayarlandı`);

          const scheduled = await NotificationService.getScheduledNotifications();
          setScheduledNotifications(scheduled);
        }
      } else if (!newEnabled) {
        const prayer = prayerTimes?.prayers.find(p => p.name === prayerName);
        if (prayer) {
          await NotificationService.cancelPrayerNotification(prayer.id);
          toast.info(`${prayerName} hatırlatması kapatıldı`);

          const scheduled = await NotificationService.getScheduledNotifications();
          setScheduledNotifications(scheduled);
        }
      }
    } catch (error) {
      console.error('Bildirim hatası:', error);
      toast.error('Bildirim ayarlanamadı');
      
      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: {
          ...prev[prayerName],
          enabled: !newEnabled
        }
      }));
    }
  };

  const handleReminderTimeChange = async (prayerName: string, time: string) => {
    const oldSettings = { ...reminderSettings[prayerName] };
    
    setReminderSettings(prev => ({
      ...prev,
      [prayerName]: {
        ...prev[prayerName],
        reminderTime: time
      }
    }));

    try {
      if (oldSettings.enabled && prayerTimes) {
        const prayer = prayerTimes.prayers.find(p => p.name === prayerName);
        if (prayer) {
          await NotificationService.cancelPrayerNotification(prayer.id);
          
          await NotificationService.schedulePrayerNotification({
            id: prayer.id,
            name: prayer.name,
            time: prayer.time,
            reminderOffset: parseInt(time),
            soundEnabled: soundEnabled
          });
          
          toast.success(`${prayerName} hatırlatma süresi güncellendi`);

          const scheduled = await NotificationService.getScheduledNotifications();
          setScheduledNotifications(scheduled);
        }
      }
    } catch (error) {
      console.error('Bildirim güncellenemedi:', error);
      toast.error('Hatırlatma süresi güncellenemedi');
      
      setReminderSettings(prev => ({
        ...prev,
        [prayerName]: {
          ...prev[prayerName],
          reminderTime: oldSettings.reminderTime
        }
      }));
    }
  };

  const handleToggleAllReminders = async (checked: boolean) => {
    try {
      await NotificationService.requestPermissions();
      
      const newSettings = { ...reminderSettings };
      
      if (checked) {
        if (prayerTimes) {
          for (const prayer of prayerTimes.prayers) {
            await NotificationService.schedulePrayerNotification({
              id: prayer.id,
              name: prayer.name,
              time: prayer.time,
              reminderOffset: parseInt(newSettings[prayer.name]?.reminderTime || '10'),
              soundEnabled: soundEnabled
            });
            
            newSettings[prayer.name].enabled = true;
          }
          toast.success('Tüm hatırlatmalar açıldı');
        }
      } else {
        await NotificationService.cancelAllNotifications();
        toast.info('Tüm hatırlatmalar kapatıldı');
        
        Object.keys(newSettings).forEach(prayer => {
          newSettings[prayer].enabled = false;
        });
      }
      
      setReminderSettings(newSettings);

      const scheduled = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
      
    } catch (error) {
      console.error('Tüm bildirimler ayarlanamadı:', error);
      toast.error('Tüm hatırlatmalar ayarlanamadı');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const prayer of prayerTimes.prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (prayerTime > currentTime) {
        return prayer.name;
      }
    }
    
    return prayerTimes.prayers[0]?.name || null;
  };

  const nextPrayer = getNextPrayer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 no-horizontal-scroll">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90 dark:from-purple-900/90 dark:via-blue-900/90 dark:to-cyan-900/90 backdrop-blur-md border-b border-pink-200/50 dark:border-purple-500/30">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
              <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">
                Namaz Vakitleri
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-cyan-400">
                <MapPin className="h-4 w-4" />
                <span>{city}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-purple-500 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20 px-4 space-y-6 pt-6 w-full max-w-full overflow-x-hidden">

        {!user?.isPremium && (
          <div className="w-full">
            <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
          </div>
        )}

        <Card className="bg-gradient-to-r from-amber-50/80 via-yellow-50/80 to-orange-50/80 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30 border-amber-200/50 dark:border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  📍 {city} için vakitler
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Her namaz vaktinden önce seçtiğiniz dakika kadar hatırlatma alırsınız.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-1 w-full">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gradient-to-r from-pink-200/60 via-orange-200/60 to-blue-200/60 dark:from-purple-800/40 dark:via-blue-800/40 dark:to-cyan-800/40 h-20 rounded-xl mb-3 w-full"></div>
            ))
          ) : (
            prayerTimes?.prayers.map((prayer) => (
              <div key={prayer.name} className="w-full">
                <PrayerTimeCard
                  name={prayer.name}
                  time={prayer.time}
                  isNext={prayer.name === nextPrayer}
                  enabled={reminderSettings[prayer.name]?.enabled || false}
                  onToggle={() => handleToggleReminder(prayer.name)}
                  reminderTime={reminderSettings[prayer.name]?.reminderTime || '10'}
                  onReminderChange={(time) => handleReminderTimeChange(prayer.name, time)}
                />
              </div>
            ))
          )}
        </div>

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

        <Card className="bg-gradient-to-r from-pink-50/80 via-orange-50/80 to-blue-50/80 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <Bell className="h-5 w-5 text-orange-600 dark:text-amber-400" />
              <span>Genel Ayarlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Tüm Hatırlatmaları Aç/Kapat</h3>
              </div>
              <Switch
                checked={Object.values(reminderSettings).every(s => s.enabled)}
                onCheckedChange={handleToggleAllReminders}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-blue-500"
              />
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Ezan Sesi</h3>
              </div>
              <Switch 
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-blue-500"
              />
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Test Bildirimi</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await NotificationService.sendTestNotification();
                    toast.success('Test bildirimi gönderildi');
                  } catch (error) {
                    toast.error('Test bildirimi gönderilemedi');
                  }
                }}
                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-900/50"
              >
                Test Et
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50/80 via-rose-50/80 to-pink-50/80 dark:from-red-900/30 dark:via-rose-900/30 dark:to-pink-900/30 border-red-200/50 dark:border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">⚠️ Önemli Uyarı</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  • Pil tasarrufu modu bildirimleri geciktirebilir <br/>
                  • Uygulama kapalı olsa bile hatırlatmalar çalışır
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!user?.isPremium && (
          <div className="w-full">
            <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
          </div>
        )}

        <div className="h-4"></div>
      </div>
    </div>
  );
};
