// src/pages/SettingsPage.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import {
  Settings,
  MapPin,
  Bell,
  Sun,
  Moon,
  LocateFixed,
  Loader2,
  Lock,
  Info,
  Calculator,
  AlertCircle,
  RefreshCw
} from "lucide-react";

import { toast } from "sonner";
import { useSettingsStore, getAutoMethodByCountry, type CalculationMethod } from "@/store/settingsStore";
import { useUserStore } from "@/store/userStore";
import { AdPlaceholder } from "@/components/AdPlaceholder";

const COUNTRIES_API = "https://restcountries.com/v3.1/all";

const SettingsPage: React.FC = () => {
  const {
    country,
    city,
    method,
    countries,
    cities,
    setCountry,
    setCity,
    setMethod,
    loadCitiesByCountry,
    setCityAuto
  } = useSettingsStore();

  const { user } = useUserStore();

  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [isLocating, setIsLocating] = useState(false);
  const [localCountries, setLocalCountries] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Hesaplama yöntemleri
  const calculationMethods = [
    { value: "diyanet" as CalculationMethod, label: "Diyanet İşleri (Türkiye)", description: "Türkiye resmi metodu" },
    { value: "mekke" as CalculationMethod, label: "Ümmül Kurra (Suudi Arabistan)", description: "Suudi Arabistan metodu" },
    { value: "mwl" as CalculationMethod, label: "Muslim World League", description: "Avrupa ve uzak doğu" },
    { value: "isna" as CalculationMethod, label: "ISNA (Kuzey Amerika)", description: "Amerika ve Kanada" },
    { value: "egypt" as CalculationMethod, label: "Mısır Genel Kurulu", description: "Mısır, Sudan, Libya" },
    { value: "karachi" as CalculationMethod, label: "Karaçi Üniversitesi", description: "Pakistan, Hindistan, Bangladeş" },
  ];

  // Türkiye için kilitli metod kontrolü
  const isTurkey = country === "Türkiye";
  const lockedMethod = "diyanet";

  // Ülkeleri çek - Daha güvenilir yöntem
  useEffect(() => {
    const loadCountries = async () => {
      setIsLoadingCountries(true);
      try {
        console.log("🌍 Ülkeler yükleniyor...");
        const res = await fetch(COUNTRIES_API);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("✅ API'den gelen ülke sayısı:", data.length);

        let list = data.map((c: any) => {
          // Önce Türkçe çeviriyi dene
          if (c.translations?.tur?.common) {
            return c.translations.tur.common;
          }
          // Sonra İngilizce ismi kullan
          return c.name?.common || "";
        }).filter((name: string) => name.trim().length > 0);

        console.log("🔄 Filtrelenmiş ülke sayısı:", list.length);

        // Türkçe sıralama
        list = list.sort((a: string, b: string) => 
          a.localeCompare(b, "tr")
        );
        
        // Türkiye'yi en başa al
        const turkeyIndex = list.indexOf("Türkiye");
        if (turkeyIndex > -1) {
          list.splice(turkeyIndex, 1);
        }
        list = ["Türkiye", ...list];

        console.log("🎯 Toplam ülke sayısı:", list.length);
        setLocalCountries(list);
        
      } catch (error) {
        console.error("❌ Ülkeler yüklenirken hata:", error);
        // Manuel ülke listesi
        const manualCountries = [
          "Türkiye", "Almanya", "Fransa", "Amerika Birleşik Devletleri", 
          "Birleşik Krallık", "Kanada", "Suudi Arabistan", "Endonezya", 
          "Pakistan", "Hindistan", "Bangladeş", "Mısır", "Nijerya", "İran",
          "İtalya", "İspanya", "Hollanda", "Belçika", "İsveç", "Norveç"
        ];
        setLocalCountries(manualCountries);
        toast.error("Ülkeler yüklenemedi, limitli liste kullanılıyor");
      } finally {
        setIsLoadingCountries(false);
      }
    };
    
    loadCountries();
  }, []);

  // Ülke değiştiğinde şehirleri yükle
  const handleCountryChange = async (newCountry: string) => {
    console.log("🎯 Ülke değişti:", newCountry);
    setCountry(newCountry);
    setIsLoadingCities(true);
    
    try {
      await loadCitiesByCountry(newCountry);
      toast.success(`${newCountry} şehirleri yüklendi`);
    } catch (error) {
      console.error("❌ Şehir yükleme hatası:", error);
      toast.error("Şehirler yüklenirken hata oluştu");
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Şehirleri yeniden yükle
  const handleRefreshCities = async () => {
    if (!country) return;
    
    setIsLoadingCities(true);
    toast.info("Şehirler yeniden yükleniyor...");
    
    try {
      await loadCitiesByCountry(country);
      toast.success("Şehirler güncellendi");
    } catch (error) {
      toast.error("Şehirler yüklenemedi");
    } finally {
      setIsLoadingCities(false);
    }
  };

  // GPS konum
  // SettingsPage.tsx - GPS fonksiyonu güncellenmiş hali
const handleGps = async () => {
  setIsLocating(true);
  const id = toast.loading("Konum alınıyor...");

  try {
    await setCityAuto();
    toast.success("Konum güncellendi", { id });
  } catch (error) {
    console.error("GPS hatası:", error);
    toast.error("Konum alınamadı. Lütfen konum izinlerinizi kontrol edin.", { id });
  } finally {
    setIsLocating(false);
  }
};

  // Tema değiştirme
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    
    toast.success(`Tema ${newTheme === "dark" ? "koyu" : newTheme === "light" ? "açık" : "sistem"} olarak ayarlandı`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-gray-900 dark:via-blue-950 dark:to-cyan-900">

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
            <Settings className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Global namaz vakitleri için konumunuzu seçin
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-6 p-4 pb-32">

        {/* REKLAM */}
        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="w-full" />
        )}

        {/* KONUM AYARLARI */}
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white text-lg">
              <MapPin className="h-5 w-5 text-blue-500" />
              Konum Ayarları
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ÜLKE SEÇİMİ */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ülke</label>
              <Select 
                value={country} 
                onValueChange={handleCountryChange}
                disabled={isLoadingCountries}
              >
                <SelectTrigger className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                  {isLoadingCountries ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Ülkeler yükleniyor...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Ülke seçin" />
                  )}
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[400px] overflow-y-auto z-50"
                  position="popper"
                >
                  {localCountries.map((c) => (
                    <SelectItem 
                      key={c} 
                      value={c} 
                      className="text-base py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {localCountries.length} ülke listeleniyor
                </p>
                {isLoadingCountries && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>
            </div>

            {/* ŞEHİR SEÇİMİ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Şehir</label>
                {country && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshCities}
                    disabled={isLoadingCities}
                    className="h-8 text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingCities ? 'animate-spin' : ''}`} />
                    Yenile
                  </Button>
                )}
              </div>
              
              <Select 
                value={city} 
                onValueChange={setCity}
                disabled={!country || isLoadingCities}
              >
                <SelectTrigger className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                  {isLoadingCities ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Şehirler yükleniyor...</span>
                    </div>
                  ) : (
                    <SelectValue 
                      placeholder={!country ? "Önce ülke seçin" : "Şehir seçin"} 
                    />
                  )}
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[400px] overflow-y-auto z-50"
                  position="popper"
                >
                  {cities.map((c) => (
                    <SelectItem 
                      key={c} 
                      value={c} 
                      className="text-base py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {c}
                    </SelectItem>
                  ))}
                  {cities.length === 0 && !isLoadingCities && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      Şehir bulunamadı
                    </div>
                  )}
                </SelectContent>
              </Select>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {cities.length > 0 ? `${cities.length} şehir bulundu` : 'Şehir seçin'}
                </p>
                {isLoadingCities && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>
            </div>

            {/* GPS BUTTON */}
            <Button
              onClick={handleGps}
              disabled={isLocating}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium text-base shadow-lg"
              size="lg"
            >
              {isLocating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Konum Alınıyor...
                </>
              ) : (
                <>
                  <LocateFixed className="h-5 w-5 mr-2" />
                  Otomatik Konum Bul
                </>
              )}
            </Button>

            {/* UYARI MESAJI */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    📍 Sadece şehir merkezlerinin vakitleri dikkate alınmıştır
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Konumunuza göre 1-3 dakika vakitlerde oynama gösterebilir
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DİĞER AYARLAR... (önceki kısımlar aynen kalacak) */}

      </div>
    </div>
  );
};

export default SettingsPage;