// src/store/settingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CalculationMethod =
  | "diyanet"
  | "mwl"
  | "isna"
  | "egypt"
  | "mekke"
  | "karachi";

type SettingsState = {
  city: string;                    // Örn: "İstanbul"
  district: string;               // Örn: "Büyükçekmece"
  country: string;                 // İstersen kullanırsın, şimdilik TR
  method: CalculationMethod;       // Hesaplama yöntemi
  hasOnboarded: boolean;           // Onboarding'den geçti mi

  setCity: (city: string) => void;
  setDistrict: (district: string) => void;
  setCountry: (country: string) => void;
  setMethod: (method: CalculationMethod) => void;
  setHasOnboarded: (value: boolean) => void;
  
  // Yeni: Konumu tek fonksiyonda set etmek için
  setLocation: (city: string, district?: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      city: "İstanbul",
      district: "", // Varsayılan olarak boş
      country: "TR",
      method: "diyanet",
      hasOnboarded: false,

      setCity: (city) => set({ city, district: "" }), // Şehir değişince ilçeyi sıfırla
      setDistrict: (district) => set({ district }),
      setCountry: (country) => set({ country }),
      setMethod: (method) => set({ method }),
      setHasOnboarded: (value) => set({ hasOnboarded: value }),
      
      // Yeni fonksiyon: Hem şehir hem ilçeyi aynı anda set etmek için
      setLocation: (city, district = "") => set({ city, district }),
    }),
    {
      name: "vaktinamaz-settings-v2",
      // migrate fonksiyonu ekleyerek eski versiyondan yeniye geçişi sağlayabiliriz
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // v1'den v2'ye geçiş - district alanını ekle
          return {
            ...persistedState,
            district: persistedState.district || "",
          };
        }
        return persistedState;
      },
      version: 2, // Versiyon numarasını belirt
    }
  )
);