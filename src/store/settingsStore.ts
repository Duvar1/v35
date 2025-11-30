// src/store/settingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Geolocation } from "@capacitor/geolocation";

export type CalculationMethod =
  | "diyanet"
  | "mwl"
  | "isna"
  | "egypt"
  | "mekke"
  | "karachi";

export function getAutoMethodByCountry(country: string): CalculationMethod {
  if (!country) return "mwl";
  const c = country.toLowerCase();

  if (["türkiye", "turkey"].includes(c)) return "diyanet";
  if (["saudi arabia", "uae", "qatar", "oman"].includes(c)) return "mekke";
  if (["usa", "united states", "america", "canada"].includes(c)) return "isna";
  if (["egypt", "jordan", "lebanon"].includes(c)) return "egypt";
  if (["pakistan", "india", "bangladesh"].includes(c)) return "karachi";

  return "mwl";
}

type SettingsState = {
  country: string;
  city: string;
  method: CalculationMethod;

  countries: string[];
  cities: string[];

  setCountry: (country: string) => void;
  setCity: (city: string) => void;
  setMethod: (method: CalculationMethod) => void;

  loadCitiesByCountry: (country: string) => Promise<void>;
  setCityAuto: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      country: "Türkiye",
      city: "İstanbul",
      method: "diyanet",

      countries: [],
      cities: [],

      setCountry: (country) => {
        const apiCountry = country === "Türkiye" ? "Turkey" : country;
        set({ country, city: "" });

        const auto = getAutoMethodByCountry(apiCountry);
        set({ method: auto });

        get().loadCitiesByCountry(apiCountry);
      },

      setCity: (city) => set({ city }),
      
      setMethod: (method) => set({ method }),

      loadCitiesByCountry: async (country) => {
        try {
          console.log("🔄 Şehirler yükleniyor:", country);
          
          let cityList: string[] = [];

          // 1. İlk API denemesi - CountriesNow
          try {
            const res = await fetch(
              "https://countriesnow.space/api/v0.1/countries/cities",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country }),
              }
            );

            const json = await res.json();
            if (json?.data && Array.isArray(json.data)) {
              cityList = json.data;
              console.log(`✅ ${country} için ${cityList.length} şehir bulundu`);
            }
          } catch (err) {
            console.log("❌ CountriesNow API hatası:", err);
          }

          // 2. Fallback API
          if (cityList.length === 0) {
            try {
              const fallbackCities = getFallbackCities(country);
              cityList = fallbackCities;
              console.log(`🔄 Fallback şehirler kullanılıyor: ${cityList.length} şehir`);
            } catch (err) {
              console.log("❌ Fallback şehirler hatası:", err);
              cityList = ["İstanbul", "Ankara", "İzmir"];
            }
          }

          const sorted = cityList.sort((a: string, b: string) =>
            a.localeCompare(b, "tr")
          );

          set({ cities: sorted });
          
        } catch (err) {
          console.error("🚨 Şehir yükleme hatası:", err);
          set({
            cities: ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana"],
          });
        }
      },

      setCityAuto: async () => {
        try {
          const pos = await Geolocation.getCurrentPosition();
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();

          let rawCountry = data.address.country || "Türkiye";
          let rawCity =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "İstanbul";

          if (rawCountry === "Turkey") rawCountry = "Türkiye";

          const auto = getAutoMethodByCountry(rawCountry);

          set({
            country: rawCountry,
            method: auto,
          });

          await get().loadCitiesByCountry(rawCountry);
          set({ city: rawCity });
        } catch (err) {
          console.log("GPS Error:", err);
          // Toast'u burada kullanmıyoruz, component içinde handle edeceğiz
          throw new Error("Konum alınamadı");
        }
      },
    }),
    {
      name: "vaktinamaz-settings-v3",
      version: 3,
    }
  )
);

// Fallback şehir listesi
const getFallbackCities = (country: string): string[] => {
  const cityMap: { [key: string]: string[] } = {
    'Turkey': [
      'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 
      'Şanlıurfa', 'Gaziantep', 'Mersin', 'Diyarbakır', 'Kayseri', 'Samsun',
      'Erzurum', 'Malatya', 'Kahramanmaraş', 'Van', 'Elazığ', 'Sakarya', 'Trabzon'
    ],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Strasbourg'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
    'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Glasgow'],
    'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Taif'],
    'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said'],
    'Pakistan': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad'],
    'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
  };

  return cityMap[country] || ['Başkent', 'Büyükşehir', 'Merkez'];
};