import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Star, StarOff, Bookmark, Loader2 } from 'lucide-react';

// --- API Tarafından Gelen Veri Tipleri ---
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

// Yer imi veri yapısı
interface BookmarkedVerse {
  surahId: number;
  verseId: number;
  surahName: string;
  arabicName: string;
  verseNumber: number;
  arabicText: string;
  turkishText: string;
}

const TURKISH_TRANSLATION_EDITION = 'tr.diyanet';
const ARABIC_TEXT_EDITION = 'quran-simple-clean';

export const QuranPage: React.FC = () => {
  const [quranMeta, setQuranMeta] = useState<SurahMeta[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<SelectedSurah | null>(null);
  const [loading, setLoading] = useState(true);
  const [surahDetailLoading, setSurahDetailLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  
  // Yer imlerini düzgün bir şekilde yönet
  const [bookmarkedVerses, setBookmarkedVerses] = useState<BookmarkedVerse[]>(
    JSON.parse(localStorage.getItem('bookmarkedVerses') || '[]')
  );

  // --- API İŞLEMLERİ: SURE LİSTESİNİ ÇEKME ---
  useEffect(() => {
    const fetchQuranMeta = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.alquran.cloud/v1/meta');
        const data = await response.json();

        if (data.data && data.data.surahs && data.data.surahs.references) {
          const formattedMeta: SurahMeta[] = data.data.surahs.references.map((s: any) => ({
            id: s.number,
            name: s.englishName, 
            arabicName: s.name,
            verseCount: s.numberOfAyahs,
          }));
          setQuranMeta(formattedMeta);
        } else {
            console.error("API'den sure meta verisi gelmedi:", data);
        }
      } catch (error) {
        console.error("Sure listesi çekilirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuranMeta();
  }, []);
  
  // --- API İŞLEMLERİ: SURE DETAYLARINI ÇEKME ---
  const fetchSurahDetail = useCallback(async (surahNumber: number) => {
    setSurahDetailLoading(true);
    setSelectedSurah(null);

    try {
      const arabicPromise = fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${ARABIC_TEXT_EDITION}`).then(res => res.json());
      const turkishPromise = fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${TURKISH_TRANSLATION_EDITION}`).then(res => res.json());
      
      const [arabicData, turkishData] = await Promise.all([arabicPromise, turkishPromise]);
      
      if (arabicData.status === 404 || turkishData.status === 404) {
          console.error("Sure detayı bulunamadı.");
          return;
      }
      
      const arabicAyahs: ApiAyah[] = arabicData.data?.ayahs || [];
      const turkishAyahs: ApiAyah[] = turkishData.data?.ayahs || [];

      const verses = arabicAyahs.map((arabicAyah, index) => {
        const turkishAyah = turkishAyahs[index];
        return {
          id: arabicAyah.number, 
          arabic: arabicAyah.text,
          turkish: turkishAyah ? turkishAyah.text : 'Meal bulunamadı.',
          verseNumber: arabicAyah.numberInSurah,
        };
      });

      const surahMeta = quranMeta.find(s => s.id === surahNumber);
      
      if (surahMeta) {
          setSelectedSurah({
              ...surahMeta,
              verses: verses
          });
      }

    } catch (error) {
      console.error(`Sure ayetleri çekilirken hata:`, error);
    } finally {
      setSurahDetailLoading(false);
    }
  }, [quranMeta]);

  // --- YER İMİ YÖNETİMİ ---
  const toggleBookmark = (surahId: number, verseId: number, arabicText: string, turkishText: string, verseNumber: number) => {
    const existingIndex = bookmarkedVerses.findIndex(
      item => item.surahId === surahId && item.verseId === verseId
    );

    let newBookmarks: BookmarkedVerse[];
    
    if (existingIndex > -1) {
      // Kaldır
      newBookmarks = bookmarkedVerses.filter(
        item => !(item.surahId === surahId && item.verseId === verseId)
      );
    } else {
      // Ekle
      const surah = quranMeta.find(s => s.id === surahId);
      if (!surah) return;
      
      newBookmarks = [
        ...bookmarkedVerses,
        {
          surahId,
          verseId,
          surahName: surah.name,
          arabicName: surah.arabicName,
          verseNumber,
          arabicText,
          turkishText
        }
      ];
    }
    
    setBookmarkedVerses(newBookmarks);
    localStorage.setItem('bookmarkedVerses', JSON.stringify(newBookmarks));
  };

  const isBookmarked = (surahId: number, verseId: number) => {
    return bookmarkedVerses.some(item => item.surahId === surahId && item.verseId === verseId);
  };

  const handleSurahClick = (surah: SurahMeta) => {
    fetchSurahDetail(surah.id);
  };

  // Yer iminden sureye geçiş (scroll ile)
  const handleBookmarkClick = (bookmark: BookmarkedVerse) => {
    const surah = quranMeta.find(s => s.id === bookmark.surahId);
    if (surah) {
      fetchSurahDetail(surah.id).then(() => {
        // Ayete scroll etmek için biraz bekle
        setTimeout(() => {
          const verseElement = document.getElementById(`verse-${bookmark.verseId}`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight efekti
            verseElement.classList.add('bg-orange-100', 'dark:bg-orange-900');
            setTimeout(() => {
              verseElement.classList.remove('bg-orange-100', 'dark:bg-orange-900');
            }, 2000);
          }
        }, 500);
      });
      setShowBookmarks(false);
    }
  };
  
  // --- RENDER BÖLÜMÜ ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">Sure listesi yükleniyor...</p>
      </div>
    );
  }

  if (surahDetailLoading) {
    const surahName = quranMeta.find(s => s.id === selectedSurah?.id)?.name || "Sure";
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-pink-500 animate-spin" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">"{surahName}" ayetleri yükleniyor...</p>
      </div>
    );
  }

  // --- Sure Okuma Görünümü ---
  if (selectedSurah) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 p-4 space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-sky-50/90 dark:bg-slate-900/90 py-2 backdrop-blur-sm z-10">
          <Button 
            onClick={() => setSelectedSurah(null)}
            variant="outline"
            className="bg-sky-100/80 border-sky-300 dark:bg-slate-800 dark:border-slate-600 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-slate-700"
          >
            ← Geri
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {selectedSurah.name}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {selectedSurah.arabicName}
            </p>
          </div>
          <div className="w-16"></div>
        </div>

        <div className="space-y-4">
          {selectedSurah.verses.map((verse) => (
            <Card 
              key={verse.id} 
              id={`verse-${verse.id}`}
              className="border-l-4 border-l-pink-400 bg-gradient-to-r from-sky-100/80 to-orange-100/80 dark:from-slate-800/80 dark:to-orange-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 border-pink-300 dark:border-pink-700"
                  >
                    {verse.verseNumber}. Ayet
                  </Badge>
                  <Button
                    onClick={() => toggleBookmark(selectedSurah.id, verse.id, verse.arabic, verse.turkish, verse.verseNumber)}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-pink-100 dark:hover:bg-pink-900"
                  >
                    {isBookmarked(selectedSurah.id, verse.id) ? (
                      <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
                    ) : (
                      <StarOff className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    )}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <p className="text-right text-2xl leading-relaxed font-arabic text-slate-800 dark:text-slate-50">
                    {verse.arabic}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {verse.turkish}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- Yer İmleri Görünümü ---
  if (showBookmarks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 p-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            onClick={() => setShowBookmarks(false)}
            variant="outline"
            className="bg-sky-100/80 border-sky-300 dark:bg-slate-800 dark:border-slate-600 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-slate-700"
          >
            ← Geri
          </Button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Yer İmlerim ({bookmarkedVerses.length})
          </h1>
          <div className="w-16"></div>
        </div>

        <div className="space-y-3">
          {bookmarkedVerses.length === 0 ? (
            <Card className="bg-gradient-to-r from-sky-100/80 to-pink-100/80 dark:from-slate-800/80 dark:to-pink-900/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Bookmark className="h-8 w-8 text-pink-500 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  Henüz yer imi eklenmiş ayetiniz bulunmamaktadır.
                </p>
              </CardContent>
            </Card>
          ) : (
            bookmarkedVerses.map((bookmark) => (
              <Card 
                key={`${bookmark.surahId}-${bookmark.verseId}`} 
                className="cursor-pointer hover:shadow-xl transition-all bg-gradient-to-r from-orange-100/80 to-pink-100/80 dark:from-orange-900/80 dark:to-pink-900/80 backdrop-blur-sm border-l-4 border-l-orange-400 hover:border-l-pink-400"
                onClick={() => handleBookmarkClick(bookmark)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-orange-700 dark:text-orange-300">
                        {bookmark.surahName} - {bookmark.verseNumber}. Ayet
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {bookmark.arabicName}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(bookmark.surahId, bookmark.verseId, bookmark.arabicText, bookmark.turkishText, bookmark.verseNumber);
                      }}
                      variant="ghost"
                      size="sm"
                      className="hover:bg-pink-100 dark:hover:bg-pink-900"
                    >
                      <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
                    </Button>
                  </div>
                  
                  {/* Ayet içeriği gösterimi */}
                  <div className="space-y-2">
                    <p className="text-right text-lg leading-relaxed font-arabic text-slate-800 dark:text-slate-200">
                      {bookmark.arabicText}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {bookmark.turkishText}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>📍 Tıklayarak ayete git</span>
                    <span>Sure: {bookmark.surahId}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- Sure Listesi Görünümü (Default) ---
  const filteredSurahs = quranMeta.filter(surah =>
    surah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.arabicName.includes(searchTerm)
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50 dark:from-slate-900 dark:via-blue-950 dark:to-orange-950 p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          Kur'an-ı Kerim 📖
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Sure seçin ve okumaya başlayın
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 dark:text-orange-500 h-4 w-4" />
        <Input
          placeholder="Sure ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-sky-100/80 dark:bg-slate-800/80 backdrop-blur-sm border-orange-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:border-orange-500 dark:focus:border-orange-500"
        />
      </div>

      {/* Bookmarked Verses Button/Info */}
      {bookmarkedVerses.length > 0 && (
        <Card 
          className="cursor-pointer bg-gradient-to-r from-pink-100/80 to-orange-100/80 dark:from-pink-900/80 dark:to-orange-900/80 backdrop-blur-sm border-pink-300 dark:border-pink-700 hover:shadow-lg transition-all"
          onClick={() => setShowBookmarks(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bookmark className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <span className="text-base font-medium text-pink-700 dark:text-pink-300">
                  Yer İmlerim ({bookmarkedVerses.length} ayet)
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-800">
                Görüntüle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surah List */}
      <div className="space-y-3">
        {filteredSurahs.map((surah) => (
          <Card 
            key={surah.id} 
            className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-sky-100/80 to-blue-100/80 dark:from-sky-900/80 dark:to-blue-900/80 backdrop-blur-sm hover:from-sky-200/80 hover:to-blue-200/80 dark:hover:from-sky-800/80 dark:hover:to-blue-800/80"
            onClick={() => handleSurahClick(surah)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-200 to-pink-200 dark:from-orange-800 dark:to-pink-800 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                      {surah.id}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                      {surah.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {surah.arabicName}
                    </p>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white">
                    {surah.verseCount} Ayet
                  </Badge>
                  <div className="flex items-center justify-end">
                    <BookOpen className="h-4 w-4 text-pink-500 mr-1" />
                    <span className="text-xs text-pink-600 dark:text-pink-400">Oku</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSurahs.length === 0 && (
        <Card className="bg-gradient-to-r from-sky-100/80 to-orange-100/80 dark:from-sky-900/80 dark:to-orange-900/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Aradığınız sure bulunamadı
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};