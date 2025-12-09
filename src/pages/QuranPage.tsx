// src/pages/QuranPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Search,
  BookOpen,
  Star,
  StarOff,
  Bookmark,
  Loader2,
} from "lucide-react";

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------
interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
}

interface SurahMeta {
  id: number;
  name: string;
  arabicName: string;
  verseCount: number;
}

interface SelectedSurah extends SurahMeta {
  verses: {
    id: number;
    arabic: string;
    turkish: string;
    verseNumber: number;
  }[];
}

interface BookmarkedVerse {
  surahId: number;
  verseId: number;
  surahName: string;
  arabicName: string;
  verseNumber: number;
  arabicText: string;
  turkishText: string;
}

// -------------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------------
const ARABIC_TEXT = "quran-simple-clean";
const TURKISH_TRANSLATION = "tr.diyanet";

const STORAGE = {
  BOOKMARKS: "quran_bookmarks",
  SEARCH: "quran_search",
};

// -------------------------------------------------------------
// MAIN PAGE
// -------------------------------------------------------------
export const QuranPage: React.FC = () => {
  // -------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------
  const [quranMeta, setQuranMeta] = useState<SurahMeta[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSurah, setLoadingSurah] = useState(false);

  const [search, setSearch] = useState(() => {
    return localStorage.getItem(STORAGE.SEARCH) || "";
  });

  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<SelectedSurah | null>(null);

  const [bookmarks, setBookmarks] = useState<BookmarkedVerse[]>(() => {
    const saved = localStorage.getItem(STORAGE.BOOKMARKS);
    return saved ? JSON.parse(saved) : [];
  });

  // -------------------------------------------------------------
  // ORIENTATION PROTECTION
  // -------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem('last_visited_page', '/quran');
    
    const handleOrientationChange = () => {
      console.log('QuranPage: Orientation changed, page preserved');
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // -------------------------------------------------------------
  // SEARCH STATE SAVE
  // -------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem(STORAGE.SEARCH, search);
  }, [search]);

  // -------------------------------------------------------------
  // FETCH META (SURE LIST)
  // -------------------------------------------------------------
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await fetch("https://api.alquran.cloud/v1/meta");
        const data = await res.json();

        const list = data.data.surahs.references.map((s: any) => ({
          id: s.number,
          name: s.englishName,
          arabicName: s.name,
          verseCount: s.numberOfAyahs,
        }));

        setQuranMeta(list);
      } catch (err) {
        console.error("Sure listesi yüklenemedi:", err);
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, []);

  // -------------------------------------------------------------
  // FETCH SURAH DETAIL
  // -------------------------------------------------------------
  const fetchSurah = useCallback(async (surahId: number) => {
    setLoadingSurah(true);
    setSelectedSurah(null);

    try {
      const [arabicRes, turkishRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${ARABIC_TEXT}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${TURKISH_TRANSLATION}`),
      ]);

      const arabicJson = await arabicRes.json();
      const turkishJson = await turkishRes.json();

      const verses = arabicJson.data.ayahs.map((ayah: ApiAyah, i: number) => ({
        id: ayah.number,
        arabic: ayah.text,
        turkish: turkishJson.data.ayahs[i]?.text || "",
        verseNumber: ayah.numberInSurah,
      }));

      const meta = quranMeta.find((s) => s.id === surahId);
      if (!meta) {
        console.error("Sure meta bilgisi bulunamadı:", surahId);
        return;
      }

      setSelectedSurah({ ...meta, verses });
      
      // Scroll to top when surah opens
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Sure yüklenemedi:", err);
    } finally {
      setLoadingSurah(false);
    }
  }, [quranMeta]);

  // -------------------------------------------------------------
  // BOOKMARK FUNCTIONS
  // -------------------------------------------------------------
  const toggleBookmark = useCallback((surah: SelectedSurah, verse: any) => {
    const existingIndex = bookmarks.findIndex(
      (b) => b.surahId === surah.id && b.verseId === verse.id
    );

    let newBookmarks;
    if (existingIndex >= 0) {
      // Remove bookmark
      newBookmarks = bookmarks.filter((_, index) => index !== existingIndex);
    } else {
      // Add bookmark
      newBookmarks = [
        ...bookmarks,
        {
          surahId: surah.id,
          verseId: verse.id,
          surahName: surah.name,
          arabicName: surah.arabicName,
          verseNumber: verse.verseNumber,
          arabicText: verse.arabic,
          turkishText: verse.turkish,
        },
      ];
    }

    setBookmarks(newBookmarks);
    localStorage.setItem(STORAGE.BOOKMARKS, JSON.stringify(newBookmarks));
  }, [bookmarks]);

  const isBookmarked = useCallback((surahId: number, verseId: number) => {
    return bookmarks.some(b => b.surahId === surahId && b.verseId === verseId);
  }, [bookmarks]);

  const openBookmark = useCallback((bookmark: BookmarkedVerse) => {
    fetchSurah(bookmark.surahId).then(() => {
      setTimeout(() => {
        const el = document.getElementById(`verse-${bookmark.verseId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          
          // Highlight effect
          el.classList.add("bg-orange-200", "dark:bg-orange-900/50");
          setTimeout(() => {
            el.classList.remove("bg-orange-200", "dark:bg-orange-900/50");
          }, 2000);
        }
      }, 500);
    });
    setShowBookmarks(false);
  }, [fetchSurah]);

  // DÜZELTME: Yer imlerinde de toggleBookmark kullan
  const toggleBookmarkInBookmarksPage = useCallback((bookmark: BookmarkedVerse) => {
    const existingIndex = bookmarks.findIndex(
      (b) => b.surahId === bookmark.surahId && b.verseId === bookmark.verseId
    );

    let newBookmarks;
    if (existingIndex >= 0) {
      // Remove bookmark
      newBookmarks = bookmarks.filter((_, index) => index !== existingIndex);
    } else {
      // Add bookmark (bu durum normalde olmaz, ama güvenlik için)
      newBookmarks = [...bookmarks, bookmark];
    }

    setBookmarks(newBookmarks);
    localStorage.setItem(STORAGE.BOOKMARKS, JSON.stringify(newBookmarks));
  }, [bookmarks]);

  // -------------------------------------------------------------
  // LOADING SCREENS
  // -------------------------------------------------------------
  if (loadingMeta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">Sure listesi yükleniyor...</p>
      </div>
    );
  }

  if (loadingSurah) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950">
        <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">Ayetler yükleniyor...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SELECTED SURAH VIEW
  // -------------------------------------------------------------
  if (selectedSurah) {
    return (
      <motion.div
        variants={fadeIn(0, 10)}
        initial="hidden"
        animate="show"
        className="min-h-screen p-4 space-y-5 bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
      >
        {/* HEADER */}
        <div className="sticky top-0 p-3 rounded-lg bg-white/80 dark:bg-black/60 backdrop-blur-md flex justify-between items-center z-20 mb-4">
          <Button
            variant="outline"
            onClick={() => setSelectedSurah(null)}
            className="text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-700"
          >
            ← Geri
          </Button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {selectedSurah.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedSurah.arabicName}
            </p>
          </div>

          <div className="w-14" />
        </div>

        {/* VERSES */}
        <div className="space-y-4">
          {selectedSurah.verses.map((verse) => (
            <motion.div
              key={verse.id}
              variants={fadeIn(0.05, 5)}
              initial="hidden"
              animate="show"
            >
              <Card
                id={`verse-${verse.id}`}
                className="bg-white/70 dark:bg-black/40 border border-orange-200/50 dark:border-orange-900/30 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                      {verse.verseNumber}. Ayet
                    </Badge>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(selectedSurah, verse);
                      }}
                      className="hover:bg-transparent p-1"
                    >
                      {isBookmarked(selectedSurah.id, verse.id) ? (
                        <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
                      ) : (
                        <StarOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </Button>
                  </div>

                  <p className="text-right text-2xl leading-relaxed font-arabic text-gray-900 dark:text-white">
                    {verse.arabic}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 italic border-l-4 border-orange-300 dark:border-orange-700 pl-3 py-1">
                    {verse.turkish}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // BOOKMARKS VIEW
  // -------------------------------------------------------------
  if (showBookmarks) {
    return (
      <motion.div
        variants={fadeIn(0, 10)}
        initial="hidden"
        animate="show"
        className="min-h-screen p-4 space-y-6 bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={() => setShowBookmarks(false)}
            className="text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-700"
          >
            ← Geri
          </Button>

          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Yer İmlerim ({bookmarks.length})
          </h1>

          <div className="w-14" />
        </div>

        {bookmarks.length === 0 ? (
          <Card className="p-8 text-center bg-white/70 dark:bg-black/40">
            <Bookmark className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Henüz yer imi yok
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ayetlerdeki yıldız simgesine tıklayarak yer imi ekleyebilirsiniz
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <Card
                key={`${bookmark.surahId}-${bookmark.verseId}`}
                className="bg-white/70 dark:bg-black/40 border border-orange-200/50 dark:border-orange-900/30 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => openBookmark(bookmark)}
                    >
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {bookmark.surahName} — {bookmark.verseNumber}. Ayet
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {bookmark.arabicName}
                      </p>
                    </div>
                    
                    {/* DÜZELTME: Kaldır butonu yerine yıldız koy */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmarkInBookmarksPage(bookmark);
                      }}
                      className="hover:bg-transparent p-1 ml-2"
                    >
                      <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
                    </Button>
                  </div>

                  <div 
                    className="cursor-pointer"
                    onClick={() => openBookmark(bookmark)}
                  >
                    <p className="text-right text-lg font-arabic text-gray-900 dark:text-white mb-2">
                      {bookmark.arabicText}
                    </p>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {bookmark.turkishText}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // MAIN SURAH LIST (DEFAULT VIEW - HER ZAMAN BU AÇILSIN)
  // -------------------------------------------------------------
  const filteredSurahs = quranMeta.filter(
    (surah) =>
      surah.name.toLowerCase().includes(search.toLowerCase()) ||
      surah.arabicName.includes(search)
  );

  return (
    <motion.div
      variants={fadeIn(0, 10)}
      initial="hidden"
      animate="show"
      className="min-h-screen p-4 space-y-6 bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
    >
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Kur'an-ı Kerim 📖
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sure seç ve okumaya başla
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sure ara (İngilizce veya Arapça)..."
          className="pl-10 border-orange-300 dark:border-orange-700 focus:border-orange-500 dark:focus:border-orange-500"
        />
      </div>

      {/* BOOKMARKS BUTTON */}
      {bookmarks.length > 0 && (
        <Card
          onClick={() => setShowBookmarks(true)}
          className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/30 dark:to-pink-900/30 border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                <Bookmark className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  Yer İmlerim
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {bookmarks.length} ayet kayıtlı
                </p>
              </div>
            </div>
            <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardContent>
        </Card>
      )}

      {/* SURAH LIST - DÜZELTME: Üstteki yıldız sembolü KALDIRILDI */}
      <div className="space-y-3">
        {filteredSurahs.map((surah) => (
          <Card
            key={surah.id}
            onClick={() => fetchSurah(surah.id)}
            className="bg-white/70 dark:bg-black/40 border border-sky-200/50 dark:border-sky-800/30 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <span className="text-white font-bold">{surah.id}</span>
                    </div>
                    {/* DÜZELTME: Bu yıldız sembolü KALDIRILDI */}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {surah.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {surah.arabicName}
                    </p>
                  </div>
                </div>

                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  {surah.verseCount} Ayet
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSurahs.length === 0 && (
        <Card className="p-6 text-center bg-white/70 dark:bg-black/40">
          <p className="text-gray-600 dark:text-gray-400">
            "{search}" ile eşleşen sure bulunamadı
          </p>
        </Card>
      )}
    </motion.div>
  );
};