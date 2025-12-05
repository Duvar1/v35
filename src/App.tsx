// src/App.tsx
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { NotificationService } from './services/notificationsService';
// AndroidPermissionWarning component'ini kaldır veya oluştur
// import { AndroidPermissionWarning } from './components/AndroidPermissionWarning'; 

import { useScrollTop } from "./hooks/useScrollTop";

import PremiumPage from './pages/PremiumPage';
import { HomePage } from './pages/HomePage';
import { PrayerTimesPage } from './pages/PrayerTimesPage';
import QiblaPage from "./pages/QiblaPage";
import { QuranPage } from './pages/QuranPage';
import { InvitePage } from './pages/InvitePage';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

import { BottomNavigation } from './components/BottomNavigation';
// LoadingScreen'i kaldır veya oluştur
// import { LoadingScreen } from './components/LoadingScreen';

// --- Query Client ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// --- Basit Loading Component (inline) ---
const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-8"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-8 mb-2">
        Vaktinamaz
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Yükleniyor...
      </p>
    </div>
  );
};

// --- Layout ---
const LayoutWithNav = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNav = location.pathname === "/login" || 
                  location.pathname === "/splash";

  return (
    <div className="min-h-screen bg-background relative">
      {/* Android Permission Warning - Geçici olarak kaldırıldı */}
      {/* {Capacitor.getPlatform() === 'android' && 
       (location.pathname === '/' || location.pathname === '/prayer-times') && (
        <div className="px-4 pt-2">
          <AndroidPermissionWarning />
        </div>
      )} */}
      
      <div className="pb-16">{children}</div>
      {!hideNav && <BottomNavigation />}
    </div>
  );
};

// --- App Başlangıç İşlemleri ---
const useAppInitialization = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Uygulama başlatılıyor...', {
          platform: Capacitor.getPlatform(),
          // getVersion metodu farklı olabilir, string olarak al
          version: '1.0.0', // Sabit versiyon veya package.json'dan al
          time: new Date().toISOString()
        });

        // 1. TEMEL İZİNLER
        console.log('🔍 Temel izinler isteniyor...');
        
        // A) Konum izinleri
        setTimeout(() => {
          Geolocation.requestPermissions().catch(err => {
            console.warn('📍 Konum izni hatası:', err.message);
          });
        }, 1000);

        // B) BİLDİRİM SERVİSİNİ BAŞLAT
        console.log('🔔 Bildirim servisi başlatılıyor...');
        const notificationInitSuccess = await NotificationService.initialize();
        
        if (!notificationInitSuccess) {
          console.warn('⚠️ Bildirim servisi başlatılamadı, devam ediliyor...');
        }

        // 2. APP LIFECYCLE EVENT'LERİ
        console.log('📱 App lifecycle event\'leri dinleniyor...');
        
        // App state değişikliği
        CapacitorApp.addListener('appStateChange', async (state) => {
          console.log('📱 App state değişti:', state.isActive ? 'Aktif' : 'Arkaplan');
          
          if (state.isActive) {
            // App ön plana geldiğinde
            await NotificationService.onAppResume();
          }
        });

        // 3. BACKGROUND SYNC
        console.log('🔄 Background sync ayarlanıyor...');
        
        const syncInterval = setInterval(async () => {
          try {
            if (!document.hidden) {
              await NotificationService.validateScheduledNotifications();
            }
          } catch (error) {
            console.error('🔄 Background sync hatası:', error);
          }
        }, 15 * 60 * 1000);

        // 4. NETWORK DURUMU KONTROLÜ
        const checkNetworkStatus = () => {
          const isOnline = navigator.onLine;
          console.log('🌐 Network durumu:', isOnline ? 'Çevrimiçi' : 'Çevrimdışı');
        };

        window.addEventListener('online', checkNetworkStatus);
        window.addEventListener('offline', checkNetworkStatus);
        checkNetworkStatus();

        // 5. DEBUG MODU
        if (process.env.NODE_ENV === 'development') {
          console.log('🐛 Debug modu aktif');
          
          (window as any).debugNotifications = () => {
            NotificationService.debugNotifications();
          };
        }

        console.log('✅ Uygulama başlatma tamamlandı');
        setIsInitializing(false);

        // Cleanup
        return () => {
          clearInterval(syncInterval);
          window.removeEventListener('online', checkNetworkStatus);
          window.removeEventListener('offline', checkNetworkStatus);
          CapacitorApp.removeAllListeners();
        };

      } catch (error: any) {
        console.error('❌ Uygulama başlatma hatası:', error);
        setInitError(error.message || 'Bilinmeyen hata');
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  return { isInitializing, initError };
};

// --- İçerik ---
function AppContent() {
  useScrollTop();
  const { isInitializing, initError } = useAppInitialization();

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Başlatma Hatası</h2>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <LayoutWithNav>
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
    </LayoutWithNav>
  );
}

// --- ANA APP ---
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            classNames: {
              toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
              description: 'group-[.toast]:text-muted-foreground',
              actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
              cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
            },
          }}
        />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}