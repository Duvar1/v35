import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Navigation } from "lucide-react";
import KaabaImage from "@/assets/kaaba.png";
import { QiblaService } from "../services/qiblaService";
import { AdPlaceholder } from '../components/AdPlaceholder';
import { useUserStore } from '../store/userStore';

export const QiblaPage: React.FC = () => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();

  const [heading, setHeading] = useState<number>(0);
  const [qibla, setQibla] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [calibration, setCalibration] = useState<number>(0);

  // ------------------------------------------------
  // 1) KIBLE API
  // ------------------------------------------------
  const loadQibla = async () => {
    setLoading(true);
    const d = await QiblaService.getQiblaDirection();
    if (d?.direction) {
      setQibla(d.direction);
      setDistance(d.distance);
    }
    setLoading(false);
  };

  // ------------------------------------------------
  // 2) DÜZELTİLMİŞ COMPASS SENSÖR (180 derece sorunu çözüldü)
  // ------------------------------------------------
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let headingDeg = 0;

      // iOS için webkitCompassHeading (en güvenilir)
      if ((event as any).webkitCompassHeading !== undefined) {
        headingDeg = (event as any).webkitCompassHeading;
      } 
      // Android için düzeltilmiş hesaplama
      else if (event.alpha !== null) {
        const alpha = event.alpha; // 0-360 derece
        const beta = event.beta || 0; // -180 to 180
        const gamma = event.gamma || 0; // -90 to 90
        
        // Basit ve güvenilir yöntem - alpha değerini direkt kullan
        headingDeg = alpha || 0;
        
        // Cihazın fiziksel yönelimine göre düzeltme
        if (Math.abs(beta) > 45 || Math.abs(gamma) > 45) {
          // Cihaz dik tutuluyorsa, pusula doğru çalışmayabilir
          console.warn("Cihazı düz tutun for better accuracy");
        }
      }

      // 180 derece düzeltmesi - bazı cihazlarda ters çalışıyor
      let correctedHeading = (360 - headingDeg + calibration) % 360;
      
      // Kalibrasyon testi için: eğer kıble 180 derece farklıysa, kalibrasyonu ayarla
      if (Math.abs((qibla - correctedHeading + 360) % 360 - 180) < 5) {
        console.log("180 derece hatası tespit edildi, kalibrasyon uygulanıyor");
        correctedHeading = (correctedHeading + 180) % 360;
      }

      setHeading(correctedHeading);

      // pusula çarkını döndür
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${-correctedHeading}deg)`;
      }

      // kıble okunu döndür - DÜZELTİLMİŞ HESAP
      if (arrowRef.current && qibla > 0) {
        // Kıble yönü = (Kıble açısı - Pusula yönü) mod 360
        let arrowRotation = (qibla - correctedHeading + 360) % 360;
        
        // Arrow'u kıble yönüne çevir
        arrowRef.current.style.transform = `rotate(${arrowRotation}deg)`;
      }
    };

    // Kalibrasyon butonu için
    const calibrateCompass = () => {
      setCalibration(prev => (prev + 180) % 360);
      alert("Pusula 180 derece kalibre edildi. Eğer hala yanlışsa tekrar tıklayın.");
    };

    // Kalibrasyon butonunu global olarak ekle (test için)
    (window as any).calibrateCompass = calibrateCompass;

    // iOS izin sistemi
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      (DeviceOrientationEvent as any).requestPermission
    ) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((res: string) => {
          if (res === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      // Android ve diğer tarayıcılar
      if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation);
      } else {
        console.warn("DeviceOrientationEvent desteklenmiyor");
      }
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      delete (window as any).calibrateCompass;
    };
  }, [qibla, calibration]);

  useEffect(() => {
    loadQibla();
  }, []);

  // Manuel kalibrasyon butonu
  const handleCalibrate = () => {
    setCalibration(prev => (prev + 180) % 360);
  };

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-6 
        bg-gradient-to-b from-sky-50 via-blue-50 to-orange-50 
        dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 text-slate-900 dark:text-white">

      {/* Top Ad */}
      {!user?.isPremium && (
        <div className="w-full max-w-sm mb-4">
          <AdPlaceholder 
            type="banner" 
            className="w-full border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
          />
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4 text-orange-600 dark:text-orange-300">
        Kıble Pusulası 🕌
      </h1>

      <Card className="w-full max-w-sm bg-white/70 dark:bg-slate-900/60 
          backdrop-blur-xl border border-slate-200 dark:border-slate-700 
          rounded-3xl shadow-xl">
        <CardContent className="p-6">
          
          {/* ---------- COMPASS AREA ---------- */}
          <div className="relative w-72 h-72 mx-auto">

            {/* ÇARK */}
            <div
              ref={wheelRef}
              className="absolute inset-0 rounded-full border-[8px] border-sky-300 
              shadow-[inset_0_0_40px_#00000030] bg-gradient-to-br 
              from-sky-100/70 to-blue-100/70 dark:from-slate-800 dark:to-slate-900"
              style={{ transition: "transform 0.15s linear" }}
            />

            {/* Derece çizgileri */}
            {[...Array(24)].map((_, i) => {
              const degree = i * 15;
              return (
                <div
                  key={degree}
                  className="absolute left-1/2 top-1/2 w-[2px] h-4 
                  bg-orange-400 origin-bottom opacity-90"
                  style={{
                    transform: `rotate(${degree}deg) translateY(-138px)`,
                  }}
                />
              );
            })}

            {/* Yön işaretleri */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-orange-600 dark:text-orange-300 font-bold">
              N
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-orange-600 dark:text-orange-300 font-bold">
              S
            </div>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-300 font-bold">
              W
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-300 font-bold">
              E
            </div>

            {/* Kaabe PNG (merkezde sabit) */}
            <img
              src={KaabaImage}
              alt="Kaaba"
              className="absolute left-1/2 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 
              drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] z-10"
            />

            {/* Kıble oku */}
            <div
              ref={arrowRef}
              className="absolute left-1/2 top-1/2 origin-center 
              -translate-x-1/2 -translate-y-1/2 h-32 transition-transform duration-100 z-20"
            >
              <Navigation className="h-16 w-16 text-red-600 dark:text-red-400 drop-shadow-xl" strokeWidth={1.5} />
            </div>
          </div>

          {/* Text area */}
          <div className="mt-6 text-center space-y-3">
            {loading ? (
              <p className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-300">
                <RefreshCw className="animate-spin h-4 w-4" />
                Konum alınıyor...
              </p>
            ) : (
              <>
                <p className="text-xl font-semibold text-orange-600 dark:text-orange-300">
                  Kıble Yönü: {Math.round(qibla)}°
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Kâbe uzaklığı: {distance.toLocaleString()} km
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pusula: {Math.round(heading)}° | Kalibrasyon: {calibration}°
                </p>
              </>
            )}
          </div>

          {/* Kontroller */}
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={handleCalibrate}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              180° Kalibrasyon Uygula
            </button>
            
            <button
              onClick={loadQibla}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Konumu Yenile
            </button>
          </div>

        </CardContent>
      </Card>

      {/* Middle Ad */}
      {!user?.isPremium && (
        <div className="w-full max-w-sm mt-6">
          <AdPlaceholder 
            type="banner" 
            className="w-full border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
          />
        </div>
      )}

      {/* Instructions Card */}
      <Card className="w-full max-w-sm mt-6 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
            Kullanım Talimatları
          </h3>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Cihazınızı düz bir yüzeye yerleştirin
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Konum izni verin
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Kırmızı ok Kıble yönünü gösterir
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Kalibrasyon için cihazınızı 8 şeklinde hareket ettirin
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Bottom Ad */}
      {!user?.isPremium && (
        <div className="w-full max-w-sm mt-6 mb-20">
          <AdPlaceholder 
            type="banner" 
            className="w-full border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
          />
        </div>
      )}

      <div className="h-4"></div>
    </div>
  );
};

export default QiblaPage;