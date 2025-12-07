// src/pages/PrayerTimesPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Clock, Bell, MapPin, RefreshCw, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PrayerTimeCard } from "../components/PrayerTimeCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";

import { usePrayerStore } from "../store/prayerStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUserStore } from "@/store/userStore";

import { PrayerTimesService } from "../services/prayerTimesService";
import { NotificationService } from "../services/notificationsService";
import { toast } from "sonner";

export const PrayerTimesPage: React.FC = () => {
  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city } = useSettingsStore();
  const { user } = useUserStore();

  // ===========================================================
  // 🔐 SAFE TOAST → Çift toast çıkmasını %100 engeller
  // ===========================================================
  const toastLock = useRef(false);

  const safeToast = (fn: () => void) => {
    if (toastLock.current) return;
    toastLock.current = true;

    fn();

    setTimeout(() => {
      toastLock.current = false;
    }, 300);
  };

  // ===========================================================
  // STATE
  // ===========================================================
  const [reminders, setReminders] = useState<
    Record<string, { enabled: boolean; time: string }>
  >({
    İmsak: { enabled: false, time: "10" },
    Güneş: { enabled: false, time: "10" },
    Öğle: { enabled: false, time: "10" },
    İkindi: { enabled: false, time: "10" },
    Akşam: { enabled: false, time: "10" },
    Yatsı: { enabled: false, time: "10" },
  });

  const [scheduled, setScheduled] = useState<any[]>([]);
  const [status, setStatus] = useState("Bekleniyor...");

  // ===========================================================
  // NAMAZ VAKİTLERİNİ YÜKLE
  // ===========================================================
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

  // ===========================================================
  // PLANLANMIŞ BİLDİRİMLERİ ÇEK
  // ===========================================================
  useEffect(() => {
    const check = async () => {
      const s = await NotificationService.getNotificationStatus();
      setStatus(s.hasPermission ? "Aktif" : "İzin Gerekli");

      const pending = await NotificationService.getScheduledNotifications();
      setScheduled(pending);

      if (!prayerTimes) return;

      const updated = { ...reminders };
      prayerTimes.prayers.forEach((p) => {
        updated[p.name].enabled = pending.some((n) => n.extra?.prayerId === p.id);
      });

      setReminders(updated);
    };

    check();
  }, [prayerTimes]);

  // ===========================================================
  // TEK BİR HATIRLATMAYI AÇ/KAPAT
  // ===========================================================
  const toggleReminder = async (name: string) => {
    const prayer = prayerTimes?.prayers.find((x) => x.name === name);
    if (!prayer) return;

    const enable = !reminders[name].enabled;

    const permission = await NotificationService.checkPermissions();
    if (!permission)
      return safeToast(() => toast.error("📢 Bildirim izni gerekli"));

    if (enable) {
      const res = await NotificationService.schedulePrayerNotification({
        id: prayer.id,
        name: prayer.name,
        time: prayer.time,
        minutesBefore: Number(reminders[name].time),
      });

      if (!res.success) {
        return safeToast(() => toast.error("Kurulamadı"));
      }

      safeToast(() => toast.success(`${name} hatırlatması açıldı`));
    } else {
      await NotificationService.cancelPrayerNotifications(prayer.id);
      safeToast(() => toast.info(`${name} hatırlatması kapatıldı`));
    }

    setReminders((p) => ({ ...p, [name]: { ...p[name], enabled: enable } }));
    setScheduled(await NotificationService.getScheduledNotifications());
  };

  // ===========================================================
  // HATIRLATMA SÜRESİ DEĞİŞTİ
  // ===========================================================
  const changeReminderTime = async (name: string, v: string) => {
    const p = prayerTimes?.prayers.find((x) => x.name === name);
    if (!p) return;

    const wasEnabled = reminders[name].enabled;
    setReminders((r) => ({ ...r, [name]: { ...r[name], time: v } }));

    if (!wasEnabled) return;

    await NotificationService.cancelPrayerNotifications(p.id);

    const res = await NotificationService.schedulePrayerNotification({
      id: p.id,
      name: p.name,
      time: p.time,
      minutesBefore: Number(v),
    });

    setScheduled(await NotificationService.getScheduledNotifications());

    res.success
      ? safeToast(() => toast.success(`${name} ${v} dk önce çalacak`))
      : safeToast(() => toast.error("Güncellenemedi"));
  };

  // ===========================================================
  // TÜM BİLDİRİMLERİ AÇ/KAPAT
  // ===========================================================
  const toggleAll = async (on: boolean) => {
    const permission = await NotificationService.checkPermissions();
    if (!permission) return safeToast(() => toast.error("İzin gerekli"));

    const updated = { ...reminders };

    if (on) {
      for (const p of prayerTimes?.prayers || []) {
        const res = await NotificationService.schedulePrayerNotification({
          id: p.id,
          name: p.name,
          time: p.time,
          minutesBefore: Number(updated[p.name].time),
        });

        if (res.success) updated[p.name].enabled = true;
      }
      safeToast(() => toast.success("Tüm hatırlatmalar açıldı"));
    } else {
      await NotificationService.cancelAllNotifications();
      Object.keys(updated).forEach((k) => (updated[k].enabled = false));
      safeToast(() => toast.info("Tüm hatırlatmalar kapatıldı"));
    }

    setReminders(updated);
    setScheduled(await NotificationService.getScheduledNotifications());
  };

  // ===========================================================
  // SONRAKİ NAMAZ
  // ===========================================================
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

  // ===========================================================
  // UI BAŞLANGIÇ
  // ===========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 
      dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">

      {/* HEADER */}
      <div className="sticky top-0 z-10 backdrop-blur-md border-b p-4">
        <div className="flex justify-between items-center">

          {/* SOL TARAF */}
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            <h1 className="text-2xl font-light text-pink-800 dark:text-purple-100">
              Namaz Vakitleri
            </h1>
          </div>

          {/* SAĞ TARAF */}
          <div className="flex items-center space-x-3">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <span className="dark:text-purple-100">{city}</span>

            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 space-y-6 pb-20 pt-6">

        {!user?.isPremium && <AdPlaceholder type="banner" />}

        {/* BİLGİ KARTI */}
        <Card>
          <CardContent className="p-4 flex space-x-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">{city} için vakitler</p>
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Bildirimler ezan vaktinden önce seçtiğiniz dakikada çalar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NAMAZ LİSTESİ */}
        <div className="space-y-2">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-pink-200 dark:bg-purple-700 h-20 rounded-xl" />
              ))
            : prayerTimes?.prayers.map((p) => (
                <PrayerTimeCard
                  key={p.name}
                  name={p.name}
                  time={p.time}
                  isNext={p.name === nextPrayer}
                  enabled={reminders[p.name].enabled}
                  reminderTime={reminders[p.name].time}
                  onToggle={() => toggleReminder(p.name)}
                  onReminderChange={(v) => changeReminderTime(p.name, v)}
                />
              ))}
        </div>

        {/* BİLDİRİM DURUMU */}
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium dark:text-purple-100">🔔 Bildirim Durumu</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {scheduled.length > 0
                  ? `${scheduled.length} aktif hatırlatma`
                  : "Aktif hatırlatma yok"}
              </p>
            </div>

            <span className={`px-2 py-1 text-xs rounded-full
              ${
                status === "Aktif"
                  ? "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200"
                  : "bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100"
              }`}
            >
              {status}
            </span>
          </CardContent>
        </Card>

        {/* GENEL AYARLAR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-purple-100">
              <Bell className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              <span>Genel Ayarlar</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Toplu aç/kapat */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium dark:text-purple-100">Tüm Hatırlatmaları Aç/Kapat</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Tüm vakitler için yönet</p>
              </div>

              <Switch
                checked={Object.values(reminders).every((r) => r.enabled)}
                onCheckedChange={toggleAll}
              />
            </div>

            {/* Test bildirimi */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium dark:text-purple-100">Test Bildirimi</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ezan sesi testi</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await NotificationService.sendTestNotification();
                    safeToast(() => toast.success("Test bildirimi gönderildi"));
                  } catch {
                    safeToast(() => toast.error("Gönderilemedi"));
                  }
                }}
              >
                Ses Testi
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* ALT UYARI */}
        <Card>
          <CardContent className="p-4 flex space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-700 dark:text-red-300">
              • Uygulama tamamen kapatılırsa bildirimler çalışmayabilir <br />
              • Pil tasarrufu modu bildirimleri engelleyebilir <br />
              • Hatırlatmalar her gün otomatik yenilenir
            </p>
          </CardContent>
        </Card>

        {!user?.isPremium && <AdPlaceholder type="banner" />}

      </div>
    </div>
  );
};
