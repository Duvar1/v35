export interface VerseDetail {
  arabic: string;
  turkish: string;
  reference: string;
}
export async function fetchDailyVerse(): Promise<VerseDetail> {
  try {
    // 1) ARAPÇA AYETİ ÇEK
    const arabicRes = await fetch("https://api.alquran.cloud/v1/ayah/random");
    const arabicJson = await arabicRes.json();

    if (!arabicJson.data) throw new Error("Arapça ayet alınamadı");

    const surahNumber = arabicJson.data.surah.number;
    const verseNumber = arabicJson.data.numberInSurah;

    // 2) TÜRKÇE MEAL JSON DOSYASI (tamamı tek istek)
    const turkishRes = await fetch(
      "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/tur-translation.json"
    );
    const turkishJson = await turkishRes.json();

    const turkishSurah = turkishJson[surahNumber];
    const turkishVerse = turkishSurah?.verses?.[verseNumber - 1]?.text;

    return {
      arabic: arabicJson.data.text,
      turkish: turkishVerse || "Türkçe meal bulunamadı.",
      reference: `${arabicJson.data.surah.englishName} ${verseNumber}. Ayet`
    };

  } catch (err) {
    console.error("fetchDailyVerse ERROR →", err);

    // Fallback (hiçbir API çalışmazsa)
    return {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      turkish: "Rahmân ve Rahîm olan Allah'ın adıyla.",
      reference: "Fatiha 1"
    };
  }
}
