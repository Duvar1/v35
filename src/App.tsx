import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { registerPlugin } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// StepCounter plugin tipi
interface StepCounterPlugin {
  startService(): Promise<{ success: boolean; message: string }>;
  stopService(): Promise<{ success: boolean; message: string }>;
  addListener(eventName: string, listenerFunc: (data: any) => void): any;
  removeAllListeners(): void;
  checkPermissions(): Promise<{ granted: boolean }>;
  requestPermissions(): Promise<{ granted: boolean }>;
}

// Plugin register
const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');

// Pages
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

const queryClient = new QueryClient();

const App = () => {
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'loading' | 'running' | 'error'>('loading');

  // Tema
  useEffect(() => {
    const root = window.document.documentElement;
    const savedTheme = localStorage.getItem('vaktinamaz-settings-v1');
    let theme = 'light';

    if (savedTheme) {
      try {
        const settings = JSON.parse(savedTheme);
        theme = settings.state?.theme || 'light';
      } catch {}
    }

    root.classList.remove('light', 'dark');
    root.classList.add(theme === 'dark' ? 'dark' : 'light');
  }, []);

  // Step Service Başlat
  useEffect(() => {
    const startStepService = async () => {
      try {
        // Sadece Android'de çalıştır
        const isAndroid = /android/i.test(navigator.userAgent);
        if (!isAndroid) {
          console.log("⏭️ Adım sayar sadece Android'de destekleniyor");
          setServiceStatus('error');
          return;
        }

        // Plugin kontrolü
        if (!StepCounter) {
          console.warn("⚠️ StepCounter plugin bulunamadı");
          setServiceStatus('error');
          return;
        }

        // İzinleri kontrol et
        const permissionResult = await StepCounter.checkPermissions?.().catch(() => ({ granted: false }));
        
        if (!permissionResult?.granted) {
          console.log("🔒 İzin gerekli, dialog gösteriliyor...");
          setShowPermissionDialog(true);
          setServiceStatus('error');
          return;
        }

        // Servisi başlat
        const result = await StepCounter.startService();
        console.log("✅ StepCounter servisi başlatıldı:", result);
        setServiceStatus('running');

        // Native event listener ekle
        StepCounter.addListener('stepUpdate', (data) => {
          console.log("📱 Adım güncellendi:", data.steps);
        });

      } catch (err) {
        console.warn("❌ StepCounter başlatılamadı:", err);
        setServiceStatus('error');
      }
    };

    startStepService();

    // Cleanup
    return () => {
      if (StepCounter) {
        StepCounter.removeAllListeners();
      }
    };
  }, []);

  const handlePermissionGrant = async () => {
    try {
      const result = await StepCounter.requestPermissions?.().catch(() => ({ granted: false }));
      
      if (result?.granted) {
        setShowPermissionDialog(false);
        
        // Servisi tekrar başlat
        const serviceResult = await StepCounter.startService();
        console.log("✅ StepCounter servisi başlatıldı:", serviceResult);
        setServiceStatus('running');
      } else {
        console.warn("❌ İzin reddedildi");
        setServiceStatus('error');
      }
    } catch (error) {
      console.error("❌ İzin hatası:", error);
      setServiceStatus('error');
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            
            {/* İzin Dialog */}
            <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adım Sayma İzni Gerekli</DialogTitle>
                  <DialogDescription>
                    Adımlarınızı sayabilmemiz için fiziksel aktivite izni gerekiyor. 
                    Bu izin sadece adımlarınızı saymak için kullanılacak.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={handlePermissionGrant}>
                    İzin Ver
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/prayer-times" element={<PrayerTimesPage />} />
              <Route path="/qibla" element={<QiblaPage />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/steps" element={<StepsPage serviceStatus={serviceStatus} />} />
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