// src/store/themeStore.ts
import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",

  setTheme: (theme) => {
    set({ theme });

    // DOM’a uygula
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } 
    else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } 
    else {
      // system mode
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark
        ? document.documentElement.classList.add("dark")
        : document.documentElement.classList.remove("dark");
    }
  }
}));
