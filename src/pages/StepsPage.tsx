import React, { useEffect, useState, useCallback } from 'react';
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
import { StepCounter } from '../stepCounter'; // Doğrudan StepCounter plugin'ini kullan

export const StepsPage: React.FC = () => {
  const {
    dailyGoal,
    todaySteps,
    weeklySteps,
    monthlySteps,
    isSupported,
    permission,
    setDailyGoal,
    setWeeklySteps,
    setSupported,
    setPermission,
    updateTodaySteps,
    setServiceStarted
  } = useStepsStore();

  const { user } = useUserStore();
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyTotal = monthlySteps[monthKey] || 0;

  const handleStepUpdate = useCallback((data: { stepCount: number }) => {
    console.log('📱 Adım güncellendi:', data.stepCount);
    updateTodaySteps(data.stepCount);
  }, [updateTodaySteps]);

  useEffect(() => {
    console.log('🔍 Capacitor platform:', Capacitor.getPlatform());

    const isAndroid = Capacitor.getPlatform() === 'android';
    setSupported(isAndroid);

    if (isAndroid) {
      console.log('✅ Android platform, servis kontrol ediliyor...');
      initializeStepCounter();
    }

    if (weeklySteps.length === 0) {
      const today = new Date();
      const empty: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        empty.push({
          date: d.toISOString().split("T")[0],
          steps: Math.floor(Math.random() * 3000) + 1000,
        });
      }

      setWeeklySteps(empty);
    }

    // Listener'ı ekle
    let listener: any = null;
    
    const setupListener = async () => {
      try {
        listener = await StepCounter.addListener('stepCountUpdate', handleStepUpdate);
        console.log('✅ Step listener başarıyla eklendi');
      } catch (error) {
        console.error('❌ Listener ekleme hatası:', error);
      }
    };

    setupListener();

    return () => {
      // Cleanup
      if (listener) {
        listener.remove();
      }
    };
  }, [handleStepUpdate, setSupported, setWeeklySteps, weeklySteps.length]);

  const initializeStepCounter = async () => {
    setLoading(true);
    try {
      const permResult = await StepCounter.checkPermissions();
      console.log('Permission check result:', permResult);
      
      setPermission(permResult.hasAllPermissions ? 'granted' : 'prompt');
      setSupported(permResult.isSensorAvailable);
      
      if (permResult.hasAllPermissions && permResult.isSensorAvailable) {
        setIsServiceRunning(true);
        setServiceStarted(true);
        
        // Mevcut adım sayısını al
        const stepResult = await StepCounter.getStepCount();
        if (stepResult.stepCount > 0) {
          updateTodaySteps(stepResult.stepCount);
        }
      } else {
        setIsServiceRunning(false);
      }
    } catch (error) {
      console.error('Step counter init hatası:', error);
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
      const requestResult = await StepCounter.requestPermissions();
      console.log('Permission request result:', requestResult);
      
      if (requestResult.hasAllPermissions) {
        setPermission('granted');
        await StepCounter.startStepCounting();
        setIsServiceRunning(true);
        setServiceStarted(true);
        console.log('✅ Servis başlatıldı');
      } else {
        setPermission('denied');
        alert('İzinler reddedildi. Lütfen ayarlardan şu izinleri manuel olarak verin:\n\n• Fiziksel Aktivite\n• Bildirimler (Android 13+)');
      }
    } catch (error) {
      console.error('❌ İzin hatası:', error);
      setPermission('denied');
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = async () => {
    setLoading(true);
    try {
      await StepCounter.startStepCounting();
      setIsServiceRunning(true);
      setServiceStarted(true);
      setPermission('granted');
      
      console.log('✅ Step counting başlatıldı');
    } catch (error) {
      alert('Servis başlatılamadı: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopService = async () => {
    setLoading(true);
    try {
      await StepCounter.stopStepCounting();
      setIsServiceRunning(false);
      setServiceStarted(false);
      console.log('✅ Step counting durduruldu');
    } catch (error) {
      alert('Servis durdurulamadı: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSteps = async () => {
    if (confirm('Bugünkü adımları sıfırlamak istediğinize emin misiniz?')) {
      try {
        await StepCounter.resetSteps();
        updateTodaySteps(0);
        console.log('🔄 Adımlar sıfırlandı');
      } catch (error) {
        console.error('Sıfırlama hatası:', error);
        updateTodaySteps(0);
      }
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
            Gerekli izinler reddedildi. Lütfen ayarlardan şu izinleri verin:
            <br/>• <strong>Fiziksel Aktivite</strong> - Adımları saymak için
            <br/>• <strong>Bildirimler</strong> - Arka planda çalışmak için (Android 13+)
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
              Adım Sayar İzinleri Gerekli
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              Fiziksel Aktivite + Bildirim izinleri gerekiyor
            </p>
            <Button 
              onClick={() => setShowPermissionDialog(true)}
              disabled={loading}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              İzinleri Ver
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Today's Steps Card */}
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
            <DialogTitle>🚶‍♂️ Adım Sayar İzinleri</DialogTitle>
            <DialogDescription>
              Adımlarınızı sayabilmek için aşağıdaki izinlere ihtiyacımız var:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span><strong>Fiziksel Aktivite</strong> - Adımlarınızı saymak için</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span><strong>Bildirimler</strong> - Arka planda çalışabilmek için (Android 13+)</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
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
              Tüm İzinleri Ver
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