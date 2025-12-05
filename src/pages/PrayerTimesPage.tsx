// src/pages/PrayerTimesPage.tsx

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Clock,
  Bell,
  MapPin,
  RefreshCw,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrayerTimeCard } from "../components/PrayerTimeCard";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { usePrayerStore } from "../store/prayerStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUserStore } from "@/store/userStore";
import { PrayerTimesService } from "../services/prayerTimesService";
import { NotificationService } from "../services/notificationsService";
import { toast } from "sonner";

/* ======================================================
   ANA SAYFA BAŞLANGICI
====================================================== */
export const PrayerTimesPage: React.FC = () => {
  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city } = useSettingsStore();
  const { user } = useUserStore();

  /* ======================================================
     STATE
  ====================================================== */
  const [reminderSettings, setReminderSettings] = useState<
    Record<string, { enabled: boolean; reminderTime: string }>
  >({
    İmsak: { enabled: false, reminderTime: "10" },
    Güneş: { enabled: false, reminderTime: "10" },
    Öğle: { enabled: false, reminderTime: "10" },
    İkindi: { enabled: false, reminderTime: "10" },
    Akşam: { enabled: false, reminderTime: "10" },
    Yatsı: { enabled: false, reminderTime: "10" },
  });

  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [notificationStatus, setNotificationStatus] = useState("Bekleniyor...");

  /* ======================================================
     1) NAMAZ VAKİTLERİNİ YÜKLE
  ====================================================== */
  useEffect(() => {
    const loadTimes = async () => {
      try {
        const times = await PrayerTimesService.getPrayerTimes(city || "İstanbul");
        setPrayerTimes(times);
      } catch {
        toast.error("Namaz vakitleri yüklenemedi");
      }
    };
    loadTimes();
  }, [city]);

  /* ======================================================
     2) BİLDİRİM DURUMU + PLANLANMIŞLAR
  ====================================================== */
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await NotificationService.getNotificationStatus();
        setNotificationStatus(status.hasPermission ? "Aktif" : "İzin Gerekli");

        const scheduled = await NotificationService.getScheduledNotifications();
        setScheduledNotifications(scheduled);

        if (prayerTimes) {
          const updated = { ...reminderSettings };

          prayerTimes.prayers.forEach((p) => {
            updated[p.name].enabled = scheduled.some(
              (notif) =>
                notif.extra?.prayerId === p.id ||
                notif.extra?.prayerName === p.name
            );
          });

          setReminderSettings(updated);
        }
      } catch {
        setNotificationStatus("Kontrol edilemedi");
      }
    };

    checkStatus();
  }, [prayerTimes]);

  /* ======================================================
     3) TEK BİR NAMAZ BİLDİRİMİNİ AÇ/KAPAT
  ====================================================== */
  const handleToggleReminder = async (prayerName: string) => {
    const prayer = prayerTimes?.prayers.find((p) => p.name === prayerName);
    if (!prayer) return;

    const newEnabled = !reminderSettings[prayerName].enabled;

    const permission = await NotificationService.checkPermissions();
    if (!permission) {
      toast.error("📢 Bildirim izni gerekli. Ayarlardan izin vermeniz gerekiyor.");
      return;
    }

    try {
      // Açılıyorsa schedule
      if (newEnabled) {
        const result = await NotificationService.schedulePrayerNotification({
          id: prayer.id,
          name: prayer.name,
          time: prayer.time,
          minutesBefore: Number(reminderSettings[prayerName].reminderTime),
        });

        if (!result.success) {
          toast.error("Hatırlatma kurulamadı");
          return;
        }

        toast.success(
          reminderSettings[prayerName].reminderTime === "0"
            ? `${prayerName} vakti geldğinde hatırlatılacak`
            : `${prayerName} hatırlatması ayarlandı`
        );
      } else {
        await NotificationService.cancelPrayerNotifications(prayer.id);
        toast.info(`${prayerName} hatırlatması kapatıldı`);
      }

      // UI güncelle
      setReminderSettings((prev) => ({
        ...prev,
        [prayerName]: { ...prev[prayerName], enabled: newEnabled },
      }));

      const scheduled = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
    } catch (err) {
      toast.error("Bildirim ayarlanamadı");
    }
  };

  /* ======================================================
     4) HATIRLATMA SÜRESİNİ DEĞİŞTİR
  ====================================================== */
  const handleReminderTimeChange = async (prayerName: string, value: string) => {
    const prayer = prayerTimes?.prayers.find((p) => p.name === prayerName);
    if (!prayer) return;

    const wasEnabled = reminderSettings[prayerName].enabled;

    setReminderSettings((p) => ({
      ...p,
      [prayerName]: { ...p[prayerName], reminderTime: value },
    }));

    // Eğer açık ise tekrar schedule et
    if (wasEnabled) {
      await NotificationService.cancelPrayerNotifications(prayer.id);

      const res = await NotificationService.schedulePrayerNotification({
        id: prayer.id,
        name: prayer.name,
        time: prayer.time,
        minutesBefore: Number(value),
      });

      if (res.success) {
        toast.success(`${prayerName} hatırlatma süresi güncellendi`);
      } else {
        toast.error("Güncellenemedi");
      }

      const scheduled = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
    }
  };

  /* ======================================================
     5) TÜM BİLDİRİMLERİ AÇ/KAPAT
  ====================================================== */
  const handleToggleAllReminders = async (checked: boolean) => {
    const permission = await NotificationService.checkPermissions();
    if (!permission) {
      toast.error("📢 Bildirim izni gerekli");
      return;
    }

    const updated = { ...reminderSettings };

    if (checked) {
      // Hepsini aç
      for (const prayer of prayerTimes?.prayers || []) {
        const result = await NotificationService.schedulePrayerNotification({
          id: prayer.id,
          name: prayer.name,
          time: prayer.time,
          minutesBefore: Number(updated[prayer.name].reminderTime),
        });

        if (result.success) {
          updated[prayer.name].enabled = true;
        }
      }

      toast.success("Tüm hatırlatmalar açıldı");
    } else {
      await NotificationService.cancelAllNotifications();
      Object.keys(updated).forEach((name) => (updated[name].enabled = false));
      toast.info("Tüm hatırlatmalar kapatıldı");
    }

    setReminderSettings(updated);

    const scheduled = await NotificationService.getScheduledNotifications();
    setScheduledNotifications(scheduled);
  };

  /* ======================================================
     SONRAKİ NAMAZ
  ====================================================== */
  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const p of prayerTimes.prayers) {
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > nowMin) return p.name;
    }

    return prayerTimes.prayers[0]?.name || null;
  };

  const nextPrayer = getNextPrayer();

  /* ======================================================
     UI
  ====================================================== */
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

      {/* CONTENT */}
      <div className="px-4 space-y-6 pb-20 pt-6">
        
        {!user?.isPremium && <AdPlaceholder type="banner" />}

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
            : prayerTimes?.prayers.map((p) => (
                <PrayerTimeCard
                  key={p.name}
                  name={p.name}
                  time={p.time}
                  isNext={p.name === nextPrayer}
                  enabled={reminderSettings[p.name].enabled}
                  onToggle={() => handleToggleReminder(p.name)}
                  reminderTime={reminderSettings[p.name].reminderTime}
                  onReminderChange={(v) => handleReminderTimeChange(p.name, v)}
                />
              ))}
        </div>

        {/* BİLDİRİM DURUMU */}
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">🔔 Bildirim Durumu</p>
              <p className="text-xs text-gray-600">
                {scheduledNotifications.length > 0
                  ? `${scheduledNotifications.length} aktif hatırlatma`
                  : "Aktif hatırlatma yok"}
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                notificationStatus === "Aktif"
                  ? "bg-green-200 text-green-800"
                  : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {notificationStatus}
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

            {/* Tümünü aç/kapat */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Tüm Hatırlatmaları Aç/Kapat</h3>
                <p className="text-xs text-gray-600">
                  Tüm vakitler için hatırlatmayı yönet
                </p>
              </div>
              <Switch
                checked={Object.values(reminderSettings).every((x) => x.enabled)}
                onCheckedChange={handleToggleAllReminders}
              />
            </div>

            {/* Test bildirimi */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Test Bildirimi</h3>
                <p className="text-xs text-gray-600">
                  Bildirim sistemini test et
                </p>
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
              • Bildirimler her gün otomatik yenilenir
            </p>
          </CardContent>
        </Card>

        {!user?.isPremium && <AdPlaceholder type="banner" />}
      </div>
    </div>
  );
};
