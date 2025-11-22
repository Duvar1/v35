import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
import { Permissions } from '@capacitor/permissions';

import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { HomePage } from './pages/HomePage';
import { PrayerTimesPage } from './pages/PrayerTimesPage';
import QiblaPage from "./pages/QiblaPage";
import { QuranPage } from './pages/QuranPage';
import { StepsPage } from './pages/StepsPage';
import { InvitePage } from './pages/InvitePage';
import { SettingsPage } from './pages/SettingsPage';
import { BottomNavigation } from './components/BottomNavigation';

// 📌 StepCounter Plugin (Capacitor 5)
const StepCounter = registerPlugin('StepCounter');

const queryClient = new QueryClient();

const App = () => {

  // 🌙 Tema yükleme
  useEffect(() => {
    const root = window.document.documentElement;

    const savedTheme = localStorage.getItem('vaktinamaz-settings-v1');
    let theme = 'light';

    if (savedTheme) {
      try {
        const settings = JSON.parse(savedTheme);
        theme = settings.state?.theme || 'light';
      } catch (error) {
        console.warn('Failed to parse theme from localStorage:', error);
      }
    }

    root.classList.remove('light', 'dark');
    root.classList.add(theme === 'dark' ? 'dark' : 'light');
  }, []);

  // 👣 ADIM SAYAR — İzin iste + servisi başlat + dinle
  useEffect(() => {
    const initStepCounter = async () => {
      try {
        // 1️⃣ ACTIVITY_RECOGNITION izni iste
        const perm = await Permissions.request({
          permissions: ['activityRecognition']
        });

        console.log("İzin sonucu:", perm);

        // 2️⃣ StepService'i başlat
        await StepCounter.startService();
        console.log("StepCounter service başladı.");

        // 3️⃣ Android servis eventlerini dinle
        window.addEventListener("stepUpdate", (event: any) => {
          console.log("Yeni adım:", event.detail.steps);
        });

      } catch (err) {
        console.warn("StepCounter yüklenemedi:", err);
      }
    };

    initStepCounter();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-background">

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/prayer-times" element={<PrayerTimesPage />} />
              <Route path="/qibla" element={<QiblaPage />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/steps" element={<StepsPage />} />
              <Route path="/invite" element={<InvitePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

            <BottomNavigation />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
