// src/App.tsx

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { useUserStore } from './store/userStore';

import { HomePage } from './pages/HomePage';
import { PrayerTimesPage } from './pages/PrayerTimesPage';
import QiblaPage from "./pages/QiblaPage";
import { QuranPage } from './pages/QuranPage';
import { StepsPage } from './pages/StepsPage';
import { InvitePage } from './pages/InvitePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import NotFound from './pages/NotFound';

import { BottomNavigation } from './components/BottomNavigation';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isGoogleFitAuthorized) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const LayoutWithNav = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNav = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-16">{children}</div>
      {!hideNav && <BottomNavigation />}
    </div>
  );
};

function AppContent() {
  useEffect(() => {
    // Konum izni
    Geolocation.requestPermissions().catch(() => {});
  }, []);

  return (
    <LayoutWithNav>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<HomePage />} />
        <Route path="/prayer-times" element={<PrayerTimesPage />} />
        <Route path="/qibla" element={<QiblaPage />} />
        <Route path="/quran" element={<QuranPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route
          path="/steps"
          element={
            <ProtectedRoute>
              <StepsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </LayoutWithNav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
