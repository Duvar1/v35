// src/services/quranService.ts
interface VerseDetail {
  arabic: string;
  turkish: string;
  reference: string;
}

export async function fetchDailyRandomVerse(): Promise<VerseDetail> {
  // 1. Önce AlQuran.cloud API'sini dene (Türkçe mealli)
  try {
    console.log('AlQuran.cloud API deneniyor...');
    const response = await fetch('https://api.alquran.cloud/v1/ayah/random/tr.ozyuksel');
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      console.log('AlQuran.cloud başarılı!');
      return {
        arabic: data.data.text,
        turkish: data.data.translation || getFallbackTurkishTranslation(data.data.surah.number),
        reference: `${data.data.surah.englishName} ${data.data.numberInSurah}. Ayet`
      };
    }
  } catch (error) {
    console.log('AlQuran.cloud çalışmadı:', error);
  }

  // 2. Tanzil.net API'sini dene (Diyanet mealli)
  try {
    console.log('Tanzil.net API deneniyor...');
    const randomSurah = Math.floor(Math.random() * 114) + 1;
    const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/tur-diyanet/${randomSurah}.min.json`);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    if (data.chapter && data.chapter.length > 0) {
      const verses = data.chapter;
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      
      console.log('Tanzil.net başarılı!');
      return {
        arabic: randomVerse.text,
        turkish: randomVerse.translation || getFallbackTurkishTranslation(randomSurah),
        reference: `${data.name} ${randomVerse.verse}. Ayet`
      };
    }
  } catch (error) {
    console.log('Tanzil.net çalışmadı:', error);
  }

  // 3. Hiçbiri çalışmazsa fallback kullan
  console.log('Tüm APIler çalışmadı, fallback kullanılıyor...');
  return getFallbackVerse();
}

// Günün ayeti için
export async function fetchDailyVerse(): Promise<VerseDetail> {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));  
  
  // Önce API'den rastgele ayet almayı dene
  try {
    const randomVerse = await fetchDailyRandomVerse();
    return randomVerse;
  } catch (error) {
    console.error('APIler çalışmadı, fallback kullanılıyor:', error);
    // API çalışmazsa güne özel fallback ayetler
    return getDailyFallbackVerse(dayOfYear);
  }
}

// Günlük fallback ayetler
function getDailyFallbackVerse(dayOfYear: number): VerseDetail {
  const fallbackVerses = [
    {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      turkish: "Rahmân ve Rahîm olan Allah'ın adıyla.",
      reference: "Fatiha Suresi 1. Ayet"
    },
    {
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      turkish: "Hamd, Âlemlerin Rabbi Allah'a mahsustur.",
      reference: "Fatiha Suresi 2. Ayet"
    },
    {
      arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      turkish: "Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi cehennem azabından koru.",
      reference: "Bakara Suresi 201. Ayet"
    },
    {
      arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      turkish: "Gerçekten her zorlukla beraber bir kolaylık vardır.",
      reference: "İnşirah Suresi 6. Ayet"
    },
    {
      arabic: "وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
      turkish: "Birbirlerine hakkı ve sabrı tavsiye ederler.",
      reference: "Asr Suresi 3. Ayet"
    },
    {
      arabic: "وَأَنِيبُوا إِلَىٰ رَبِّكُمْ وَأَسْلِمُوا لَهُ",
      turkish: "Rabbinize yönelin ve O'na teslim olun.",
      reference: "Zümer Suresi 54. Ayet"
    },
    {
      arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
      turkish: "Öyleyse siz beni anın ki ben de sizi anayım. Bana şükredin, sakın bana nankörlük etmeyin.",
      reference: "Bakara Suresi 152. Ayet"
    }
  ];
  
  return fallbackVerses[dayOfYear % fallbackVerses.length];
}

// Fallback Türkçe çeviriler
function getFallbackTurkishTranslation(surahNumber: number): string {
  const fallbackTranslations: { [key: number]: string } = {
    1: "Rahmân ve Rahîm olan Allah'ın adıyla.",
    2: "Hamd, Âlemlerin Rabbi Allah'a mahsustur.",
    112: "De ki: O, Allah'tır, bir tektir.",
    113: "De ki: Ben, ağaran sabahın Rabbine sığınırım.",
    114: "De ki: Ben, insanların Rabbine sığınırım."
  };
  
  return fallbackTranslations[surahNumber] || "Allah'ın rahmeti ve bereketi üzerinize olsun.";
}

// Genel fallback
function getFallbackVerse(): VerseDetail {
  return {
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    turkish: "Rahmân ve Rahîm olan Allah'ın adıyla.",
    reference: "Fatiha Suresi 1. Ayet"
  };
}