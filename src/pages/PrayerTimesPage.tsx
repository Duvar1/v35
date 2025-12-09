// src/pages/PrayerTimesPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, pop } from "../lib/motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, RefreshCw, AlertCircle, Info, Bell } from "lucide-react";

import { PrayerTimeCard } from "../components/PrayerTimeCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";

import { usePrayerStore } from "../store/prayerStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUserStore } from "@/store/userStore";

import { PrayerTimesService } from "../services/prayerTimesService";
import { NotificationService } from "../services/notificationsService";
import { CustomSwitch } from "@/components/CustomSwitch";

import { toast } from "sonner";

interface ReminderItem {
  enabled: boolean;
  time: string;
}

type ReminderMap = Record<string, ReminderItem>;

// LocalStorage key
const REMINDER_KEY = "prayerReminderSettings";

// Varsayılan yapı
const DEFAULTS = {
  İmsak: { enabled: false, time: "10" },
  Güneş: { enabled: false, time: "10" },
  Öğle: { enabled: false, time: "10" },
  İkindi: { enabled: false, time: "10" },
  Akşam: { enabled: false, time: "10" },
  Yatsı: { enabled: false, time: "10" }
};

export const PrayerTimesPage: React.FC = () => {
  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city } = useSettingsStore();
  const { user } = useUserStore();

  // Toast Lock
  const toastLock = useRef(false);
  const safeToast = (fn: () => void) => {
    if (toastLock.current) return;
    toastLock.current = true;
    fn();
    setTimeout(() => (toastLock.current = false), 200);
  };

  // Kaydedilmiş hatırlatma ayarlarını yükle
  const loadFromLocal = () => {
    try {
      const saved = localStorage.getItem(REMINDER_KEY);
      if (!saved) return DEFAULTS;
      return { ...DEFAULTS, ...JSON.parse(saved) };
    } catch {
      return DEFAULTS;
    }
  };

  const saveToLocal = (data: any) => {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(data));
  };

  // STATE
  const [reminders, setReminders] = useState<ReminderMap>(loadFromLocal());
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [status, setStatus] = useState("Bekleniyor...");

  // NAMAZ VAKİTLERİ
  useEffect(() => {
    const load = async () => {
      try {
        const res = await PrayerTimesService.getPrayerTimes(city || "İstanbul");
        setPrayerTimes(res);
      } catch {
        safeToast(() => toast.error("Vakitler yüklenemedi"));
      }
    };
    load();
  }, [city]);

  // PLANLANMIŞ BİLDİRİMLERİ ÇEK
  useEffect(() => {
    const load = async () => {
      const s = await NotificationService.getNotificationStatus();
      setStatus(s.hasPermission ? "Aktif" : "İzin Gerekli");

      const pending = await NotificationService.getScheduledNotifications();
      setScheduled(pending);
    };
    load();
  }, [prayerTimes]);

  // HATIRLATMA AÇ/KAPAT
  const toggleReminder = async (name: string) => {
    const prayer = prayerTimes?.prayers.find((p) => p.name === name);
    if (!prayer) return;

    const enable = !reminders[name].enabled;

    const permission = await NotificationService.checkPermissions();
    if (!permission) return safeToast(() => toast.error("📢 Bildirim izni gerekli"));

    const newState = { ...reminders };

    if (enable) {
      const res = await NotificationService.schedulePrayerNotification({
        id: prayer.id,
        name,
        time: prayer.time,
        minutesBefore: Number(reminders[name].time)
      });

      if (!res.success) return safeToast(() => toast.error("Kurulamadı"));
      safeToast(() => toast.success(`${name} hatırlatması açıldı`));

      newState[name].enabled = true;
    } else {
      await NotificationService.cancelPrayerNotifications(prayer.id);
      safeToast(() => toast.info(`${name} kapatıldı`));

      newState[name].enabled = false;
    }

    setReminders(newState);
    saveToLocal(newState);

    setScheduled(await NotificationService.getScheduledNotifications());
  };

  // SÜRE DEĞİŞTİRME
  const changeReminderTime = async (name: string, v: string) => {
    const prayer = prayerTimes?.prayers.find((p) => p.name === name);
    if (!prayer) return;

    const newState = { ...reminders };
    newState[name].time = v;
    setReminders(newState);
    saveToLocal(newState);

    if (!newState[name].enabled) return;

    await NotificationService.cancelPrayerNotifications(prayer.id);

    await NotificationService.schedulePrayerNotification({
      id: prayer.id,
      name,
      time: prayer.time,
      minutesBefore: Number(v)
    });

    setScheduled(await NotificationService.getScheduledNotifications());
  };

  // TOPLU AÇ/KAPAT
  const toggleAll = async (val: boolean) => {
    const permission = await NotificationService.checkPermissions();
    if (!permission) return safeToast(() => toast.error("📢 İzin gerekli"));

    const newState = { ...reminders };

    if (val) {
      for (const p of prayerTimes?.prayers || []) {
        const res = await NotificationService.schedulePrayerNotification({
          id: p.id,
          name: p.name,
          time: p.time,
          minutesBefore: Number(newState[p.name].time)
        });
        if (res.success) newState[p.name].enabled = true;
      }
      safeToast(() => toast.success("Tüm hatırlatmalar açıldı"));
    } else {
      await NotificationService.cancelAllNotifications();
      Object.keys(newState).forEach((k) => (newState[k].enabled = false));
      safeToast(() => toast.info("Tüm hatırlatmalar kapatıldı"));
    }

    setReminders(newState);
    saveToLocal(newState);

    setScheduled(await NotificationService.getScheduledNotifications());
  };

  // SIRADAKİ NAMAZ
  const nextPrayer = (() => {
    if (!prayerTimes) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const p of prayerTimes.prayers) {
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > nowMin) return p.name;
    }
    return prayerTimes.prayers[0]?.name;
  })();

  // UI
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900"
    >
      {/* HEADER */}
      <motion.div variants={fadeIn(0, -10)} className="sticky top-0 z-10 p-4 backdrop-blur-md border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">Namaz Vakitleri</h1>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <span>{city}</span>

            <motion.div whileTap={pop.tap} whileHover={pop.hover}>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="px-4 space-y-6 pb-20 pt-6">
        {!user?.isPremium && <AdPlaceholder type="banner" />}

        {/* BİLGİ */}
        <motion.div variants={fadeIn(0.1, 20)}>
          <Card>
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">Vakitler {city} için hesaplanmıştır.</p>
                <p className="text-xs">Hatırlatmalar ezandan önce seçtiğiniz dakikada çalar.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* NAMAZ LİSTESİ */}
        <motion.div variants={staggerContainer} className="space-y-2">
          {!loading &&
            prayerTimes?.prayers.map((p, i) => (
              <motion.div key={p.name} variants={fadeIn(i * 0.1, 20)}>
                <PrayerTimeCard
                  name={p.name}
                  time={p.time}
                  isNext={nextPrayer === p.name}
                  enabled={reminders[p.name].enabled}
                  reminderTime={reminders[p.name].time}
                  onToggle={() => toggleReminder(p.name)}
                  onReminderChange={(v) => changeReminderTime(p.name, v)}
                />
              </motion.div>
            ))}

          {loading &&
            [...Array(6)].map((_, i) => (
              <motion.div key={i} variants={fadeIn(i * 0.05, 20)}>
                <div className="animate-pulse bg-pink-200 dark:bg-purple-700 h-20 rounded-xl" />
              </motion.div>
            ))}
        </motion.div>

        {/* DURUM */}
        <motion.div variants={fadeIn(0.15, 20)}>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">🔔 Bildirim Durumu</p>
                <p className="text-xs">{scheduled.length} aktif hatırlatma</p>
              </div>

              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  status === "Aktif"
                    ? "bg-green-200 text-green-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {status}
              </span>
            </CardContent>
          </Card>
        </motion.div>

        {/* GENEL AYARLAR */}
        <motion.div variants={fadeIn(0.2, 20)}>
          <Card>
            <CardContent className="space-y-4 p-4">
              {/* TOPLU AÇ KAPAT */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Tüm Hatırlatmalar</h3>
                  <p className="text-xs text-gray-500">Tek tuşla yönet</p>
                </div>

                <CustomSwitch
                  checked={Object.values(reminders).every((r) => r.enabled)}
                  onChange={(v) => toggleAll(v)}
                />
              </div>

              {/* TEST */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Test Bildirimi</h3>
                  <p className="text-xs text-gray-500">Ezan sesini kontrol et</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await NotificationService.sendTestNotification();
                      safeToast(() => toast.success("Gönderildi"));
                    } catch {
                      safeToast(() => toast.error("Başarısız"));
                    }
                  }}
                >
                  Ses Testi
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* UYARI */}
        <motion.div variants={fadeIn(0.25, 20)}>
          <Card>
            <CardContent className="p-4 flex gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p>
                • Uygulama tamamen kapalıysa bazı cihazlarda bildirim gelmeyebilir.  
                • Pil tasarrufu bildirimleri engelleyebilir.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {!user?.isPremium && <AdPlaceholder type="banner" />}
      </div>
    </motion.div>
  );
};
