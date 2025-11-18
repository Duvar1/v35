// src/services/prayerTimesService.ts
import { PrayerTimes, PrayerTime } from '../store/prayerStore';
import { toast } from "sonner";

export class PrayerTimesService {
  private static readonly API_URL = "https://api.aladhan.com/v1/timingsByCity";
  
  // İngilizce'den Türkçe'ye çeviri
  private static readonly PRAYER_MAPPING: { [key: string]: { name: string; id: string } } = {
    "Fajr": { name: "İmsak", id: "imsak" },
    "Sunrise": { name: "Güneş", id: "gunes" }, 
    "Dhuhr": { name: "Öğle", id: "ogle" },
    "Asr": { name: "İkindi", id: "ikindi" },
    "Maghrib": { name: "Akşam", id: "aksam" },
    "Isha": { name: "Yatsı", id: "yatsi" }
  };

  static async getPrayerTimes(city: string): Promise<PrayerTimes> {
    try {
      const normalizedCity = this.normalizeCityName(city);
      
      const response = await fetch(
        `${this.API_URL}?city=${normalizedCity}&country=Turkey&method=13` // Diyanet metodu
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // İngilizce'den Türkçe'ye çevir ve PrayerTime formatına dönüştür
      const prayers: PrayerTime[] = Object.entries(data.data.timings)
        .filter(([key]) => this.PRAYER_MAPPING[key])
        .map(([key, time]) => ({
          id: this.PRAYER_MAPPING[key].id,
          name: this.PRAYER_MAPPING[key].name,
          time: time as string,
          reminderEnabled: false,
          reminderOffset: 15
        }));
      
      // Tarihi formatla
      const today = new Date();
      const dateString = today.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return {
        date: dateString,
        city: city,
        prayers: prayers
      };
      
    } catch (error) {
      console.error('Namaz vakitleri alınırken hata:', error);
      toast.error('Namaz vakitleri alınamadı');
      
      // Fallback: mock data dön
      return this.getMockPrayerTimes(city);
    }
  }

  // Şehir ismini normalize et (Türkçe karakterleri kaldır, küçük harf)
  private static normalizeCityName(city: string): string {
    return city
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  }

  // Fallback mock data
  private static getMockPrayerTimes(city: string): PrayerTimes {
    const mockPrayers: PrayerTime[] = [
      {
        id: 'imsak',
        name: 'İmsak',
        time: '06:18',
        reminderEnabled: false,
        reminderOffset: 15
      },
      {
        id: 'gunes',
        name: 'Güneş',
        time: '07:47',
        reminderEnabled: false,
        reminderOffset: 15
      },
      {
        id: 'ogle',
        name: 'Öğle',
        time: '12:54',
        reminderEnabled: false,
        reminderOffset: 15
      },
      {
        id: 'ikindi',
        name: 'İkindi',
        time: '15:28',
        reminderEnabled: false,
        reminderOffset: 15
      },
      {
        id: 'aksam',
        name: 'Akşam',
        time: '17:51',
        reminderEnabled: false,
        reminderOffset: 15
      },
      {
        id: 'yatsi',
        name: 'Yatsı',
        time: '19:14',
        reminderEnabled: false,
        reminderOffset: 15
      }
    ];

    const today = new Date();
    const dateString = today.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      date: dateString,
      city: city,
      prayers: mockPrayers
    };
  }
}