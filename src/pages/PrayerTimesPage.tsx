// src/pages/PrayerTimesPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Clock, Bell, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { PrayerTimesService } from '../services/prayerTimesService';

export const PrayerTimesPage: React.FC = () => {
  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city, district } = useSettingsStore();
  const { user } = useUserStore();

  // Local state for prayer reminders
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

  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        const times = await PrayerTimesService.getPrayerTimes(city || 'İstanbul');
        setPrayerTimes(times);
      } catch (error) {
        console.error('Failed to load prayer times:', error);
      }
    };

    loadPrayerTimes();
  }, [city, setPrayerTimes]);

  const handleToggleReminder = (prayerName: string) => {
    setReminderSettings(prev => ({
      ...prev,
      [prayerName]: {
        ...prev[prayerName],
        enabled: !prev[prayerName]?.enabled
      }
    }));
  };

  const handleReminderTimeChange = (prayerName: string, time: string) => {
    setReminderSettings(prev => ({
      ...prev,
      [prayerName]: {
        ...prev[prayerName],
        reminderTime: time
      }
    }));
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
                <span>
                  {district ? `${district}, ${city}` : city || 'İstanbul'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
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
        {/* Top Ad */}
        {!user?.isPremium && (
          <div className="w-full">
            <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
          </div>
        )}

        {/* Prayer Times */}
        <div className="space-y-1 w-full">
          {loading ? (
            // Loading skeleton
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

        {/* Global Settings */}
        <Card className="bg-gradient-to-r from-pink-50/80 via-orange-50/80 to-blue-50/80 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <Bell className="h-5 w-5 text-orange-600 dark:text-amber-400" />
              <span>Genel Ayarlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Tüm Hatırlatmaları Aç</h3>
                <p className="text-sm text-blue-600 dark:text-cyan-400">
                  Bütün namaz vakitleri için hatırlatma aktif et
                </p>
              </div>
              <Switch
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-blue-500"
                onCheckedChange={(checked) => {
                  const newSettings = { ...reminderSettings };
                  Object.keys(newSettings).forEach(prayer => {
                    newSettings[prayer].enabled = checked;
                  });
                  setReminderSettings(newSettings);
                }}
              />
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h3 className="font-medium text-pink-800 dark:text-purple-200">Sesli Bildirim</h3>
                <p className="text-sm text-blue-600 dark:text-cyan-400">
                  Hatırlatmalarda ses çal
                </p>
              </div>
              <Switch 
                defaultChecked={true}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Ad */}
        {!user?.isPremium && (
          <div className="w-full">
            <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </div>
    </div>
  );
};