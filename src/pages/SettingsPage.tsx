// src/pages/SettingsPage.tsx
import React, { useState } from "react";
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
  Info,
  Calculator,
  AlertCircle
} from "lucide-react";

import { toast } from "sonner";
import { useSettingsStore, type CalculationMethod } from "@/store/settingsStore";
import { useUserStore } from "@/store/userStore";
import { AdPlaceholder } from "@/components/AdPlaceholder";

// --- TÜRKİYE 81 ŞEHİR ---
const TURKEY_CITIES = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya",
  "Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik",
  "Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli",
  "Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep",
  "Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir",
  "Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kırıkkale",
  "Kırklareli","Kırşehir","Kilis","Kocaeli","Konya","Kütahya","Malatya","Manisa",
  "Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize",
  "Sakarya","Samsun","Siirt","Sinop","Sivas","Şanlıurfa","Şırnak","Tekirdağ",
  "Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"
];

const SettingsPage: React.FC = () => {
  const {
  city,
  setCity,
  setCityAuto
} = useSettingsStore();


  const { user } = useUserStore();

  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [isLocating, setIsLocating] = useState(false);

  // Tema değiştirme
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else if (newTheme === "light") document.documentElement.classList.remove("dark");
    else {
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? document.documentElement.classList.add("dark")
        : document.documentElement.classList.remove("dark");
    }
  };

  // GPS şehri bul
  const handleGps = async () => {
    setIsLocating(true);
    const id = toast.loading("Konum alınıyor...");

    try {
      await setCityAuto(); // sadece şehir set edilecek
      toast.success("Konum güncellendi", { id });
    } catch (error) {
      toast.error("Konum alınamadı", { id });
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90 dark:from-purple-900/90 dark:via-blue-900/90 dark:to-cyan-900/90 backdrop-blur-md border-b border-pink-200/50 dark:border-purple-500/30 p-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">
            Ayarlar
          </h1>
          <p className="text-pink-600 dark:text-purple-400 font-light">
            Namaz vakitleri için şehrinizi seçin
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="pb-20 px-4 space-y-6 pt-6 w-full max-w-full overflow-x-hidden">

        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        )}

        {/* KONUM AYARLARI */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <span>Şehir Seçimi</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* ŞEHİR */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-pink-700 dark:text-purple-300">Şehir</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full h-12 rounded-xl border-2 border-pink-300 dark:border-purple-600 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px] overflow-y-auto">
                  {TURKEY_CITIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-base py-3">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* GPS */}
            <Button
              onClick={handleGps}
              disabled={isLocating}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 via-orange-500 to-blue-500 text-white shadow-lg"
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

            {/* UYARI */}
            <div className="p-3 rounded-lg bg-amber-100/70 border border-amber-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-800 font-medium">
                    📍 Sadece şehir merkezleri baz alınır.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Konuma göre 1–3 dakika farklılık olabilir.
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* TEMA AYARLARI */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <Sun className="h-5 w-5 text-yellow-600" />
              <span>Tema Ayarları</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full h-12 rounded-xl border-2 border-pink-300 dark:border-purple-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">🌞 Açık Tema</SelectItem>
                <SelectItem value="dark">🌙 Koyu Tema</SelectItem>
                <SelectItem value="system">📱 Sistem Teması</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* BİLDİRİM AYARLARI */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <Bell className="h-5 w-5 text-blue-600" />
              <span>Bildirimler</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-gray-700/40">
              <span>Namaz Bildirimleri</span>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-gray-700/40">
              <span>Sesli Bildirim</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* APP INFO */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-light">
              <Info className="h-5 w-5 text-blue-600" />
              Uygulama Bilgileri
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex justify-between py-2">
              <span>Sürüm</span>
              <span className="font-medium">1.0.0</span>
            </div>

            <Separator />

            <div className="flex justify-between py-2">
              <span>Geliştirici</span>
              <span className="font-medium">MGX Team</span>
            </div>

            <Separator />

            <div className="flex justify-between py-2">
              <span>Vakit Kaynağı</span>
              <span className="font-medium">Global</span>
            </div>
          </CardContent>
        </Card>

        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="w-full mx-auto" />
        )}

        <div className="h-4" />
      </div>
    </div>
  );
};

export default SettingsPage;
