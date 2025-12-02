import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Geolocation } from "@capacitor/geolocation";
import citiesData from "../data/cities.json";

export type CalculationMethod =
  | "diyanet"
  | "mwl"
  | "isna"
  | "egypt"
  | "mekke"
  | "karachi";

type SettingsState = {
  country: string;           // hep Türkiye
  city: string;              // 81 şehirden biri
  method: CalculationMethod; // hep diyanet

  cities: string[];

  setCity: (city: string) => void;
  setCityAuto: () => Promise<void>;
  loadCities: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      country: "Türkiye",
      city: "İstanbul",
      method: "diyanet",

      cities: [],

      // elle şehir seçme
      setCity: (city) => set({ city }),

      // statik json’dan şehir listesi yükle
      loadCities: () => {
        const list = citiesData["Türkiye"];
        set({ cities: list });
      },

      // GPS → sadece şehir
      setCityAuto: async () => {
        try {
          const pos = await Geolocation.getCurrentPosition();
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );

          const data = await res.json();

          let rawCity =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "İstanbul";

          const cityList: string[] = citiesData["Türkiye"];

          // Yurt dışı ise eşleşmeyecek → fallback İstanbul
          if (!cityList.includes(rawCity)) {
            rawCity = "İstanbul";
          }

          set({
            city: rawCity,
            country: "Türkiye",
            method: "diyanet"
          });

        } catch (err) {
          console.log("GPS Error:", err);
          set({ city: "İstanbul" });
        }
      }
    }),
    {
      name: "vaktinamaz-settings-v5",
      version: 5
    }
  )
);
