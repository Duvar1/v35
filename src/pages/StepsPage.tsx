import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Footprints, Award, CalendarDays, Target, Play, Square, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { StepChart } from '../components/StepChart';
import { AdPlaceholder } from '../components/AdPlaceholder';

import { useStepsStore } from '../store/stepsStore';
import { useUserStore } from '../store/userStore';
import { Capacitor } from '@capacitor/core';

export const StepsPage: React.FC = () => {
  const {
    dailyGoal,
    todaySteps,
    weeklySteps,
    monthlySteps,
    isSupported,
    permission,
    serviceStarted,
    setDailyGoal,
    setWeeklySteps,
    setSupported,
    setPermission
  } = useStepsStore();

  const { user } = useUserStore();
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // 📌 Bu ayın toplam adımı
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyTotal = monthlySteps[monthKey] || 0;

  // 📌 İlk yükleme
  useEffect(() => {
    console.log('🔍 Capacitor platform:', Capacitor.getPlatform());
    
    // Platform desteğini kontrol et
    const isAndroid = Capacitor.getPlatform() === 'android';
    setSupported(isAndroid);

    if (isAndroid) {
      console.log('✅ Android platform, servis kontrol ediliyor...');
      checkServiceStatus();
    }

    // Haftalık veri oluştur
    if (weeklySteps.length === 0) {
      const today = new Date();
      const empty: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        empty.push({
          date: d.toISOString().split("T")[0],
          steps: 0,
        });
      }

      setWeeklySteps(empty);
    }

    // Adım güncellemelerini dinle
    const handleStepUpdate = (event: any) => {
      try {
        const steps = event.detail.steps;
        console.log('📱 Yeni adım alındı:', steps);
        // Store'daki fonksiyonu kullan
      } catch (error) {
        console.error('❌ Adım güncelleme hatası:', error);
      }
    };

    window.addEventListener("stepUpdate", handleStepUpdate);
    
    return () => {
      window.removeEventListener("stepUpdate", handleStepUpdate);
    };
  }, []);

  const checkServiceStatus = async () => {
    setLoading(true);
    try {
      // Capacitor plugin kontrolü
      if (typeof (window as any).Capacitor !== 'undefined') {
        const { StepCounter } = (window as any).Capacitor.Plugins;
        
        if (StepCounter) {
          // Servis durumunu kontrol et
          setPermission('granted');
          setIsServiceRunning(true);
          console.log('✅ StepCounter plugin mevcut');
        } else {
          setPermission('denied');
          setIsServiceRunning(false);
          console.log('❌ StepCounter plugin bulunamadı');
        }
      }
    } catch (error) {
      console.error('❌ Servis kontrol hatası:', error);
      setPermission('unknown');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionRequest = async () => {
    console.log('📝 İzin isteniyor...');
    setShowPermissionDialog(false);
    setLoading(true);
    try {
      // Capacitor plugin ile izin iste
      if (typeof (window as any).Capacitor !== 'undefined') {
        const { StepCounter } = (window as any).Capacitor.Plugins;
        
        if (StepCounter) {
          await StepCounter.startService();
          setPermission('granted');
          setIsServiceRunning(true);
          console.log('✅ Servis başlatıldı');
        }
      }
    } catch (error) {
      console.error('❌ İzin hatası:', error);
      setPermission('denied');
      alert('İzin reddedildi. Ayarlar > Uygulamalar > İzinler\'den manuel olarak izin verebilirsiniz.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = async () => {
    setLoading(true);
    try {
      if (typeof (window as any).Capacitor !== 'undefined') {
        const { StepCounter } = (window as any).Capacitor.Plugins;
        
        if (StepCounter) {
          await StepCounter.startService();
          setIsServiceRunning(true);
          setPermission('granted');
        }
      }
    } catch (error) {
      alert('Servis başlatılamadı: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopService = async () => {
    setLoading(true);
    try {
      if (typeof (window as any).Capacitor !== 'undefined') {
        const { StepCounter } = (window as any).Capacitor.Plugins;
        
        if (StepCounter) {
          await StepCounter.stopService();
          setIsServiceRunning(false);
        }
      }
    } catch (error) {
      alert('Servis durdurulamadı: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSteps = () => {
    if (confirm('Bugünkü adımları sıfırlamak istediğinize emin misiniz?')) {
      // Store'daki reset fonksiyonunu kullan
      console.log('🔄 Adımlar sıfırlanıyor...');
    }
  };

  const handleGoalUpdate = () => {
    const goal = parseInt(newGoal) || 10000;
    if (goal >= 1000 && goal <= 50000) {
      setDailyGoal(goal);
      setShowGoalDialog(false);
    }
  };

  const progressPercentage = Math.min((todaySteps / dailyGoal) * 100, 100);
  const isGoalAchieved = todaySteps >= dailyGoal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 p-4 space-y-6">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">Adımlarım</h1>
        <p className="text-pink-600 dark:text-purple-400 font-light">Günlük adım hedefinizi takip edin</p>
      </div>

      {/* Top Ad */}
      {!user?.isPremium && (
        <div className="w-full">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* İzin Reddedildi Uyarısı */}
      {permission === 'denied' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Adım sayar izni reddedildi. Ayarlar &gt; Uygulamalar &gt; İzinler'den "Fiziksel Aktivite" iznini aktif edin.
          </AlertDescription>
        </Alert>
      )}

      {/* Cihaz Desteklenmiyor Uyarısı */}
      {!isSupported && (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Adım sayar özelliği sadece Android cihazlarda desteklenmektedir.
          </AlertDescription>
        </Alert>
      )}

      {/* Service Controls - Sadece Android'de göster */}
      {isSupported && permission === 'granted' && (
        <Card className="bg-gradient-to-r from-blue-100/80 to-cyan-100/80 dark:from-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-blue-200/50 dark:border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-light text-blue-800 dark:text-blue-200">Adım Sayar Servisi</h3>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  {isServiceRunning ? '✅ Arka planda çalışıyor' : '⏸️ Durduruldu'}
                </p>
              </div>
              
              <div className="flex gap-2">
                {!isServiceRunning ? (
                  <Button 
                    onClick={handleStartService} 
                    disabled={loading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Başlat
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStopService} 
                    disabled={loading}
                    size="sm"
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Durdur
                  </Button>
                )}
                
                <Button 
                  onClick={handleResetSteps}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* İzin İste Butonu - İzin yoksa göster */}
      {isSupported && permission !== 'granted' && permission !== 'denied' && (
        <Card className="bg-gradient-to-r from-yellow-100/80 to-orange-100/80 dark:from-yellow-800/60 dark:to-orange-800/60 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <h3 className="font-light text-yellow-800 dark:text-yellow-200 mb-2">
              Adım Sayar İzni Gerekli
            </h3>
            <Button 
              onClick={() => setShowPermissionDialog(true)}
              disabled={loading}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              İzin Ver
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Today's Steps */}
      <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Footprints className="h-8 w-8 text-pink-600 dark:text-purple-300 mr-2" />
            <h2 className="text-lg font-light text-pink-800 dark:text-purple-200">
              Bugünkü Adımlar
            </h2>
          </div>

          <div className="text-5xl font-light text-pink-700 dark:text-purple-100 mb-2">
            {todaySteps.toLocaleString()}
          </div>

          <Progress value={progressPercentage} className="h-3 bg-pink-200/50 dark:bg-purple-700/30" />

          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-pink-600 dark:text-purple-300 font-light">
              Hedef: {dailyGoal.toLocaleString()}
            </span>
            <span className={`${isGoalAchieved ? 'text-green-600' : 'text-pink-600 dark:text-purple-300'} font-light`}>
              %{Math.round(progressPercentage)}
            </span>
          </div>

          {isGoalAchieved && (
            <div className="flex items-center justify-center space-x-2 text-green-600 mt-3">
              <Award className="h-5 w-5" />
              <span className="font-light">Günlük hedef tamamlandı! 🎉</span>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowGoalDialog(true)}
            className="mt-4 border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-purple-600 dark:text-purple-300"
          >
            <Target className="h-4 w-4 mr-1" />
            Hedefi Değiştir
          </Button>
        </CardContent>
      </Card>

      {/* MONTHLY TOTAL */}
      <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border-l-4 border-l-purple-400 border border-pink-200/50 dark:border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-1">
            <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            <h3 className="font-light text-pink-800 dark:text-purple-200">Bu Ayki Toplam Adım</h3>
          </div>
          <p className="text-3xl font-light text-purple-700 dark:text-purple-300">
            {monthlyTotal.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Middle Ad */}
      {!user?.isPremium && (
        <div className="w-full">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* Weekly Chart */}
      <StepChart weeklySteps={weeklySteps} dailyGoal={dailyGoal} />

      {/* Motivational */}
      <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border-l-4 border-l-green-400 border border-pink-200/50 dark:border-purple-500/30">
        <CardContent className="p-4">
          <h3 className="font-light mb-2 text-pink-800 dark:text-purple-200">💪 Günün Motivasyonu</h3>
          <p className="text-pink-700 dark:text-purple-300 italic text-sm font-light">
            "Her adım, sağlığınıza doğru atılmış bir adımdır."
          </p>
          <p className="text-xs text-pink-600 dark:text-purple-400 mt-2 font-light">
            Bugün {todaySteps.toLocaleString()} adım attınız!
          </p>
        </CardContent>
      </Card>

      {/* Bottom Ad */}
      {!user?.isPremium && (
        <div className="w-full mt-6 pb-4">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* İzin İste Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🚶‍♂️ Adım Sayar İzni</DialogTitle>
            <DialogDescription>
              Adımlarınızı sayabilmek için "Fiziksel Aktivite" izni gerekiyor. Bu izin sayesinde uygulama arka planda çalışırken bile adımlarınızı takip edebilir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ✅ Arka planda sürekli çalışır<br/>
              ✅ Telefon yeniden başlatılınca otomatik başlar<br/>
              ✅ Pil dostu teknoloji
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Şimdi Değil
            </Button>
            <Button onClick={handlePermissionRequest}>
              İzin Ver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hedef Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Günlük Adım Hedefi</DialogTitle>
            <DialogDescription>
              Günlük adım hedefinizi ayarlayın (1000-50000)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="10000"
              min="1000"
              max="50000"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleGoalUpdate}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-4"></div>
    </div>
  );
};