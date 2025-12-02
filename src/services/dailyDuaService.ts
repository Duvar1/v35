export interface DuaDetail {
  ID: number;
  ARABIC_TEXT: string;
  TURKISH_TEXT: string;
}

export async function getDailyDua(): Promise<DuaDetail | null> {
  try {
    console.log("🔄 Günlük dua JSON fetch ediliyor...");

    const res = await fetch("/data/daily-duas-turkish.json");
    const allDuas: DuaDetail[] = await res.json();

    console.log("📚 JSON boyutu:", allDuas.length);

    if (!allDuas || allDuas.length === 0) return null;

    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const day = Math.floor((today.getTime() - start.getTime()) / 86400000);

    const selected = allDuas[day % allDuas.length];

    console.log("📅 Seçilen dua:", selected);
    return selected;

  } catch (err) {
    console.error("❌ Dua JSON hata:", err);
    return {
      ID: 75,
      ARABIC_TEXT: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
      TURKISH_TEXT: "Allah'ı hamd ile tesbih ederim"
    };
  }
}
