// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

import { useThemeStore } from "@/store/themeStore";

import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { App as CapacitorApp } from "@capacitor/app";

import { NotificationService } from "./services/notificationsService";
import { useScrollTop } from "./hooks/useScrollTop";

// Pages
import { HomePage } from "./pages/HomePage";
import { PrayerTimesPage } from "./pages/PrayerTimesPage";
import QiblaPage from "./pages/QiblaPage";
import { QuranPage } from "./pages/QuranPage";
import PremiumPage from "./pages/PremiumPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

import { BottomNavigation } from "./components/BottomNavigation";


// ---------------------------------------------------------
// Query Client
// ---------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});


// ---------------------------------------------------------
// App Initialization
// ---------------------------------------------------------
function useAppInitialization() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 App başlatılıyor...");

        // Konum izni
        setTimeout(() => {
          Geolocation.requestPermissions().catch(() => {});
        }, 800);

        // Bildirim servisi
        await NotificationService.initialize();

        // App lifecycle
        CapacitorApp.addListener("appStateChange", async (state) => {
          if (state.isActive) {
            await NotificationService.onAppResume();
          }
        });

        // Background sync
        setInterval(async () => {
          if (!document.hidden) {
            await NotificationService.validateScheduledNotifications();
          }
        }, 15 * 60 * 1000);

        setLoading(false);
      } catch (err) {
        console.error("Init error:", err);
        setLoading(false);
      }
    };

    init();
  }, []);

  return { loading };
}


// ---------------------------------------------------------
// Layout
// ---------------------------------------------------------
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNav = ["/login", "/splash"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-16">{children}</div>
      {!hideNav && <BottomNavigation />}
    </div>
  );
};


// ---------------------------------------------------------
// Router + İçerik
// ---------------------------------------------------------
function AppContent() {
  useScrollTop();
  const { loading } = useAppInitialization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Yükleniyor...
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/prayer-times" element={<PrayerTimesPage />} />
        <Route path="/qibla" element={<QiblaPage />} />
        <Route path="/quran" element={<QuranPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}


// ---------------------------------------------------------
// ANA UYGULAMA – FINAL TOUCH
// ---------------------------------------------------------
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>

        {/* ✅ Toast artık en doğru yerde */}
        <Toaster
          position="bottom-center"
          richColors
          duration={1600}
          closeButton
        />

        <BrowserRouter>
          <AppContent />
        </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  );
}
