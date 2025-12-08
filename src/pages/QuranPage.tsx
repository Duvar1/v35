// src/pages/QuranPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeIn, pop, staggerContainer } from "@/lib/motion";

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
const TURKISH_TRANSLATION = "tr.diyanet";
const ARABIC_TEXT = "quran-simple-clean";

// -------------------------------------------------------------
// PAGE COMPONENT
// -------------------------------------------------------------

export const QuranPage: React.FC = () => {
  const [quranMeta, setQuranMeta] = useState<SurahMeta[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<SelectedSurah | null>(null);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSurah, setLoadingSurah] = useState(false);

  const [search, setSearch] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);

  const [bookmarks, setBookmarks] = useState<BookmarkedVerse[]>(
    JSON.parse(localStorage.getItem("bookmarkedVerses") || "[]")
  );

  // -------------------------------------------------------------
  // FETCH META
  // -------------------------------------------------------------
  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
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
      }
      setLoadingMeta(false);
    };

    loadMeta();
  }, []);

  // -------------------------------------------------------------
  // FETCH SURAH DETAIL
  // -------------------------------------------------------------
  const fetchSurah = useCallback(
    async (surahId: number) => {
      setLoadingSurah(true);
      setSelectedSurah(null);

      try {
        const [arabicRes, turkishRes] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${ARABIC_TEXT}`),
          fetch(
            `https://api.alquran.cloud/v1/surah/${surahId}/${TURKISH_TRANSLATION}`
          ),
        ]);

        const arabicJson = await arabicRes.json();
        const turkishJson = await turkishRes.json();

        const arabicAyahs = arabicJson.data.ayahs;
        const turkishAyahs = turkishJson.data.ayahs;

        const verses = arabicAyahs.map((arabic: ApiAyah, i: number) => ({
          id: arabic.number,
          arabic: arabic.text,
          turkish: turkishAyahs[i]?.text || "",
          verseNumber: arabic.numberInSurah,
        }));

        const meta = quranMeta.find((s) => s.id === surahId);
        if (meta) {
          setSelectedSurah({ ...meta, verses });
        }
      } catch (err) {
        console.error("Ayetler alınamadı:", err);
      }

      setLoadingSurah(false);
    },
    [quranMeta]
  );

  // -------------------------------------------------------------
  // BOOKMARK LOGIC
  // -------------------------------------------------------------
  const toggleBookmark = (
    surahId: number,
    verseId: number,
    verseNumber: number,
    arabic: string,
    turkish: string
  ) => {
    const exists = bookmarks.some(
      (b) => b.surahId === surahId && b.verseId === verseId
    );

    let updated: BookmarkedVerse[];

    if (exists) {
      updated = bookmarks.filter(
        (b) => !(b.surahId === surahId && b.verseId === verseId)
      );
    } else {
      const meta = quranMeta.find((s) => s.id === surahId);
      if (!meta) return;

      updated = [
        ...bookmarks,
        {
          surahId,
          verseId,
          arabicText: arabic,
          turkishText: turkish,
          verseNumber,
          surahName: meta.name,
          arabicName: meta.arabicName,
        },
      ];
    }

    setBookmarks(updated);
    localStorage.setItem("bookmarkedVerses", JSON.stringify(updated));
  };

  const isBookmarked = (surahId: number, verseId: number) =>
    bookmarks.some((b) => b.surahId === surahId && b.verseId === verseId);

  const openBookmark = (bm: BookmarkedVerse) => {
    fetchSurah(bm.surahId).then(() => {
      setTimeout(() => {
        const el = document.getElementById(`verse-${bm.verseId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("bg-orange-200");

          setTimeout(() => {
            el.classList.remove("bg-orange-200");
          }, 2000);
        }
      }, 600);
    });

    setShowBookmarks(false);
  };

  // -------------------------------------------------------------
  // RENDER: LOADING META
  // -------------------------------------------------------------
  if (loadingMeta) {
    return (
      <motion.div
        variants={fadeIn(0, 20)}
        initial="hidden"
        animate="show"
        className="min-h-screen flex flex-col items-center justify-center
        bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50
        dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
      >
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Sure listesi yükleniyor...
        </p>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LOADING SURAH
  // -------------------------------------------------------------
  if (loadingSurah) {
    return (
      <motion.div
        variants={fadeIn(0, 20)}
        initial="hidden"
        animate="show"
        className="min-h-screen flex flex-col items-center justify-center
        bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
      >
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Ayetler yükleniyor...
        </p>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SELECTED SURAH VIEW
  // -------------------------------------------------------------

  if (selectedSurah) {
    return (
      <motion.div
        variants={fadeIn(0, 15)}
        initial="hidden"
        animate="show"
        className="min-h-screen p-4 space-y-6 
        bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 
        dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
      >
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white/70 dark:bg-black/40 backdrop-blur-md p-2 rounded-md z-10">
          <Button
            variant="outline"
            onClick={() => setSelectedSurah(null)}
            className="text-sky-600 dark:text-sky-300"
          >
            ← Geri
          </Button>

          <div className="text-center">
            <h1 className="text-xl font-bold dark:text-white">
              {selectedSurah.name}
            </h1>
            <p className="text-sm dark:text-gray-300">
              {selectedSurah.arabicName}
            </p>
          </div>

          <div className="w-16"></div>
        </div>

        {/* Ayet Listesi */}
        <div className="space-y-4">
          {selectedSurah.verses.map((v) => (
            <motion.div
              key={v.id}
              id={`verse-${v.id}`}
              variants={fadeIn(0.1, 15)}
              initial="hidden"
              animate="show"
            >
              <Card className="bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-orange-200 dark:border-orange-900 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge>{v.verseNumber}. Ayet</Badge>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toggleBookmark(
                          selectedSurah.id,
                          v.id,
                          v.verseNumber,
                          v.arabic,
                          v.turkish
                        )
                      }
                    >
                      {isBookmarked(selectedSurah.id, v.id) ? (
                        <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
                      ) : (
                        <StarOff className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  <p className="text-right text-2xl leading-relaxed dark:text-white">
                    {v.arabic}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300">
                    {v.turkish}
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
  // RENDER: BOOKMARK LIST
  // -------------------------------------------------------------

  if (showBookmarks) {
    return (
      <motion.div
        variants={fadeIn(0, 15)}
        initial="hidden"
        animate="show"
        className="min-h-screen p-4 space-y-6 bg-gradient-to-br 
        from-sky-50 via-blue-50 to-orange-50 
        dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
      >
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setShowBookmarks(false)}>
            ← Geri
          </Button>

          <h1 className="text-xl font-bold dark:text-white">
            Yer İmlerim ({bookmarks.length})
          </h1>

          <div className="w-16" />
        </div>

        {bookmarks.length === 0 && (
          <Card className="p-6 mt-6 text-center">
            <Bookmark className="h-10 w-10 mx-auto text-orange-500" />
            <p className="mt-4 dark:text-gray-300">
              Henüz yer imi eklenmiş ayetiniz yok.
            </p>
          </Card>
        )}

        <div className="space-y-4">
          {bookmarks.map((bm) => (
            <Card
              key={bm.verseId + "-" + bm.surahId}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => openBookmark(bm)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold">
                      {bm.surahName} — {bm.verseNumber}. Ayet
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bm.arabicName}
                    </p>
                  </div>

                  <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
                </div>

                <p className="text-right text-lg font-arabic dark:text-white">
                  {bm.arabicText}
                </p>
                <p className="text-sm dark:text-gray-300 line-clamp-2">
                  {bm.turkishText}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN SURAH LIST
  // -------------------------------------------------------------

  const filtered = quranMeta.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.arabicName.includes(search)
  );

  return (
    <motion.div
      variants={fadeIn(0, 15)}
      initial="hidden"
      animate="show"
      className="min-h-screen p-4 space-y-6 bg-gradient-to-br 
      from-sky-50 via-blue-50 to-orange-50 
      dark:from-slate-900 dark:via-blue-950 dark:to-orange-950"
    >
      <h1 className="text-center text-2xl font-extrabold dark:text-white">
        Kur'an-ı Kerim 📖
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400">
        Sure seç ve okumaya başla
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sure ara..."
          className="pl-10"
        />
      </div>

      {/* Bookmarks Button */}
      {bookmarks.length > 0 && (
        <Card
          onClick={() => setShowBookmarks(true)}
          className="cursor-pointer hover:shadow-md transition-all"
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Bookmark className="h-5 w-5 text-orange-600" />
              <span>Yer İmlerim ({bookmarks.length})</span>
            </div>
            <Button variant="ghost" size="sm">
              Görüntüle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sure list */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <Card
            key={s.id}
            onClick={() => fetchSurah(s.id)}
            className="cursor-pointer hover:shadow-md transition-all"
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center shadow">
                  <span className="font-bold text-orange-700">{s.id}</span>
                </div>

                <div>
                  <h2 className="font-semibold dark:text-white">{s.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {s.arabicName}
                  </p>
                </div>
              </div>

              <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                {s.verseCount} Ayet
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Aradığın sure bulunamadı.
        </p>
      )}
    </motion.div>
  );
};
