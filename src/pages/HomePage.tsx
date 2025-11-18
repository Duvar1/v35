// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react'; 
import { fetchDailyRandomHadith } from '../services/hadithService';
import { getDailyDua, DuaDetail } from '../services/dailyDuaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Book, TrendingUp, Calendar } from 'lucide-react';
import { CountdownTimer } from '../components/CountdownTimer';
import { DailyContentCard } from '../components/DailyContentCard';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { PrayerTimesService } from '../services/prayerTimesService';
import { fetchDailyVerse } from '../services/quranService';

interface HadithDetail {
  id?: string;
  title?: string;
  hadeeth?: string;
  explanation?: string;
  grade?: string;
  attribution?: string;
  reference?: string;
}

interface VerseDetail {
  arabic: string;
  turkish: string;
  reference: string;
}

export const HomePage: React.FC = () => {
  const { prayerTimes, loading, setPrayerTimes } = usePrayerStore();
  const { city } = useSettingsStore();
  const { user } = useUserStore();
  
  const [dailyVerse, setDailyVerse] = useState<VerseDetail | null>(null);
  const [dailyHadith, setDailyHadith] = useState<HadithDetail | null>(null);
  const [dailyDua, setDailyDua] = useState<DuaDetail | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [hadithLoading, setHadithLoading] = useState(true);
  const [duaLoading, setDuaLoading] = useState(true);

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 6) return 'Hayırlı geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'Hayırlı akşamlar';
  };

  const formatDate = () => {
    return today.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Günün ayetini yükle
  useEffect(() => {
    const loadDailyVerse = async () => {
      try {
        setVerseLoading(true);
        const verse = await fetchDailyVerse();
        setDailyVerse(verse);
      } catch (error) {
        console.error('Günün ayeti yüklenemedi:', error);
        // Fallback ayet
        setDailyVerse({
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          turkish: "Rahmân ve Rahîm olan Allah'ın adıyla.",
          reference: "Fatiha Suresi 1. Ayet"
        });
      } finally {
        setVerseLoading(false);
      }
    };

    loadDailyVerse();
  }, []);

  // Günün hadisini yükle
  useEffect(() => {
    const loadDailyHadith = async () => {
      try {
        setHadithLoading(true);
        const hadithData = await fetchDailyRandomHadith();
        
        const hadith: HadithDetail = {
          id: hadithData.id,
          title: hadithData.title,
          hadeeth: hadithData.hadeeth,
          explanation: hadithData.explanation,
          grade: hadithData.grade,
          attribution: hadithData.attribution,
          reference: hadithData.reference || "Hadis"
        };
        
        setDailyHadith(hadith);
      } catch (error) {
        console.error('Günün hadisi yüklenemedi:', error);
        // Fallback hadis
        setDailyHadith({
          title: "Günlük Hadis",
          hadeeth: "مَنْ صَلَّى عَلَىَّ وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا",
          explanation: "Kim bana bir defa salâtü selam getirirse, Allah ona on defa salât eder.",
          reference: "Müslim, Salât, 70"
        });
      } finally {
        setHadithLoading(false);
      }
    };

    loadDailyHadith();
  }, []);

  // Günün duasını yükle
  useEffect(() => {
    const loadDailyDua = () => {
      try {
        setDuaLoading(true);
        console.log('🔄 Günlük dua yükleniyor...');
        const dua = getDailyDua();
        console.log('✅ Günlük dua alındı:', dua?.ID);
        setDailyDua(dua);
      } catch (error) {
        console.error('❌ Günlük dua yüklenemedi:', error);
        // Fallback dua
        setDailyDua({
          ID: 75,
          ARABIC_TEXT: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
          TURKISH_TEXT: "Allah'ı hamd ile tesbih ederim"
        });
      } finally {
        setDuaLoading(false);
      }
    };

    loadDailyDua();
  }, []);

  // Namaz vakitlerini yükle
  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        const times = await PrayerTimesService.getPrayerTimes(city);
        setPrayerTimes(times);
      } catch (error) {
        console.error('Failed to load prayer times:', error);
      }
    };

    loadPrayerTimes();
  }, [city, setPrayerTimes]);

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const prayer of prayerTimes.prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (prayerTime > currentTime) {
        return { name: prayer.name, time: prayer.time };
      }
    }
    
    return prayerTimes.prayers.length > 0 
      ? { name: prayerTimes.prayers[0].name, time: prayerTimes.prayers[0].time }
      : null;
  };

  const nextPrayer = getNextPrayer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90 dark:from-purple-900/90 dark:via-blue-900/90 dark:to-cyan-900/90 backdrop-blur-md border-b border-pink-200/50 dark:border-purple-500/30">
        <div className="p-4">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">
              {getGreeting()}
            </h1>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-blue-600 dark:text-cyan-400 font-light">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{city}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span className="font-light">{formatDate()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="pb-20 px-4 space-y-6">
        {/* Top Ad */}
        {!user?.isPremium && (
          <div className="pt-4">
            <AdPlaceholder type="banner" className="max-w-md mx-auto" />
          </div>
        )}

        {/* Countdown Timer */}
        <div className="pt-2">
          {loading ? (
            <Card className="animate-pulse bg-gradient-to-r from-pink-200/60 via-orange-200/60 to-blue-200/60 dark:from-purple-800/40 dark:via-blue-800/40 dark:to-cyan-800/40 border-pink-200/50 dark:border-purple-500/30">
              <CardContent className="p-6 h-32"></CardContent>
            </Card>
          ) : (
            <CountdownTimer nextPrayer={nextPrayer} />
          )}
        </div>

        {/* Quick Prayer Times - Grid Layout */}
        <Card className="bg-gradient-to-r from-pink-50/80 via-orange-50/80 to-blue-50/80 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <Clock className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <span>Bugünün Vakitleri</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gradient-to-r from-pink-200/60 via-orange-200/60 to-blue-200/60 dark:from-purple-800/40 dark:via-blue-800/40 dark:to-cyan-800/40 h-12 rounded-lg"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {prayerTimes?.prayers.map((prayer) => {
                  const now = new Date();
                  const currentTime = now.getHours() * 60 + now.getMinutes();
                  const [hours, minutes] = prayer.time.split(':').map(Number);
                  const prayerTime = hours * 60 + minutes;
                  const isNext =
                    prayerTime > currentTime &&
                    prayerTimes.prayers.find((p) => {
                      const [h, m] = p.time.split(':').map(Number);
                      return h * 60 + m > currentTime;
                    })?.name === prayer.name;
                  const isPassed = prayerTime <= currentTime;

                  return (
                    <div
                      key={prayer.name}
                      className={`p-3 rounded-lg text-center transition-all duration-300 backdrop-blur-sm ${
                        isNext
                          ? 'bg-gradient-to-r from-pink-500 via-orange-500 to-blue-500 border-2 border-white/30 shadow-lg transform scale-105'
                          : isPassed
                          ? 'bg-gradient-to-r from-pink-100/40 via-orange-100/40 to-blue-100/40 dark:from-purple-800/30 dark:via-blue-800/30 dark:to-cyan-800/30 opacity-70 border border-pink-200/30 dark:border-purple-500/20'
                          : 'bg-gradient-to-r from-pink-100/60 via-orange-100/60 to-blue-100/60 dark:from-purple-800/40 dark:via-blue-800/40 dark:to-cyan-800/40 border border-pink-200/50 dark:border-purple-500/30 hover:shadow-md'
                      }`}
                    >
                      <div
                        className={`text-sm font-light mb-1 ${
                          isNext
                            ? 'text-white'
                            : 'text-pink-800 dark:text-purple-200'
                        }`}
                      >
                        {prayer.name}
                      </div>
                      <div
                        className={`text-lg font-mono font-light tracking-wide ${
                          isNext
                            ? 'text-white/90'
                            : 'text-orange-600 dark:text-cyan-300'
                        }`}
                      >
                        {prayer.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Content Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-light text-pink-800 dark:text-purple-200">
            Günün İçeriği
          </h2>
          
          {/* Günün Ayeti */}
          {!verseLoading && dailyVerse && (
            <DailyContentCard
              type="verse"
              arabic={dailyVerse.arabic}
              turkish={dailyVerse.turkish}
              reference={dailyVerse.reference}
              accentColor="gold"
            />
          )}
          
          {/* Günün Hadisi */}
          {!hadithLoading && dailyHadith && (
            <DailyContentCard
              type="hadith"
              arabic={dailyHadith.hadeeth || ""}
              turkish={dailyHadith.explanation || dailyHadith.title || ""}
              reference={dailyHadith.reference || "Hadis"}
              accentColor="turquoise"
            />
          )}
          
          {/* Günün Duası */}
          {!duaLoading && dailyDua && (
            <DailyContentCard
              type="prayer"
              arabic={dailyDua.ARABIC_TEXT}
              turkish={dailyDua.TURKISH_TEXT}
              reference={`Hisn Muslim - Dua ${dailyDua.ID}`}
              accentColor="soft-gold"
            />
          )}
        </div>

        {/* Middle Ad */}
        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="max-w-md mx-auto" />
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-pink-50/80 via-orange-50/80 to-blue-50/80 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-lg font-light text-pink-800 dark:text-purple-200">
              Hızlı Erişim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-16 flex-col space-y-2 bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 hover:from-pink-200/80 hover:via-orange-200/80 hover:to-blue-200/80 dark:hover:from-purple-700/60 dark:hover:via-blue-700/60 dark:hover:to-cyan-700/60 border border-pink-200/50 dark:border-purple-500/30"
                onClick={() => (window.location.href = '/qibla')}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">
                    🧭
                  </span>
                </div>
                <span className="text-sm font-light text-pink-800 dark:text-purple-200">
                  Kıble
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col space-y-2 bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 hover:from-pink-200/80 hover:via-orange-200/80 hover:to-blue-200/80 dark:hover:from-purple-700/60 dark:hover:via-blue-700/60 dark:hover:to-cyan-700/60 border border-pink-200/50 dark:border-purple-500/30"
                onClick={() => (window.location.href = '/quran')}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                  <Book className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-light text-pink-800 dark:text-purple-200">
                  Kur'an
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col space-y-2 bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 hover:from-pink-200/80 hover:via-orange-200/80 hover:to-blue-200/80 dark:hover:from-purple-700/60 dark:hover:via-blue-700/60 dark:hover:to-cyan-700/60 border border-pink-200/50 dark:border-purple-500/30"
                onClick={() => (window.location.href = '/duas')}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🤲</span>
                </div>
                <span className="text-sm font-light text-pink-800 dark:text-purple-200">
                  Dualar
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col space-y-2 bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 hover:from-pink-200/80 hover:via-orange-200/80 hover:to-blue-200/80 dark:hover:from-purple-700/60 dark:hover:via-blue-700/60 dark:hover:to-cyan-700/60 border border-pink-200/50 dark:border-purple-500/30"
                onClick={() => (window.location.href = '/settings')}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">
                    ⚙️
                  </span>
                </div>
                <span className="text-sm font-light text-pink-800 dark:text-purple-200">
                  Ayarlar
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="bg-gradient-to-r from-pink-200/80 via-orange-200/80 to-blue-200/80 dark:from-pink-900/40 dark:via-orange-900/40 dark:to-blue-900/40 border border-pink-300/70 dark:border-pink-700/70">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-light text-pink-900 dark:text-pink-100">
                  Bugünkü İstatistikler
                </h3>
                <p className="text-sm text-blue-800/90 dark:text-blue-200 font-light">
                  Namaz: 3/5 • Adım: 4,250 • Kur'an: 15 dk
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Ad */}
        {!user?.isPremium && (
          <AdPlaceholder type="banner" className="max-w-md mx-auto" />
        )}

        <div className="h-4"></div>
      </div>
    </div>
  );
};