export interface VerseDetail {
  arabic: string;
  turkish: string;
  reference: string;
}

export async function fetchDailyVerse(): Promise<VerseDetail> {
  try {
    let verseData = null;

    while (!verseData) {
      const randomAyah = Math.floor(Math.random() * 6236) + 1;

      const res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,tr.diyanet`
      );
      const json = await res.json();

      const arabic = json.data[0]?.text;
      const turkish = json.data[1]?.text;
      const surah = json.data[0]?.surah?.englishName;
      const verse = json.data[0]?.numberInSurah;

      if (!arabic) continue;

      // *** KELİME SAYISI FİLTRESİ (Arapça metin) ***
      const wordCount = arabic.trim().split(/\s+/).length;

      if (wordCount >= 5 && wordCount <= 10) {
        verseData = {
          arabic,
          turkish,
          reference: `${surah} ${verse}. Ayet`,
        };
      }
    }

    return verseData;

  } catch (err) {
    console.error("Ayet çekme hatası:", err);
    return {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      turkish: "Rahman ve Rahim olan Allah'ın adıyla.",
      reference: "Fatiha 1",
    };
  }
}
