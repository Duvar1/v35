import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Navigation } from "lucide-react";
import KaabaImage from "@/assets/kaaba.png";
import { QiblaService } from "../services/qiblaService";

export const QiblaPage: React.FC = () => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const [heading, setHeading] = useState<number>(0);
  const [qibla, setQibla] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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
  // 2) DÜZELTİLMİŞ COMPASS SENSÖR (Tilt compensation + iOS fix)
  // ------------------------------------------------
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let headingDeg = 0;

      // iOS özel değer
      if ((event as any).webkitCompassHeading) {
        headingDeg = (event as any).webkitCompassHeading;
      } else {
        // Android için tilt kompanzasyonlu hesap
        const alpha = event.alpha ?? 0;
        const beta = event.beta ?? 0;
        const gamma = event.gamma ?? 0;

        const rad =
          Math.atan2(
            Math.sin(alpha * (Math.PI / 180)) * Math.cos(beta * (Math.PI / 180)),
            Math.cos(alpha * (Math.PI / 180)) * Math.cos(gamma * (Math.PI / 180))
          );

        headingDeg = (rad * 180) / Math.PI;
        headingDeg = (headingDeg + 360) % 360;
      }

      setHeading(headingDeg);

      // pusula çarkını döndür
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${-headingDeg}deg)`;
      }

      // kıble okunu döndür
      if (arrowRef.current) {
        const rot = (qibla - headingDeg + 360) % 360;
        arrowRef.current.style.transform = `rotate(${rot}deg)`;
      }
    };

    // iOS izin sistemi
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      (DeviceOrientationEvent as any).requestPermission
    ) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((res: string) => {
          if (res === "granted")
            window.addEventListener("deviceorientation", handleOrientation);
        });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [qibla]);

  useEffect(() => {
    loadQibla();
  }, []);

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-6 
        bg-gradient-to-b from-sky-50 via-blue-50 to-orange-50 
        dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 text-slate-900 dark:text-white">

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
            {[...Array(360)].map((_, i) =>
              i % 15 === 0 ? (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-[2px] h-4 
                  bg-orange-400 origin-bottom opacity-90"
                  style={{
                    transform: `rotate(${i}deg) translateY(-138px)`,
                  }}
                />
              ) : null
            )}

            {/* Kuzey işareti */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-orange-600 dark:text-orange-300 font-bold">
              N
            </div>

            {/* Kaabe PNG (merkezde sabit) */}
            <img
              src={KaabaImage}
              alt="Kaaba"
              className="absolute left-1/2 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 
              drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            />

            {/* Kıble oku */}
            <div
              ref={arrowRef}
              className="absolute left-1/2 top-1/2 origin-center 
              -translate-x-1/2 -translate-y-1/2 h-32 transition-transform duration-100"
            >
              <Navigation className="h-16 w-16 text-orange-500 dark:text-orange-300 drop-shadow-xl" strokeWidth={1.5} />
            </div>
          </div>

          {/* Text area */}
          <div className="mt-6 text-center space-y-2">
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
                  En doğru sonuç için cihazı yatay tutun.
                </p>
              </>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default QiblaPage;
