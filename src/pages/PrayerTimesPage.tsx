// src/pages/PrayerTimesPage.tsx

import React, { useEffect, useState } from "react";
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

  const [reminders, setReminders] = useState<Record<string, { enabled: boolean; time: string }>>({
    İmsak: { enabled: false, time: "10" },
    Güneş: { enabled: false, time: "10" },
    Öğle: { enabled: false, time: "10" },
    İkindi: { enabled: false, time: "10" },
    Akşam: { enabled: false, time: "10" },
    Yatsı: { enabled: false, time: "10" },
  });

  const [scheduled, setScheduled] = useState<any[]>([]);
  const [status, setStatus] = useState("Bekleniyor...");


  // NAMAZ VAKİTLERİNİ YÜKLE
  useEffect(() => {
    const load = async () => {
      try {
        const res = await PrayerTimesService.getPrayerTimes(city || "İstanbul");
        setPrayerTimes(res);
      } catch {
        toast.error("Vakitler yüklenemedi");
      }
    };
    load();
  }, [city]);


  // PLANLANMIŞ BİLDİRİMLERİ KONTROL
  useEffect(() => {
    const check = async () => {
      const s = await NotificationService.getNotificationStatus();
      setStatus(s.hasPermission ? "Aktif" : "İzin Gerekli");

      const pending = await NotificationService.getScheduledNotifications();
      setScheduled(pending);

      if (!prayerTimes) return;

      const updated = { ...reminders };
      prayerTimes.prayers.forEach((p: any) => {
        updated[p.name].enabled = pending.some((n) => n.extra?.prayerId === p.id);
      });

      setReminders(updated);
    };
    check();
  }, [prayerTimes]);


  // TEK BİR BİLDİRİM AÇ/KAPAT
  const toggleReminder = async (name: string) => {
    const prayer = prayerTimes?.prayers.find((x: any) => x.name === name);
    if (!prayer) return;

    const enable = !reminders[name].enabled;
    const permission = await NotificationService.checkPermissions();

    if (!permission) return toast.error("📢 Bildirim izni gerekli");

    if (enable) {
      const res = await NotificationService.schedulePrayerNotification({
        id: prayer.id,
        name: prayer.name,
        time: prayer.time,
        minutesBefore: Number(reminders[name].time),
      });

      if (res.success) {
        toast.success(`${name} hatırlatması açıldı`);
      } else {
        return toast.error("Kurulamadı");
      }
    } else {
      await NotificationService.cancelPrayerNotifications(prayer.id);
      toast.info(`${name} hatırlatması kapatıldı`);
    }

    // UI
    setReminders((p) => ({ ...p, [name]: { ...p[name], enabled: enable } }));
    setScheduled(await NotificationService.getScheduledNotifications());
  };


  // SÜRE DEĞİŞTİR
  const changeReminderTime = async (name: string, v: string) => {
    const p = prayerTimes?.prayers.find((x: any) => x.name === name);
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
      ? toast.success(`${name} süresi ${v} dakika olarak güncellendi`)
      : toast.error("Güncellenemedi");
  };


  // HEPSİNİ AÇ/KAPAT
  const toggleAll = async (on: boolean) => {
    const permission = await NotificationService.checkPermissions();
    if (!permission) return toast.error("İzin gerekli");

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
      toast.success("Tüm hatırlatmalar açıldı");
    } else {
      await NotificationService.cancelAllNotifications();
      Object.keys(updated).forEach((k) => (updated[k].enabled = false));
      toast.info("Tüm hatırlatmalar kapatıldı");
    }

    setReminders(updated);
    setScheduled(await NotificationService.getScheduledNotifications());
  };


  // SONRAKİ NAMAZ
  const nextPrayer = (() => {
    if (!prayerTimes) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const p of prayerTimes.prayers) {
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > nowMin) return p.name;
    }
    return prayerTimes.prayers[0].name;
  })();


  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">

      {/* HEADER */}
      <div className="sticky top-0 z-10 backdrop-blur-md border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-light text-pink-800">Namaz Vakitleri</h1>
          </div>

          <div className="flex items-center space-x-3">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>{city}</span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


      {/* CONTENT */}
      <div className="px-4 space-y-6 pb-20 pt-6">

        {!user?.isPremium && <AdPlaceholder type="banner" />}

        {/* BİLGİ */}
        <Card>
          <CardContent className="p-4 flex space-x-3">
            <Info className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">{city} için vakitler</p>
              <p className="text-xs text-amber-600">
                Bildirimler ezan vaktinden önce seçtiğiniz dakikada çalar.
              </p>
            </div>
          </CardContent>
        </Card>


        {/* NAMAZ KARTLARI */}
        <div className="space-y-2">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-pink-200 h-20 rounded-xl" />
              ))
            : prayerTimes?.prayers.map((p: any) => (
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
              <p className="text-sm font-medium">🔔 Bildirim Durumu</p>
              <p className="text-xs text-gray-600">
                {scheduled.length > 0
                  ? `${scheduled.length} aktif hatırlatma`
                  : "Aktif hatırlatma yok"}
              </p>
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


        {/* GENEL AYARLAR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <span>Genel Ayarlar</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Tümü */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Tüm Hatırlatmaları Aç/Kapat</h3>
                <p className="text-xs text-gray-600">Tüm vakitler için yönet</p>
              </div>
              <Switch
                checked={Object.values(reminders).every((r) => r.enabled)}
                onCheckedChange={toggleAll}
              />
            </div>

            {/* Test */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Test Bildirimi</h3>
                <p className="text-xs text-gray-600">Ezan sesi testi</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await NotificationService.sendTestNotification();
                    toast.success("Test bildirimi gönderildi");
                  } catch {
                    toast.error("Gönderilemedi");
                  }
                }}
              >
                Ses Testi
              </Button>
            </div>

          </CardContent>
        </Card>


        {/* UYARI */}
        <Card>
          <CardContent className="p-4 flex space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-xs text-red-700">
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
