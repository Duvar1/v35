// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react'; 
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { fadeIn, scaleIn, staggerContainer, pop } from "../lib/motion";

import { fetchDailyHadith } from '../services/hadithService';
import { getDailyDua } from "../services/dailyDuaService";
import { fetchDailyVerse } from '../services/quranService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Book, Calendar, CalendarDays, Star, Heart, Moon, Shield, Compass, Settings, Sun } from 'lucide-react';

import { CountdownTimer } from '../components/CountdownTimer';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { PrayerTimesService } from '../services/prayerTimesService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleOrientationChange = () => {
      console.log('Orientation changed, state preserved');
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    const handleBeforeUnload = () => {
      localStorage.setItem('last_visited_page', '/');
      localStorage.setItem('home_scroll_position', window.scrollY.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    const savedScroll = localStorage.getItem('home_scroll_position');
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
      }, 100);
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const { prayerTimes, setPrayerTimes } = usePrayerStore();
  const { city, setCityAuto } = useSettingsStore();
  const { user } = useUserStore();

  const [dailyVerse, setDailyVerse] = useState(() => {
    const saved = localStorage.getItem('daily_verse');
    return saved ? JSON.parse(saved) : null;
  });
  const [dailyHadith, setDailyHadith] = useState(() => {
    const saved = localStorage.getItem('daily_hadith');
    return saved ? JSON.parse(saved) : null;
  });
  const [dailyDua, setDailyDua] = useState(() => {
    const saved = localStorage.getItem('daily_dua');
    return saved ? JSON.parse(saved) : null;
  });

  const [verseLoading, setVerseLoading] = useState(!dailyVerse);
  const [hadithLoading, setHadithLoading] = useState(!dailyHadith);
  const [duaLoading, setDuaLoading] = useState(!dailyDua);

  useEffect(() => {
    if (!city) setCityAuto();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toDateString();
        const lastLoadDate = localStorage.getItem('verse_last_load');
        
        if (!dailyVerse || lastLoadDate !== today) {
          const v = await fetchDailyVerse();
          setDailyVerse(v);
          localStorage.setItem('daily_verse', JSON.stringify(v));
          localStorage.setItem('verse_last_load', today);
        }
      } finally { 
        setVerseLoading(false); 
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toDateString();
        const lastLoadDate = localStorage.getItem('hadith_last_load');
        
        if (!dailyHadith || lastLoadDate !== today) {
          const h = await fetchDailyHadith();
          setDailyHadith(h);
          localStorage.setItem('daily_hadith', JSON.stringify(h));
          localStorage.setItem('hadith_last_load', today);
        }
      } finally { 
        setHadithLoading(false); 
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toDateString();
        const lastLoadDate = localStorage.getItem('dua_last_load');
        
        if (!dailyDua || lastLoadDate !== today) {
          const d = await getDailyDua();
          setDailyDua(d);
          localStorage.setItem('daily_dua', JSON.stringify(d));
          localStorage.setItem('dua_last_load', today);
        }
      } finally { 
        setDuaLoading(false); 
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadTimes = async () => {
      try {
        const today = new Date().toDateString();
        const cachedTimes = localStorage.getItem(`prayer_times_${city}_${today}`);
        
        if (cachedTimes) {
          setPrayerTimes(JSON.parse(cachedTimes));
        } else {
          const t = await PrayerTimesService.getPrayerTimes(city);
          setPrayerTimes(t);
          localStorage.setItem(`prayer_times_${city}_${today}`, JSON.stringify(t));
        }
      } catch {}
    };
    if (city) {
      loadTimes();
    }
  }, [city]);

  useEffect(() => {
    if (prayerTimes) {
      const today = new Date().toDateString();
      localStorage.setItem(`prayer_times_${city}_${today}`, JSON.stringify(prayerTimes));
    }
  }, [prayerTimes, city]);

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

  const goToPage = (path: string) => {
    localStorage.setItem('last_visited_page', path);
    navigate(path);
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br 
        from-pink-50 via-orange-50 to-blue-50 
        dark:from-gray-900 dark:via-purple-950 dark:to-blue-950"
    >

      {/* HEADER */}
      <motion.div
        variants={fadeIn(0, -10)}
        className="sticky top-0 z-10 p-4 text-center
          bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90
          dark:from-gray-800/90 dark:via-purple-800/90 dark:to-blue-800/90
          backdrop-blur-md border-b border-white/20 dark:border-gray-700"
      >
        <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">
          Vakt-i Namaz
        </h1>

        <div className="flex justify-center gap-3 text-blue-600 dark:text-cyan-400 text-sm mt-1">
          <MapPin className="h-4 w-4" />
          <span>{city}</span>

          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </motion.div>


      {/* CONTENT */}
      <div className="px-4 pb-24 space-y-6">

        {!user?.isPremium && <AdPlaceholder type="banner" className="mt-3" />}

        {/* COUNTDOWN */}
        <motion.div variants={scaleIn(0.1)}>
          <CountdownTimer nextPrayer={nextPrayer} />
        </motion.div>


        {/* BUGÜNÜN VAKİTLERİ */}
        <motion.div variants={fadeIn(0.15, 15)}>
          <Card className="bg-white/80 dark:bg-gray-800/60 shadow-sm border border-white/20 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-800 dark:text-purple-200">
                <Clock className="h-5 w-5" /> Bugünün Vakitleri
              </CardTitle>
            </CardHeader>

            <CardContent>
              <motion.div 
                variants={staggerContainer}
                className="grid grid-cols-2 gap-3"
              >
                {prayerTimes?.prayers?.map((p, i) => (
                  <motion.div 
                    key={p.name}
                    variants={fadeIn(i * 0.05, 10)}
                    className="p-3 rounded-lg text-center bg-gradient-to-br
                    from-pink-50/80 to-blue-50/80 dark:from-gray-700/60 dark:to-gray-800/60
                    border border-pink-100/50 dark:border-gray-600/50"
                  >
                    <div className="text-sm text-pink-800 dark:text-purple-200">{p.name}</div>
                    <div className="text-lg text-orange-600 dark:text-cyan-300">{p.time}</div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>


        {/* AYET */}
        {!verseLoading && dailyVerse && (
          <motion.div variants={fadeIn(0.2, 20)}>
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
                  <div className="text-xs text-green-700 dark:text-emerald-400 font-medium flex justify-between items-center">
                    <span>📖 {dailyVerse.reference}</span>
                    <span className="text-xs opacity-70">Kur'an-ı Kerim</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* DUA */}
        {!duaLoading && dailyDua && (
          <motion.div variants={fadeIn(0.25, 20)}>
            <Card className="border-0 shadow-lg bg-gradient-to-br 
              from-amber-50 via-yellow-50 to-orange-50 
              dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30">

              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-yellow-300">
                  <Heart className="h-5 w-5" /> Dua
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
                  
                  {/* EKLENDİ: Hisn-Muslim kaynağı */}
                  <div className="pt-2 mt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex justify-between items-center">
                      <span>📖 Hisn-Muslim</span>
                      <span className="text-xs opacity-70">Sahih Dua Koleksiyonu</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* HADİS */}
        {!hadithLoading && dailyHadith && (
          <motion.div variants={fadeIn(0.3, 20)}>
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
                  
                  {/* EKLENDİ: Sahih Muslim kaynağı */}
                  <div className="pt-2 mt-2 border-t border-purple-200/50 dark:border-purple-800/30">
                    <div className="text-xs text-purple-700 dark:text-purple-400 font-medium flex justify-between items-center">
                      <span>📖 Sahih Muslim</span>
                      <span className="text-xs opacity-70">Sahih Hadis Koleksiyonu</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* HIZLI ERİŞİM */}
        <motion.div variants={fadeIn(0.35, 15)}>
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

                {/** KIBLE */}
                <motion.div whileHover={pop.hover} whileTap={pop.tap}>
                  <Button 
                    onClick={() => goToPage('/qibla')}
                    className="h-14 w-full rounded-xl bg-gradient-to-r 
                    from-green-500 to-emerald-500 border-0 text-white flex flex-col items-center justify-center gap-1"
                  >
                    <Compass className="h-6 w-6" />
                    <span className="text-xs">Kıble</span>
                  </Button>
                </motion.div>

                {/** VAKİTLER */}
                <motion.div whileHover={pop.hover} whileTap={pop.tap}>
                  <Button 
                    onClick={() => goToPage('/prayer-times')}
                    className="h-14 w-full rounded-xl bg-gradient-to-r 
                    from-blue-500 to-cyan-500 border-0 text-white flex flex-col items-center justify-center gap-1"
                  >
                    <CalendarDays className="h-6 w-6" />
                    <span className="text-xs">Vakitler</span>
                  </Button>
                </motion.div>

                {/** KURAN */}
                <motion.div whileHover={pop.hover} whileTap={pop.tap}>
                  <Button 
                    onClick={() => goToPage('/quran')}
                    className="h-14 w-full rounded-xl bg-gradient-to-r 
                    from-purple-500 to-pink-500 border-0 text-white flex flex-col items-center justify-center gap-1"
                  >
                    <Book className="h-6 w-6" />
                    <span className="text-xs">Kur'an</span>
                  </Button>
                </motion.div>

                {/** AYARLAR */}
                <motion.div whileHover={pop.hover} whileTap={pop.tap}>
                  <Button 
                    onClick={() => goToPage('/settings')}
                    className="h-14 w-full rounded-xl bg-gradient-to-r 
                    from-gray-600 to-gray-700 border-0 text-white flex flex-col items-center justify-center gap-1"
                  >
                    <Settings className="h-6 w-6" />
                    <span className="text-xs">Ayarlar</span>
                  </Button>
                </motion.div>

              </div>
            </CardContent>

          </Card>
        </motion.div>


        {/* REKLAM */}
        {!user?.isPremium && <AdPlaceholder type="banner" className="mb-4" />}

      </div>
    </motion.div>
  );
};