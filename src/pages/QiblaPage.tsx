import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Navigation } from "lucide-react";
import KaabaImage from "@/assets/kaaba.png";
import { QiblaService } from "../services/qiblaService";
import { AdPlaceholder } from '../components/AdPlaceholder';
import { useUserStore } from '../store/userStore';
import { Capacitor } from "@capacitor/core";

export const QiblaPage: React.FC = () => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();

  const [heading, setHeading] = useState(0);
  const [qibla, setQibla] = useState(0);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  // ------------------------------------------------
  // QIBLA API
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
// ANDROID KONUM İZNİ (KIBLE İÇİN ZORUNLU)
// ------------------------------------------------
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  navigator.permissions
    ?.query({ name: "geolocation" as any })
    .then((res) => {
      if (res.state === "granted") return;

      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {
          alert("Kıble pusulası için konum izni verilmelidir.");
        }
      );
    })
    .catch(() => {
      // fallback
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => alert("Konum izni gerekli.")
      );
    });
}, []);

  // ------------------------------------------------
  // GÜNCELLENMİŞ DOĞRU COMPASS / ROTASYON ALGORİTMASI
  // ------------------------------------------------
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let rawHeading = 0;

      // iOS → en doğru yöntem
      if ((event as any).webkitCompassHeading !== undefined) {
        rawHeading = (event as any).webkitCompassHeading;
      }
      else if (event.alpha != null) {
        // Android → alpha temel alınır
        rawHeading = event.alpha;
      }

      // heading düzeltme
      let corrected = (rawHeading + offset) % 360;

      setHeading(corrected);

      // çarkı döndür
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${-corrected}deg)`;
      }

      // OK ROTASYONU — doğru formül
      if (arrowRef.current && qibla > 0) {
        let arrowRotation = (qibla - corrected + 360) % 360;
        arrowRef.current.style.transform = `rotate(${arrowRotation}deg)`;
      }
    };

    // iOS izin
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
        });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [qibla, offset]);

  useEffect(() => {
    loadQibla();
  }, []);

  // ------------------------------------------------
  // 180° OFFFSET DÜZELTMESİ
  // ------------------------------------------------
  const applyCalibration = () => {
    setOffset(prev => (prev + 180) % 360);
  };

  // ------------------------------------------------
  // UI - SCROLL DÜZELTMESİ
  // ------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col px-4 pt-4 pb-24 bg-gradient-to-b from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 text-slate-900 dark:text-white">
      
      {/* İÇERİK CONTAINER - Scroll edilebilir */}
      <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-4">

        {/* ÜST REKLAM */}
        {!user?.isPremium && (
          <div className="w-full">
            <AdPlaceholder 
              type="banner" 
              className="w-full border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
            />
          </div>
        )}

        <h1 className="text-xl font-bold text-orange-600 dark:text-orange-300">
          Kıble Pusulası 🕌
        </h1>

        {/* ANA COMPASS KARTI */}
        <Card className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl">
          <CardContent className="p-4">
            <div className="relative w-64 h-64 mx-auto">
              {/* wheel */}
              <div
                ref={wheelRef}
                className="absolute inset-0 rounded-full border-[6px] border-sky-300 shadow-[inset_0_0_30px_#00000030] bg-gradient-to-br from-sky-100/70 to-blue-100/70 dark:from-slate-800 dark:to-slate-900"
                style={{ transition: "transform 0.15s linear" }}
              />

              {/* çizgiler */}
              {[...Array(24)].map((_, i) => {
                const degree = i * 15;
                return (
                  <div
                    key={degree}
                    className="absolute left-1/2 top-1/2 w-[1.5px] h-3 bg-orange-400 origin-bottom opacity-90"
                    style={{ transform: `rotate(${degree}deg) translateY(-122px)` }}
                  />
                );
              })}

              {/* yönler */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-orange-600 dark:text-orange-300 font-bold text-sm">N</div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-orange-600 dark:text-orange-300 font-bold text-sm">S</div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-300 font-bold text-sm">W</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-300 font-bold text-sm">E</div>

              {/* Kaabe */}
              <img
                src={KaabaImage}
                alt="Kaaba"
                className="absolute left-1/2 top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-1/2 z-10"
              />

              {/* OK */}
              <div
                ref={arrowRef}
                className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 h-28 transition-transform duration-100 z-20"
              >
                <Navigation 
                  className="h-14 w-14 text-red-600 dark:text-red-400 drop-shadow-xl" 
                  strokeWidth={1.5}
                />
              </div>
            </div>

            {/* TEXT */}
            <div className="mt-4 text-center space-y-2">
              {loading ? (
                <p className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-300 text-sm">
                  <RefreshCw className="animate-spin h-3 w-3" />
                  Konum alınıyor...
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-300">
                    Kıble: {Math.round(qibla)}°
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Uzaklık: {distance.toLocaleString()} km
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pusula: {Math.round(heading)}° | Düzeltme: {offset}°
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-300">
                    Ok: {Math.round((qibla - heading + 360) % 360)}°
                  </p>
                </>
              )}
            </div>

            {/* BUTTONS */}
            <div className="mt-3 flex flex-col gap-1.5">
              <button
                onClick={applyCalibration}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
              >
                180° Kalibrasyon
              </button>
              
              <button
                onClick={loadQibla}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Konumu Yenile
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ORTA REKLAM */}
        {!user?.isPremium && (
          <div className="w-full">
            <AdPlaceholder 
              type="banner" 
              className="w-full border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
            />
          </div>
        )}

        {/* BİLGİ KARTI */}
        <Card className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl">
          <CardContent className="p-3">
            <h3 className="font-semibold mb-2 text-slate-900 dark:text-white text-sm">
              Kullanım Talimatları
            </h3>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <li className="flex items-start">
                <span className="text-green-600 mr-1">•</span>
                Cihazınızı düz tutun
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-1">•</span>
                Konum izni verin
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-1">•</span>
                Kırmızı ok Kıble'yi gösterir
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* ALT REKLAM - MENÜ BARINDAN YUKARIDA */}
        {!user?.isPremium && (
          <div className="w-full mb-6"> {/* mb-6 ile menü barından boşluk bıraktık */}
            <AdPlaceholder 
              type="banner" 
              className="w-full border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
            />
          </div>
        )}

      </div>

      {/* MENÜ BARI İÇİN BOTTOM PADDING */}
      <div className="h-16"></div> {/* Menü barı yüksekliği kadar boşluk */}
    </div>
  );
};

export default QiblaPage;