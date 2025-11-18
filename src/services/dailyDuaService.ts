// src/services/dailyDuaService.ts
import dailyDuas from '../data/daily-duas-turkish.json';

export interface DuaDetail {
  ID: number;
  ARABIC_TEXT: string;
  TURKISH_TEXT: string;
}

export function getDailyDua(): DuaDetail | null {
  try {
    console.log('🔄 Günlük dua seçiliyor...');
    
    // Type assertion yerine type casting kullan
    const allDuas: DuaDetail[] = (dailyDuas as unknown) as DuaDetail[];
    
    // Veya alternatif olarak:
    // const allDuas: DuaDetail[] = JSON.parse(JSON.stringify(dailyDuas));
    
    console.log(`📚 Toplam ${allDuas.length} dua bulundu`);

    if (allDuas.length === 0) {
      console.log('❌ Hiç dua bulunamadı');
      return null;
    }

    // İlk duayı kontrol et
    const firstDua = allDuas[0];
    console.log('🔍 İlk dua ID:', firstDua.ID);
    console.log('🔍 İlk dua yapısı:', firstDua);

    // Günün tarihine göre dua seç
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    
    const dailyDua = allDuas[dayOfYear % allDuas.length];
    
    console.log(`📅 Gün ${dayOfYear}, Seçilen Dua ID: ${dailyDua.ID}`);
    
    return dailyDua;

  } catch (error) {
    console.error('❌ Günlük dua yüklenirken hata:', error);
    
    // Fallback dua
    return {
      ID: 75,
      ARABIC_TEXT: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
      TURKISH_TEXT: "Allah'ı hamd ile tesbih ederim"
    };
  }
}