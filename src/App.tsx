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

// Protected Route Component - Sadece authorized kullanıcılar görebilir
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((s) => s.user);
  const isAuthorized = user?.isGoogleFitAuthorized === true;

  console.log('🔐 ProtectedRoute kontrolü:', { 
    user: !!user, 
    isAuthorized, 
    userData: user 
  });

  // Eğer giriş yapılmamışsa LoginPage'e yönlendir
  if (!isAuthorized) {
    console.log('🚫 Yetki yok, login sayfasına yönlendiriliyor...');
    return <Navigate to="/login" replace />;
  }

  // Eğer giriş yapılmışsa children'ı render et
  console.log('✅ Yetki var, steps sayfası gösteriliyor');
  return <>{children}</>;
};

// Layout component - Navbar'ı koşullu göster
const LayoutWithNav = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Navbar'ın GÖSTERİLMEYECEĞİ sayfalar
  const hideNavOnRoutes = ['/login'];
  const showNav = !hideNavOnRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-16"> {/* Navbar için padding */}
        {children}
      </div>
      {showNav && <BottomNavigation />}
    </div>
  );
};

const AppContent = () => {
  // Tema ve konum izinleri (mevcut kodunuz aynı)
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
        {/* LOGIN ROUTE - Ayrı bir sayfa */}
        <Route path="/login" element={<LoginPage onLogin={googleFitLogin} />} />
        
        {/* DİĞER SAYFALAR */}
        <Route path="/" element={<HomePage />} />
        <Route path="/prayer-times" element={<PrayerTimesPage />} />
        <Route path="/qibla" element={<QiblaPage />} />
        <Route path="/quran" element={<QuranPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* PROTECTED ROUTE - Sadece giriş yapmış kullanıcılar StepsPage'i görebilir */}
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