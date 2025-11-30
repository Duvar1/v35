// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react'; 
import { fetchDailyRandomHadith } from '../services/hadithService';
import { getDailyDua } from '../services/dailyDuaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Book, Calendar } from 'lucide-react';
import { CountdownTimer } from '../components/CountdownTimer';
import { DailyContentCard } from '../components/DailyContentCard';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { PrayerTimesService } from '../services/prayerTimesService';
import { fetchDailyVerse } from '../services/quranService';

export const HomePage: React.FC = () => {

  /* SAYFA AÇILDIĞINDA EN ÜSTE ÇIK */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city, setCityAuto } = useSettingsStore();
  const { user } = useUserStore();

  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [dailyHadith, setDailyHadith] = useState<any>(null);
  const [dailyDua, setDailyDua] = useState<any>(null);

  const [verseLoading, setVerseLoading] = useState(true);
  const [hadithLoading, setHadithLoading] = useState(true);
  const [duaLoading, setDuaLoading] = useState(true);

  /* KONUMLA ŞEHİR BELİRLE — İlk açılış */
  useEffect(() => {
    if (!city || city === "Istanbul") {
      setCityAuto();  // otomatik şehir alma fonksiyonu
    }
  }, []);

  /* AYET */
  useEffect(() => {
    const loadDailyVerse = async () => {
      try {
        const v = await fetchDailyVerse();
        setDailyVerse(v);
      } catch {
        setDailyVerse({
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          turkish: "Rahman ve Rahim olan Allah'ın adıyla.",
          reference: "Fatiha Suresi 1"
        });
      } finally {
        setVerseLoading(false);
      }
    };
    loadDailyVerse();
  }, []);

  /* HADİS */
  useEffect(() => {
    const loadHadith = async () => {
      try {
        const h = await fetchDailyRandomHadith();
        setDailyHadith(h);
      } catch {
        setDailyHadith({
          title: "Günlük Hadis",
          hadeeth: "مَنْ صَلَّى عَلَىَّ...",
          explanation: "Kim bana bir salât getirirse Allah ona on kez salât eder."
        });
      } finally {
        setHadithLoading(false);
      }
    };
    loadHadith();
  }, []);

  /* DUA */
  useEffect(() => {
    const dua = getDailyDua();
    setDailyDua(dua);
    setDuaLoading(false);
  }, []);

  /* NAMAZ VAKİTLERİ */
  useEffect(() => {
    const loadTimes = async () => {
      try {
        const t = await PrayerTimesService.getPrayerTimes(city);
        setPrayerTimes(t);
      } catch (err) {
        console.log(err);
      }
    };
    loadTimes();
  }, [city]);

  /* SIRADAKİ NAMAZ */
  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    for (const p of prayerTimes.prayers) {
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > minutesNow) return p;
    }
    return prayerTimes.prayers[0];
  };

  const nextPrayer = getNextPrayer();

  return (
    <div className="min-h-screen bg-gradient-to-br 
      from-pink-50 via-orange-50 to-blue-50 
      dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">

      {/* ---------- HEADER ---------- */}
      <div className="
        sticky top-0 z-10 p-4 text-center
        bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90
        dark:from-purple-900/90 dark:via-blue-900/90 dark:to-cyan-900/90
        backdrop-blur-md border-b border-white/20">

        <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">
          Vakt-i Namaz
        </h1>

        <div className="flex justify-center gap-3 text-blue-600 dark:text-cyan-400 text-sm mt-1">
          <MapPin className="h-4 w-4" />
          <span>{city}</span>

          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </div>

      {/* ---------- İÇERİK ---------- */}
      <div className="px-4 pb-24 space-y-6">

        {/* Reklam 1 */}
        {!user?.isPremium && <AdPlaceholder type="banner" className="mt-3" />}

        {/* Sayaç */}
        <CountdownTimer nextPrayer={nextPrayer} />

        {/* Günün Vakitleri */}
        <Card className="bg-white/80 dark:bg-slate-900/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-800 dark:text-purple-200">
              <Clock className="h-5 w-5" /> Bugünün Vakitleri
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {prayerTimes?.prayers?.map((p) => (
                <div key={p.name} className="
                  p-3 rounded-lg text-center
                  bg-white/70 dark:bg-slate-800/40
                  border border-white/20 dark:border-white/10">

                  <div className="text-sm text-pink-800 dark:text-purple-200">
                    {p.name}
                  </div>

                  <div className="text-lg text-orange-600 dark:text-cyan-300">
                    {p.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Günün İçeriği */}
        <h2 className="text-xl font-light text-pink-800 dark:text-purple-200">
          Günün İçeriği
        </h2>

        {!verseLoading && dailyVerse && (
          <DailyContentCard type="verse" {...dailyVerse} />
        )}

        {!hadithLoading && dailyHadith && (
          <DailyContentCard
            type="hadith"           
            arabic={dailyHadith.hadeeth}
            turkish={dailyHadith.explanation}
            reference="Hadis"
          />
        )}

        {!duaLoading && dailyDua && (
          <DailyContentCard
            type="prayer"
            arabic={dailyDua.ARABIC_TEXT}
            turkish={dailyDua.TURKISH_TEXT}
            reference="Hisn Muslim"
          />
        )}

        {/* Reklam 2 */}
        {!user?.isPremium && <AdPlaceholder type="banner" className="mb-4" />}

        {/* ---------- HIZLI ERİŞİM ---------- */}
        <Card className="bg-white/80 dark:bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-pink-800 dark:text-purple-200">
              Hızlı Erişim
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4">

              <Button onClick={() => (window.location.href='/qibla')}>
                Kıble
              </Button>

              <Button onClick={() => (window.location.href='/prayer-times')}>
                Vakitler
              </Button>

              <Button onClick={() => (window.location.href='/quran')}>
                Kur'an
              </Button>

              <Button onClick={() => (window.location.href='/settings')}>
                Ayarlar
              </Button>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
