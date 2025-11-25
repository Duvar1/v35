import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from './store/userStore';

// Pages
import { HomePage } from './pages/HomePage';
import { PrayerTimesPage } from './pages/PrayerTimesPage';
import QiblaPage from "./pages/QiblaPage";
import { QuranPage } from './pages/QuranPage';
import { StepsPage } from './pages/StepsPage';
import { InvitePage } from './pages/InvitePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import NotFound from './pages/NotFound';

// Components
import { BottomNavigation } from './components/BottomNavigation';

// Services
import { googleFitLogin } from './services/googleFitLogin';

const queryClient = new QueryClient();

// Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((s) => s.user);
  const isGoogleFitAuthorized = user?.isGoogleFitAuthorized ?? false;

  if (!isGoogleFitAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("vaktinamaz-settings-v1");

    let theme = "light";

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        theme = parsed?.state?.theme || "light";
      } catch {}
    }

    root.classList.remove("light", "dark");
    root.classList.add(theme === "dark" ? "dark" : "light");
  }, []);

  const user = useUserStore((s) => s.user);
  const isGoogleFitAuthorized = user?.isGoogleFitAuthorized ?? false;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              
              <Route path="/login" element={<LoginPage onLogin={googleFitLogin} />} />

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

            {isGoogleFitAuthorized && <BottomNavigation />}
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
