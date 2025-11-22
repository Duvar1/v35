import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Footprints, Award, CalendarDays, Target, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { StepChart } from '../components/StepChart';
import { AdPlaceholder } from '../components/AdPlaceholder';

import { useStepsStore } from '../store/stepsStore';
import { useUserStore } from '../store/userStore';

interface StepsPageProps {
  serviceStatus?: 'loading' | 'running' | 'error';
}

export const StepsPage: React.FC<StepsPageProps> = ({ serviceStatus = 'loading' }) => {
  const {
    dailyGoal,
    todaySteps,
    weeklySteps,
    monthlySteps,
    setDailyGoal,
    updateTodaySteps,
    setWeeklySteps,
    setMonthlySteps,
    setSupported,
    setPermission
  } = useStepsStore();

  const { user } = useUserStore();
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [localServiceStatus, setLocalServiceStatus] = useState(serviceStatus);

  // 📌 Bu ayın toplam adımı
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyTotal = monthlySteps[monthKey] || 0;

  // 📌 Servis durumu güncelle
  useEffect(() => {
    setLocalServiceStatus(serviceStatus);
  }, [serviceStatus]);

  // 📌 Cihaz destekliyor mu? (Android native)
  useEffect(() => {
    const isAndroid = /android/i.test(navigator.userAgent);
    setSupported(isAndroid);

    // Test verisi - gerçek adım sayacı çalışmazsa
    if (serviceStatus === 'error') {
      const testSteps = Math.floor(Math.random() * 5000) + 1000;
      updateTodaySteps(testSteps);
    }

    // ilk yüklemede haftalık boş liste
    if (weeklySteps.length === 0) {
      const today = new Date();
      const empty: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);

        empty.push({
          date: d.toISOString().split("T")[0],
          steps: Math.floor(Math.random() * 8000) + 2000,
        });
      }

      setWeeklySteps(empty);
    }

    // Aylık test verisi
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!monthlySteps[currentMonth]) {
      setMonthlySteps({
        ...monthlySteps,
        [currentMonth]: Math.floor(Math.random() * 50000) + 50000
      });
    }
  }, []);

  // 📌 Native StepCounter Plugin → stepUpdate listener
  useEffect(() => {
    const handleStepUpdate = (event: any) => {
      try {
        const steps = event.detail.steps;
        console.log('📱 Yeni adım alındı:', steps);
        updateTodaySteps(steps);
        
        // Haftalık veriyi güncelle
        const today = new Date().toISOString().split('T')[0];
        const updatedWeekly = weeklySteps.map(day => 
          day.date === today ? { ...day, steps } : day
        );
        setWeeklySteps(updatedWeekly);

      } catch (error) {
        console.error('❌ Adım güncelleme hatası:', error);
      }
    };

    window.addEventListener("stepUpdate", handleStepUpdate);
    
    return () => {
      window.removeEventListener("stepUpdate", handleStepUpdate);
    };
  }, [weeklySteps, updateTodaySteps, setWeeklySteps]);

  // 📌 Hedef güncelleme fonksiyonu - EKSİK OLAN
  const handleGoalUpdate = () => {
    const goal = parseInt(newGoal) || 10000;
    if (goal >= 1000 && goal <= 50000) {
      setDailyGoal(goal);
      setShowGoalDialog(false);
    }
  };

  const progressPercentage = Math.min((todaySteps / dailyGoal) * 100, 100);
  const isGoalAchieved = todaySteps >= dailyGoal;
  const caloriesBurned = Math.round(todaySteps * 0.04); // Yaklaşık kalori
  const distance = (todaySteps * 0.000762).toFixed(2); // Yaklaşık km

  // Motivasyon mesajları
  const getMotivationMessage = () => {
    if (todaySteps === 0) return "Hadi harekete geç! İlk adımı at 🚶‍♂️";
    if (todaySteps < 2000) return "Harika başlangıç! Devam et 💪";
    if (todaySteps < 5000) return "Süper gidiyorsun! Hedefe yaklaşıyorsun 🎯";
    if (todaySteps < 8000) return "Müthiş! Biraz daha gayret 🔥";
    if (todaySteps < dailyGoal) return "Neredeyse geldin! Son bir hamle ⚡";
    return "Harikasın! Günlük hedefi aştın 🏆";
  };

  const getAchievementLevel = () => {
    if (todaySteps >= dailyGoal) return { level: "🏆 Şampiyon", color: "text-yellow-600" };
    if (todaySteps >= dailyGoal * 0.8) return { level: "⭐ Yıldız", color: "text-purple-600" };
    if (todaySteps >= dailyGoal * 0.5) return { level: "🔥 Ateş", color: "text-orange-600" };
    return { level: "🌱 Çaylak", color: "text-green-600" };
  };

  const achievement = getAchievementLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 p-4 space-y-4 no-horizontal-scroll">

      {/* Servis Durumu */}
      {localServiceStatus !== 'running' && (
        <div className={`text-center p-3 rounded-lg border ${
          localServiceStatus === 'loading' ? 
          'bg-yellow-100 text-yellow-800 border-yellow-300' : 
          'bg-red-100 text-red-800 border-red-300'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">
              {localServiceStatus === 'loading' && '🔄 Adım sayar başlatılıyor...'}
              {localServiceStatus === 'error' && '❌ Adım sayar başlatılamadı - Uygulamayı yeniden başlatmayı deneyin'}
            </span>
          </div>
        </div>
      )}

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

      {/* Today's Steps - ANA KART */}
      <Card className="bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90 dark:from-purple-800/80 dark:via-blue-800/80 dark:to-cyan-800/80 backdrop-blur-sm border-2 border-pink-200/60 dark:border-purple-500/40 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Footprints className="h-8 w-8 text-pink-600 dark:text-purple-300 mr-2" />
              <h2 className="text-lg font-light text-pink-800 dark:text-purple-200">
                Bugünkü Adımlar
              </h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGoalDialog(true)}
              className="border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-purple-600 dark:text-purple-300"
            >
              <Target className="h-4 w-4 mr-1" />
              Hedef
            </Button>
          </div>

          <div className="text-5xl font-light text-pink-700 dark:text-purple-100 mb-2">
            {todaySteps.toLocaleString()}
          </div>

          <div className="flex items-center justify-center space-x-4 mb-4 text-sm text-pink-600 dark:text-purple-300">
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span>{caloriesBurned} kcal</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>📏</span>
              <span>{distance} km</span>
            </div>
          </div>

          <Progress value={progressPercentage} className="h-3 bg-pink-200/50 dark:bg-purple-700/30 mb-2" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-pink-600 dark:text-purple-300 font-light">
              Hedef: {dailyGoal.toLocaleString()}
            </span>
            <span className={`${isGoalAchieved ? 'text-green-600' : 'text-pink-600 dark:text-purple-300'} font-light`}>
              %{Math.round(progressPercentage)}
            </span>
          </div>

          {isGoalAchieved && (
            <div className="flex items-center justify-center space-x-2 text-green-600 mt-3 animate-pulse">
              <Award className="h-5 w-5" />
              <span className="font-light">Günlük hedef tamamlandı! 🎉</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seviye ve Başarı */}
      <Card className="bg-gradient-to-r from-yellow-100/80 to-orange-100/80 dark:from-yellow-900/60 dark:to-orange-900/60 backdrop-blur-sm border-l-4 border-l-yellow-400 border border-yellow-200/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Başarı Seviyesi</h3>
              <p className={`text-2xl font-bold ${achievement.color}`}>
                {achievement.level}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Günlük Hedef</p>
              <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                {dailyGoal.toLocaleString()} adım
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AYLIK TOPLAM */}
      <Card className="bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-800/60 dark:to-blue-800/60 backdrop-blur-sm border-l-4 border-l-purple-400 border border-purple-200/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              <div>
                <h3 className="font-medium text-purple-800 dark:text-purple-200">Bu Ayki Toplam</h3>
                <p className="text-2xl font-light text-purple-700 dark:text-purple-300">
                  {monthlyTotal.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-600 dark:text-purple-400">Ortalama</p>
              <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                {Math.round(monthlyTotal / new Date().getDate()).toLocaleString()}/gün
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Ad */}
      {!user?.isPremium && (
        <div className="w-full">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* Haftalık Grafik */}
      <StepChart weeklySteps={weeklySteps} dailyGoal={dailyGoal} />

      {/* Motivasyon */}
      <Card className="bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-800/60 dark:to-emerald-800/60 backdrop-blur-sm border-l-4 border-l-green-400 border border-green-200/50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 text-green-800 dark:text-green-200">💪 Motivasyon</h3>
          <p className="text-green-700 dark:text-green-300 text-sm font-light">
            {getMotivationMessage()}
          </p>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-green-600 dark:text-green-400 font-light">
              Bugün {todaySteps.toLocaleString()} adım attınız!
            </p>
            <div className="text-xs text-green-600 dark:text-green-400 font-light">
              {dailyGoal - todaySteps > 0 ? 
                `Hedefe ${(dailyGoal - todaySteps).toLocaleString()} adım kaldı` : 
                `Hedefi ${(todaySteps - dailyGoal).toLocaleString()} adım aştınız!`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Card className="bg-gradient-to-r from-blue-100/80 to-cyan-100/80 dark:from-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-blue-200/50 dark:border-blue-500/30">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 text-blue-800 dark:text-blue-200">📊 İstatistikler</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-2 bg-white/50 dark:bg-blue-900/30 rounded">
              <div className="text-blue-600 dark:text-blue-300">Ortalama</div>
              <div className="font-semibold text-blue-800 dark:text-blue-200">
                {Math.round(weeklySteps.reduce((sum, day) => sum + day.steps, 0) / 7).toLocaleString()}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-400">günlük</div>
            </div>
            <div className="text-center p-2 bg-white/50 dark:bg-blue-900/30 rounded">
              <div className="text-blue-600 dark:text-blue-300">En Yüksek</div>
              <div className="font-semibold text-blue-800 dark:text-blue-200">
                {Math.max(...weeklySteps.map(day => day.steps)).toLocaleString()}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-400">bu hafta</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Ad */}
      {!user?.isPremium && (
        <div className="w-full mt-4 pb-4">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* Hedef Ayarlama Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Günlük Adım Hedefi</DialogTitle>
            <DialogDescription>
              Günlük adım hedefinizi ayarlayın. Önerilen: 10.000 adım
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
            <div className="text-sm text-gray-500">
              {parseInt(newGoal) >= 10000 ? "🎉 Mükemmel hedef! Sağlıklı yaşam için ideal." : 
               parseInt(newGoal) >= 5000 ? "💪 İyi başlangıç! Zamanla artırabilirsin." : 
               "🌱 Küçük hedeflerle başlamak önemli!"}
            </div>
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