// src/pages/SettingsPage.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Moon,
  Sun,
  MapPin,
  Bell,
  Volume2,
  Smartphone,
  Info,
  LocateFixed,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import {
  useSettingsStore,
  CalculationMethod,
} from "../store/settingsStore";
import { useUserStore } from "../store/userStore";

// --- OPENCAGE API ANAHTARI ---
const OPENCAGE_API_KEY = "b8ee6e29303b4697becad33d98b1562e";

export const SettingsPage: React.FC = () => {
  // Diyanet'i varsayılan ve kilitli yap
  const { city, district, method = "diyanet", setCity, setDistrict, setMethod } = useSettingsStore();
  const { user } = useUserStore();

  const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
    () => {
      const saved = localStorage.getItem("vaktinamaz-settings-v1");
      let initialTheme: "light" | "dark" | "system" = "system";

      if (saved) {
        try {
          const settings = JSON.parse(saved);
          initialTheme = settings.state?.theme || "system";
        } catch (error) {
          console.warn("Failed to parse settings for theme:", error);
        }
      }

      return initialTheme;
    }
  );

  const [isLocating, setIsLocating] = React.useState(false);

  // --- Veri Listeleri ---
  const cities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", 
    "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", 
    "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale",
    "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", 
    "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", 
    "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş",
    "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale",
    "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
    "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye",
    "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak",
    "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat",
    "Zonguldak"
  ];

  const calculationMethods = [
    { value: "diyanet", label: "Diyanet İşleri (Türkiye)" },
    { value: "mwl", label: "Muslim World League" },
    { value: "isna", label: "Islamic Society of North America" },
    { value: "egypt", label: "Egyptian General Authority" },
    { value: "mekke", label: "Umm Al-Qura University, Makkah" },
    { value: "karachi", label: "University of Islamic Sciences, Karachi" },
  ];

  // --- Tema Fonksiyonu ---
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);

    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.add("light");
    } else {
      const isDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.add(isDark ? "dark" : "light");
    }
  };

  // --- GÜNCELLENMİŞ GPS Konum (OpenCage) ---
  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Cihazınız konum servislerini desteklemiyor.");
      return;
    }

    setIsLocating(true);
    const id = toast.loading("Konumunuz tespit ediliyor...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const openCageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}&language=tr`;

          const response = await fetch(openCageUrl);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const components = data.results[0].components;

            const foundCity = components.state || components.province || components.city;
            const foundDistrict = components.county || components.city_district || components.suburb;

            if (foundCity) {
              setCity(foundCity);
              setDistrict(foundDistrict || "");
              
              toast.success(
                `Konumunuz: ${foundDistrict ? `${foundDistrict}, ` : ''}${foundCity} olarak ayarlandı.`,
                { id, duration: 3000 }
              );
            } else {
              throw new Error("API'den şehir bilgisi alınamadı.");
            }
          } else {
            throw new Error("Konum API'si geçerli bir sonuç döndürmedi.");
          }
        } catch (error) {
          console.error("Geocoding Hatası:", error);
          toast.error("Konumunuz belirlenemedi. Lütfen elle seçin.", {
            id,
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Konum İzni Hatası:", error);
        setIsLocating(false);

        let errorMessage = "Konum erişimi reddedildi.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Konum erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Konum bilgisi alınamıyor.";
            break;
          case error.TIMEOUT:
            errorMessage = "Konum alma işlemi zaman aşımına uğradı.";
            break;
        }

        toast.error(errorMessage, { id });
      }
    );
  };

  // Konum bilgisini formatla
  const getLocationDisplay = () => {
    if (district && city) {
      return `${district}, ${city}`;
    }
    return city || "Konum seçilmedi";
  };

  // Diyanet metodunu kilitli yap
  const isDiyanetLocked = true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-100 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 no-horizontal-scroll">
      {/* HEADER */}
      <div className="sticky top-0 z-20 border-b border-sky-200/70 dark:border-slate-800/80 bg-sky-50/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-full items-center justify-between px-4 py-3 w-full">
          <div className="flex items-center gap-3 w-full">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white shadow-sm">
              <Settings className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Ayarlar
              </h1>
              <p className="text-xs text-slate-600/80 dark:text-slate-400">
                Konum, görünüm ve bildirim tercihlerinizi yönetin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto flex max-w-full flex-col gap-6 px-4 pb-28 pt-6 w-full overflow-x-hidden">
        {/* KONUM AYARLARI */}
        <Card className="overflow-hidden rounded-2xl border border-sky-200/70 bg-sky-50/90 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 w-full">
          <CardHeader className="border-b border-sky-100/80 pb-3 dark:border-slate-800/80">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <MapPin className="h-4 w-4" />
              </span>
              Konum Ayarları
            </CardTitle>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Namaz vakitlerinin doğru hesaplanması için bulunduğun şehri seç.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4 w-full">
            {/* SADECE ŞEHİR SEÇİMİ */}
            <div className="space-y-1.5 w-full">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Şehir
              </label>
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value);
                  setDistrict(""); // Şehir değişince ilçeyi temizle
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border border-sky-200/80 bg-sky-100/80 px-3 text-sm text-slate-800 shadow-sm hover:bg-sky-100 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-50 dark:hover:bg-slate-800/80">
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl border border-sky-200/80 bg-sky-50/95 text-sm shadow-lg dark:border-slate-700/80 dark:bg-slate-900/95 w-full">
                  {cities.map((c) => (
                    <SelectItem key={c} value={c} className="w-full">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KONUMU OTOMATİK BUL */}
            <div className="flex flex-col gap-3 rounded-2xl bg-sky-100/90 p-3.5 text-xs text-sky-800 dark:bg-sky-500/10 dark:text-sky-200 md:flex-row md:items-center md:justify-between w-full">
              <div className="flex-1">
                <p className="font-medium">
                  Konumdan otomatik seç{" "}
                  <span className="text-[10px] font-normal text-sky-600/80 dark:text-sky-300/80">
                    (GPS)
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-sky-700/90 dark:text-sky-200/80">
                  Şehir ve ilçeyi otomatik belirlemek için cihaz konumunu kullan.
                </p>
                {district && (
                  <p className="mt-1 text-[10px] text-sky-600">
                    📍 {getLocationDisplay()}
                  </p>
                )}
              </div>
              <Button
                onClick={handleGpsLocation}
                disabled={isLocating}
                variant="outline"
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full border-sky-300 bg-sky-50/90 text-xs font-medium text-sky-800 shadow-sm hover:bg-sky-100 dark:border-sky-500/60 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-slate-800 md:mt-0 md:w-auto md:px-4"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Konum alınıyor...
                  </>
                ) : (
                  <>
                    <LocateFixed className="h-4 w-4" />
                    Konumu kullan
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* HESAPLAMA YÖNTEMİ - KİLİTLİ */}
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Hesaplama yöntemi
                  </label>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Farklı kuruluşların namaz vakti hesaplama metodları
                  </p>
                </div>
                {isDiyanetLocked && (
                  <div className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                    <Lock className="h-3 w-3" />
                    <span>Kilitli</span>
                  </div>
                )}
              </div>

              {/* Kilitli Select Box */}
              <div className="relative w-full">
                <Select
                  value={method}
                  onValueChange={(value) => {
                    if (!isDiyanetLocked) {
                      setMethod(value as CalculationMethod);
                    }
                  }}
                  disabled={isDiyanetLocked}
                >
                  <SelectTrigger className={`mt-1 h-11 w-full rounded-xl border border-sky-200/80 bg-sky-100/80 px-3 text-sm text-slate-800 shadow-sm hover:bg-sky-100 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-50 dark:hover:bg-slate-800/80 ${
                    isDiyanetLocked ? 'opacity-70 cursor-not-allowed' : ''
                  }`}>
                    <SelectValue placeholder="Hesaplama yöntemi seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 rounded-xl border border-sky-200/80 bg-sky-50/95 text-sm shadow-lg dark:border-slate-700/80 dark:bg-slate-900/95 w-full">
                    {calculationMethods.map((m) => (
                      <SelectItem 
                        key={m.value} 
                        value={m.value}
                        className={`w-full ${m.value === "diyanet" ? "bg-sky-100 dark:bg-sky-900/50 font-semibold" : ""}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{m.label}</span>
                          {m.value === "diyanet" && (
                            <Lock className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Kilitli olduğunu gösteren overlay */}
                {isDiyanetLocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] w-full">
                    <div className="flex items-center gap-2 bg-sky-100 dark:bg-sky-900/80 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-700">
                      <Lock className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                      <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                        Sadece Diyanet İşleri kullanılabilir
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Açıklama metni */}
              {isDiyanetLocked && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 w-full">
                  <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-sky-700 dark:text-sky-300 flex-1">
                    <p className="font-medium">Türkiye için optimize edilmiştir</p>
                    <p className="mt-1">Namaz vakitleri Diyanet İşleri Başkanlığı'nın resmi hesaplama yöntemine göre belirlenmektedir. Bu ayar değiştirilemez.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TEMA AYARLARI */}
        <Card className="overflow-hidden rounded-2xl border border-sky-200/70 bg-sky-50/90 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 w-full">
          <CardHeader className="border-b border-sky-100/80 pb-3 dark:border-slate-800/80">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </span>
              Görünüm Ayarları
            </CardTitle>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Uygulamanın görünümünü kişiselleştirin.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4 w-full">
            <div className="space-y-2 w-full">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Tema Seçimi
              </label>
              <Select
                value={theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => handleThemeChange(value)}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border border-sky-200/80 bg-sky-100/80 px-3 text-sm text-slate-800 shadow-sm hover:bg-sky-100 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-50 dark:hover:bg-slate-800/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-sky-200/80 bg-sky-50/95 text-sm shadow-lg dark:border-slate-700/80 dark:bg-slate-900/95 w-full">
                  <SelectItem value="light" className="w-full">🌞 Açık Tema</SelectItem>
                  <SelectItem value="dark" className="w-full">🌙 Koyu Tema</SelectItem>
                  <SelectItem value="system" className="w-full">📱 Sistem Ayarı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Koyu Tema</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Gece kullanımı için göz dostu tema
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => handleThemeChange(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* BİLDİRİM AYARLARI */}
        <Card className="overflow-hidden rounded-2xl border border-sky-200/70 bg-sky-50/90 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 w-full">
          <CardHeader className="border-b border-sky-100/80 pb-3 dark:border-slate-800/80">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <Bell className="h-4 w-4" />
              </span>
              Bildirim Ayarları
            </CardTitle>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Namaz vakitleri ve diğer bildirim tercihlerinizi yönetin.
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Namaz Vakti Bildirimleri
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Namaz vakitleri için bildirim al
                </p>
              </div>
              <Switch defaultChecked={true} />
            </div>

            <Separator />

            <div className="flex items-center justify-between w-full">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Ses Bildirimleri
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Bildirimler için ses çal
                </p>
              </div>
              <Switch defaultChecked={true} />
            </div>
          </CardContent>
        </Card>

        {/* UYGULAMA BİLGİLERİ */}
        <Card className="rounded-2xl border border-sky-200/70 bg-sky-50/90 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 w-full">
          <CardHeader className="border-b border-sky-100/80 pb-3 dark:border-slate-800/80">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sky-700 dark:bg-sky-400/25 dark:text-sky-300">
                <Info className="h-4 w-4" />
              </span>
              Uygulama Bilgileri
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 pt-4 text-sm w-full">
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 dark:text-slate-400">Sürüm</span>
              <span className="font-medium text-sky-800 dark:text-sky-300">1.0.0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 dark:text-slate-400">Geliştirici</span>
              <span className="font-medium text-sky-800 dark:text-sky-300">MGX Team</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 dark:text-slate-400">Son Güncelleme</span>
              <span className="font-medium text-sky-800 dark:text-sky-300">13 Kasım 2024</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 dark:text-slate-400">Seçili konum</span>
              <span className="font-medium text-sky-800 dark:text-sky-300 text-right max-w-[150px] truncate">
                {getLocationDisplay()}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 dark:text-slate-400">Hesaplama Yöntemi</span>
              <span className="font-medium text-sky-800 dark:text-sky-300 text-right max-w-[150px] truncate">
                {calculationMethods.find(m => m.value === method)?.label || method}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 dark:text-slate-400">Aktif Tema</span>
              <span className="font-medium text-purple-600 dark:text-purple-300">
                {theme === 'light' ? '🌞 Açık' : theme === 'dark' ? '🌙 Koyu' : '📱 Sistem'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ACTION BUTTONS */}
        <div className="space-y-3 w-full">
          <Button
            variant="outline"
            className="w-full rounded-full border-rose-200 bg-rose-100/80 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-200/80 dark:border-rose-500/50 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/60"
            onClick={() => {
              setCity("İstanbul");
              setDistrict("");
              // Method'u sıfırlama - sadece Diyanet kalacak
              handleThemeChange("system");
              toast.info("Ayarlar varsayılan değerlere sıfırlandı.");
            }}
          >
            Varsayılan ayarlara dön
          </Button>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
};

export default SettingsPage;