// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react'; 
import { fetchDailyHadith } from '../services/hadithService';
import { getDailyDua } from "../services/dailyDuaService";
import { fetchDailyVerse } from '../services/quranService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Book, Calendar, CalendarDays, Star, Moon, Heart, Shield, Compass, Settings, Sun } from 'lucide-react';
import { CountdownTimer } from '../components/CountdownTimer';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { PrayerTimesService } from '../services/prayerTimesService';

export const HomePage: React.FC = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { prayerTimes, setPrayerTimes } = usePrayerStore();
  const { city, setCityAuto } = useSettingsStore();
  const { user } = useUserStore();

  const [dailyVerse, setDailyVerse] = useState(null);
  const [dailyHadith, setDailyHadith] = useState(null);
  const [dailyDua, setDailyDua] = useState(null);

  const [verseLoading, setVerseLoading] = useState(true);
  const [hadithLoading, setHadithLoading] = useState(true);
  const [duaLoading, setDuaLoading] = useState(true);

  // Şehir otomatik belirle
  useEffect(() => {
    if (!city) setCityAuto();
  }, []);

  // Ayet
  useEffect(() => {
    const load = async () => {
      try {
        const v = await fetchDailyVerse();
        setDailyVerse(v);
      } finally {
        setVerseLoading(false);
      }
    };
    load();
  }, []);

  // Hadis
  useEffect(() => {
    const load = async () => {
      try {
        const h = await fetchDailyHadith();
        setDailyHadith(h);
      } finally {
        setHadithLoading(false);
      }
    };
    load();
  }, []);

  // Dua
  useEffect(() => {
    const load = async () => {
      try {
        const d = await getDailyDua();
        setDailyDua(d);
      } finally {
        setDuaLoading(false);
      }
    };
    load();
  }, []);

  // Namaz vakitleri
  useEffect(() => {
    const loadTimes = async () => {
      try {
        const t = await PrayerTimesService.getPrayerTimes(city);
        setPrayerTimes(t);
      } catch {}
    };
    loadTimes();
  }, [city]);


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
      dark:from-gray-900 dark:via-purple-950 dark:to-blue-950">

      {/* HEADER */}
      <div className="
        sticky top-0 z-10 p-4 text-center
        bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90
        dark:from-gray-800/90 dark:via-purple-800/90 dark:to-blue-800/90
        backdrop-blur-md border-b border-white/20 dark:border-gray-700">
        
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

      {/* CONTENT */}
      <div className="px-4 pb-24 space-y-6">

        {!user?.isPremium && <AdPlaceholder type="banner" className="mt-3" />}

        <CountdownTimer nextPrayer={nextPrayer} />

        {/* Günün Vakitleri */}
        <Card className="bg-white/80 dark:bg-gray-800/60 shadow-sm border border-white/20 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-800 dark:text-purple-200">
              <Clock className="h-5 w-5" /> Bugünün Vakitleri
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {prayerTimes?.prayers?.map((p) => (
                <div key={p.name}
                  className="p-3 rounded-lg text-center bg-gradient-to-br
                  from-pink-50/80 to-blue-50/80 dark:from-gray-700/60 dark:to-gray-800/60
                  border border-pink-100/50 dark:border-gray-600/50">
                  
                  <div className="text-sm text-pink-800 dark:text-purple-200">{p.name}</div>
                  <div className="text-lg text-orange-600 dark:text-cyan-300">{p.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* GÜNÜN İÇERİĞİ */}
        <h2 className="text-xl font-light text-pink-800 dark:text-purple-200">
          <Book className="inline h-5 w-5 mr-2" /> Günün İçeriği
        </h2>

        {/* ORTA REKLAM */}
        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="my-6" />
        )}

        {/* AYET */}
        {!verseLoading && dailyVerse && (
          <Card className="border-0 shadow-lg bg-gradient-to-br 
            from-green-50 via-emerald-50 to-cyan-50 
            dark:from-emerald-900/30 dark:via-green-900/30 dark:to-cyan-900/30">

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-emerald-300">
                <Star className="h-5 w-5" /> Günün Ayeti
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="text-2xl text-right font-arabic text-gray-900 dark:text-gray-100 leading-relaxed">
                  {dailyVerse.arabic}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{dailyVerse.turkish}"
                </div>
                <div className="text-xs text-green-700 dark:text-emerald-400 font-medium">
                  📖 {dailyVerse.reference}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DUA */}
        {!duaLoading && dailyDua && (
          <Card className="border-0 shadow-lg bg-gradient-to-br 
            from-amber-50 via-yellow-50 to-orange-50 
            dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30">

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-yellow-300">
                <Heart className="h-5 w-5" /> 🕌 Dua
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="text-2xl text-right font-arabic text-gray-900 dark:text-gray-100 leading-relaxed">
                  {dailyDua.ARABIC_TEXT}
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{dailyDua.TURKISH_TEXT}"
                </div>

                <div className="text-xs text-amber-700 dark:text-yellow-400 font-medium">
                  Hisn Muslim
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HADİS — EN ALTA ALINDI */}
        {!hadithLoading && dailyHadith && (
          <Card className="border-0 shadow-lg bg-gradient-to-br 
            from-purple-50 via-violet-50 to-pink-50 
            dark:from-purple-900/30 dark:via-violet-900/30 dark:to-pink-900/30">

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-violet-300">
                <Moon className="h-5 w-5" /> Günün Hadisi
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="text-2xl text-right font-arabic text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-line">
                  {dailyHadith.hadeeth}
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-300 italic whitespace-pre-line">
  "{dailyHadith.explanation}"
</div>


                <div className="text-xs text-purple-700 dark:text-violet-400 font-medium">
                  Hadis-i Şerif Sahih Muslim
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hızlı erişim */}
        <Card className="border-0 shadow-lg bg-gradient-to-br 
          from-blue-50 via-cyan-50 to-sky-50 
          dark:from-gray-800/60 dark:via-gray-700/60 dark:to-gray-800/60">

          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-cyan-300">
              <Shield className="h-5 w-5" /> Hızlı Erişim
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4">

              <Button 
                onClick={() => (window.location.href='/qibla')}
                className="h-14 rounded-xl bg-gradient-to-r 
                from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 
                border-0 text-white flex flex-col items-center justify-center gap-1">
                <Compass className="h-6 w-6" />
                <span className="text-xs font-light">Kıble</span>
              </Button>

              <Button 
                onClick={() => (window.location.href='/prayer-times')}
                className="h-14 rounded-xl bg-gradient-to-r 
                from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                border-0 text-white flex flex-col items-center justify-center gap-1">
                <CalendarDays className="h-6 w-6" />
                <span className="text-xs font-light">Vakitler</span>
              </Button>

              <Button 
                onClick={() => (window.location.href='/quran')}
                className="h-14 rounded-xl bg-gradient-to-r 
                from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 
                border-0 text-white flex flex-col items-center justify-center gap-1">
                <Book className="h-6 w-6" />
                <span className="text-xs font-light">Kur'an</span>
              </Button>

              <Button 
                onClick={() => (window.location.href='/settings')}
                className="h-14 rounded-xl bg-gradient-to-r 
                from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 
                border-0 text-white flex flex-col items-center justify-center gap-1">
                <Settings className="h-6 w-6" />
                <span className="text-xs font-light">Ayarlar</span>
              </Button>

              <Button 
                onClick={() => (window.location.href='/invite')}
                className="h-14 rounded-xl bg-gradient-to-r 
                from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 
                border-0 text-white flex flex-col items-center justify-center gap-1 col-span-2">
                <Sun className="h-6 w-6" />
                <span className="text-xs font-light">Arkadaşını Davet Et</span>
              </Button>

            </div>
          </CardContent>

        </Card>

        {!user?.isPremium && <AdPlaceholder type="banner" className="mb-4" />}

      </div>
    </div>
  );
};
