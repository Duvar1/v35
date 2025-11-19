import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Navigation } from "lucide-react";
import { QiblaService } from "../services/qiblaService";

export const QiblaPage: React.FC = () => {
  const arrowRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const [heading, setHeading] = useState<number>(0);
  const [qibla, setQibla] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadQibla = async () => {
    setLoading(true);
    const d = await QiblaService.getQiblaDirection();
    if (d?.direction) {
      setQibla(d.direction);
      setDistance(d.distance);
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha != null) {
        const deg = event.alpha;
        setHeading(deg);

        if (wheelRef.current)
          wheelRef.current.style.transform = `rotate(${-deg}deg)`;

        if (arrowRef.current && qibla !== null) {
          let rot = (360 - deg + qibla) % 360;
          arrowRef.current.style.transform = `rotate(${rot}deg)`;
        }
      }
    };

    // iOS permission
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

    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, [qibla]);

  useEffect(() => {
    loadQibla();
  }, []);

  return (
    <div className="
      min-h-screen 
      bg-gradient-to-br 
      from-sky-50 via-blue-50 to-orange-50 
      dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 
      flex flex-col items-center 
      px-5 pt-6
    ">
      <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-4">
        Kıble Pusulası 🕌
      </h1>

      <Card className="
        w-full max-w-sm 
        bg-sky-100/70 dark:bg-slate-800/70 
        backdrop-blur-md 
        border border-sky-300 dark:border-slate-600 
        rounded-3xl shadow-xl
      ">
        <CardContent className="p-6">

          {/* --- COMPASS AREA --- */}
          <div className="relative w-72 h-72 mx-auto">

            {/* Arka Çember */}
            <div
              ref={wheelRef}
              className="
                absolute inset-0 rounded-full border-[8px]
                border-sky-300 dark:border-slate-500
                shadow-[inset_0_0_25px_rgba(0,0,0,0.2)]
                bg-gradient-to-br 
                from-sky-100 to-blue-100 
                dark:from-slate-800 dark:to-slate-900
              "
              style={{ transition: "transform 0.15s linear" }}
            ></div>

            {/* Pusula Derece Çizgileri */}
            {[...Array(360)].map((_, i) =>
              i % 15 === 0 ? (
                <div
                  key={i}
                  className="
                    absolute left-1/2 top-1/2 w-[2px] h-4 
                    bg-orange-400 dark:bg-orange-300 
                    origin-bottom opacity-70
                  "
                  style={{ transform: `rotate(${i}deg) translateY(-138px)` }}
                />
              ) : null
            )}

            {/* Kuzey */}
            <div className="
              absolute top-3 left-1/2 -translate-x-1/2 
              text-orange-500 dark:text-orange-300 
              font-bold tracking-widest text-sm
            ">
              N
            </div>

            {/* ⭐ Ortadaki KÂBE ⭐ */}
            <div className="
              absolute left-1/2 top-1/2 
              -translate-x-1/2 -translate-y-1/2 
              text-[36px] 
              drop-shadow-[0_0_8px_#e8d28b] 
            ">
              🕋
            </div>

            {/* Kıble Oku */}
            <div
              ref={arrowRef}
              className="
                absolute left-1/2 top-1/2 origin-bottom 
                -translate-x-1/2 -translate-y-full h-32 
                transition-transform duration-100
              "
            >
              <Navigation
                className="
                  h-12 w-12 text-orange-500 dark:text-orange-300 
                  drop-shadow-[0_0_10px_rgba(255,140,0,0.7)]
                "
                strokeWidth={1.6}
              />
            </div>
          </div>

          {/* --- TEXT AREA --- */}
          <div className="mt-6 text-center space-y-2">
            {loading ? (
              <p className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300">
                <RefreshCw className="animate-spin h-4 w-4" />
                Konum alınıyor...
              </p>
            ) : (
              <>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-300">
                  Kıble Yönü: {Math.round(qibla)}°
                </p>

                <p className="text-slate-600 dark:text-slate-400">
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
