// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

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
import { InvitePage } from "./pages/InvitePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

// Layout
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
// App Initialization Hook
// ---------------------------------------------------------
function useAppInitialization() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 App initializing...");

        // 1. Konum izni (1 saniye gecikmeli)
        setTimeout(() => {
          Geolocation.requestPermissions().catch(() => {});
        }, 1000);

        // 2. Bildirim servisi
        await NotificationService.initialize();

        // 3. App lifecycle
        CapacitorApp.addListener("appStateChange", async (state) => {
          if (state.isActive) {
            await NotificationService.onAppResume();
          }
        });

        // 4. Background Sync (15 dakika)
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
// Layout (Bottom Navigation + Sayfa İçeriği)
// ---------------------------------------------------------
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
// İçerik Router
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
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}


// ---------------------------------------------------------
// ANA UYGULAMA
// ---------------------------------------------------------
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>

          <AppContent />

          {/* 🔥 Toast tam doğru yerde */}
          <Toaster position="top-right" />

        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
