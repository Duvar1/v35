import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, pop } from "@/lib/motion";

import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Navigation } from "lucide-react";
import KaabaImage from "@/assets/kaaba.png";

import { QiblaService } from "../services/qiblaService";
import { AdPlaceholder } from "../components/AdPlaceholder";
import { useUserStore } from "../store/userStore";
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

  // --------------------------------------------------------------------
  // KIBLE API
  // --------------------------------------------------------------------
  const loadQibla = async () => {
    setLoading(true);
    const d = await QiblaService.getQiblaDirection();
    if (d?.direction) {
      setQibla(d.direction);
      setDistance(d.distance);
    }
    setLoading(false);
  };

  // --------------------------------------------------------------------
  // KONUM İZNİ (ANDROID)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    navigator.permissions
      ?.query({ name: "geolocation" as any })
      .then((res) => {
        if (res.state === "granted") return;

        navigator.geolocation.getCurrentPosition(
          () => {},
          () => alert("Kıble pusulası için konum izni gereklidir.")
        );
      })
      .catch(() => {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => alert("Konum izni gereklidir.")
        );
      });
  }, []);

  // --------------------------------------------------------------------
  // CİHAZ ORYANTASYONU (En doğru heading)
  // --------------------------------------------------------------------
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let raw = 0;

      if ((event as any).webkitCompassHeading !== undefined) {
        raw = (event as any).webkitCompassHeading;
      } else if (event.alpha != null) {
        raw = event.alpha;
      }

      const corrected = (raw + offset) % 360;
      setHeading(corrected);

      if (wheelRef.current)
        wheelRef.current.style.transform = `rotate(${-corrected}deg)`;

      if (arrowRef.current && qibla > 0) {
        const arrow = (qibla - corrected + 360) % 360;
        arrowRef.current.style.transform = `rotate(${arrow}deg)`;
      }
    };

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      (DeviceOrientationEvent as any).requestPermission
    ) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((r: string) => {
          if (r === "granted")
            window.addEventListener("deviceorientation", handleOrientation);
        });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, [qibla, offset]);

  useEffect(() => {
    loadQibla();
  }, []);

  const applyCalibration = () => setOffset((p) => (p + 180) % 360);

  // --------------------------------------------------------------------
  // UI — ANİMASYONLU, HOMEPADE İLE AYNI TEMA
  // --------------------------------------------------------------------
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="min-h-screen px-4 pt-4 pb-24 
      bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50
      dark:from-slate-900 dark:via-blue-950 dark:to-orange-950
      text-slate-900 dark:text-white flex flex-col items-center"
    >
      {/* HEADER */}
      <motion.h1
        variants={fadeIn(0, 20)}
        className="text-2xl font-bold text-orange-600 dark:text-orange-300 mb-2"
      >
        Kıble Pusulası 🕌
      </motion.h1>

      {/* ÜST REKLAM */}
      {!user?.isPremium && (
        <motion.div variants={fadeIn(0.1, 20)} className="w-full max-w-sm">
          <AdPlaceholder type="banner" />
        </motion.div>
      )}

      {/* ANA KOMPAS KARTI */}
      <motion.div variants={fadeIn(0.15, 15)} className="w-full max-w-sm mt-3">
        <Card className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-300 dark:border-slate-700 shadow-xl rounded-2xl">
          <CardContent className="p-4">
            {/* COMPASS */}
            <div className="relative w-64 h-64 mx-auto">
              {/* ÇARK */}
              <div
                ref={wheelRef}
                className="absolute inset-0 rounded-full border-[6px] border-sky-300
                bg-gradient-to-br from-sky-200/60 to-blue-200/60
                dark:from-slate-800 dark:to-slate-900
                shadow-inner"
                style={{ transition: "transform 0.15s linear" }}
              />

              {/* Derece çizgileri */}
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-[2px] h-3 bg-orange-400 origin-bottom"
                  style={{
                    transform: `rotate(${i * 15}deg) translateY(-122px)`,
                  }}
                />
              ))}

              {/* YÖN HARFLERİ */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-orange-600 font-bold">
                N
              </span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-orange-600 font-bold">
                S
              </span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-600 font-bold">
                W
              </span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-600 font-bold">
                E
              </span>

              {/* KAABE */}
              <img
                src={KaabaImage}
                alt="Kaaba"
                className="absolute left-1/2 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 z-10"
              />

              {/* OK */}
              <div
                ref={arrowRef}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center h-32 z-20"
              >
                <Navigation className="h-14 w-14 text-red-600 dark:text-red-400 drop-shadow-lg" />
              </div>
            </div>

            {/* TEXT BİLGİLERİ */}
            <motion.div
              variants={fadeIn(0.2, 20)}
              className="text-center mt-4 space-y-1"
            >
              {loading ? (
                <p className="text-gray-500 flex items-center justify-center gap-1">
                  <RefreshCw className="animate-spin h-3 w-3" /> Konum alınıyor...
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-orange-600">
                    Kıble: {Math.round(qibla)}°
                  </p>
                  <p className="text-xs opacity-80">
                    Uzaklık: {distance.toLocaleString()} km
                  </p>
                  <p className="text-xs opacity-60">
                    Pusula: {Math.round(heading)}° | Kalibrasyon: {offset}°
                  </p>
                </>
              )}
            </motion.div>

            {/* BUTONLAR */}
            <motion.div
              variants={fadeIn(0.25, 20)}
              className="mt-4 flex flex-col gap-2"
            >
              <button
                onClick={applyCalibration}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs shadow-md"
              >
                180° Kalibrasyon
              </button>

              <button
                onClick={loadQibla}
                disabled={loading}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs shadow-md flex gap-1 justify-center disabled:opacity-40"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ALT REKLAM */}
      {!user?.isPremium && (
        <motion.div variants={fadeIn(0.3, 20)} className="w-full max-w-sm mt-4">
          <AdPlaceholder type="banner" />
        </motion.div>
      )}

      {/* BİLGİ KARTI */}
      <motion.div variants={fadeIn(0.35, 20)} className="w-full max-w-sm mt-2">
        <Card className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-300 dark:border-slate-700 rounded-xl">
          <CardContent className="p-4 text-xs">
            <h3 className="font-semibold mb-2 text-orange-600 dark:text-orange-300">
              Kullanım Talimatları
            </h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>• Cihazınızı düz tutun</li>
              <li>• Konum izni verin</li>
              <li>• Kırmızı ok kıbleyi gösterir</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      <div className="h-14" />
    </motion.div>
  );
};

export default QiblaPage;
