import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
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

// Protected Route (sadece steps için)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((s) => s.user);
  const isAuthorized = user?.isGoogleFitAuthorized === true;

  if (!isAuthorized) return <Navigate to="/login" replace />;

  return children;
};

// Navbar'ı koşullu gösteren wrapper
const LayoutWithNav = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNavOnRoutes = ['/login'];
  const showNav = !hideNavOnRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      {children}
      {showNav && <BottomNavigation />}
    </div>
  );
};

const AppContent = () => {
  // Tema
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

  // Uygulama açılır açılmaz konum izni iste
  useEffect(() => {
    async function askLocation() {
      try {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== "granted") {
          await Geolocation.requestPermissions({ permissions: ["location"] });
        }
      } catch (err) {
        console.log("Konum izin hatası:", err);
      }
    }
    askLocation();
  }, []);

  return (
    <LayoutWithNav>
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
    </LayoutWithNav>
  );
};

const App = () => {
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
};

export default App;