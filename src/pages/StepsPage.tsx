import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Footprints, Award, CalendarDays, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { StepChart } from '../components/StepChart';
import { AdPlaceholder } from '../components/AdPlaceholder';

import { useStepsStore } from '../store/stepsStore';
import { useUserStore } from '../store/userStore';

export const StepsPage: React.FC = () => {
  const {
    dailyGoal,
    todaySteps,
    weeklySteps,
    monthlySteps,
    setDailyGoal,
    updateTodaySteps,
    setWeeklySteps,
    setSupported
  } = useStepsStore();

  const { user } = useUserStore();
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  // 📌 Bu ayın toplam adımı
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyTotal = monthlySteps[monthKey] || 0;

  // 📌 Cihaz destekliyor mu?
  useEffect(() => {
    const isAndroid = /android/i.test(navigator.userAgent);
    setSupported(isAndroid);

    // Haftalık veri yoksa oluştur
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
  }, []);

  // 📌 Adım güncellemelerini dinle
  useEffect(() => {
    const handleStepUpdate = (event: any) => {
      try {
        const steps = event.detail.steps;
        console.log('Yeni adım:', steps);
        updateTodaySteps(steps);
        
        // Haftalık veriyi güncelle
        const today = new Date().toISOString().split('T')[0];
        const updatedWeekly = weeklySteps.map(day => 
          day.date === today ? { ...day, steps } : day
        );
        setWeeklySteps(updatedWeekly);

      } catch (error) {
        console.error('Adım güncelleme hatası:', error);
      }
    };

    window.addEventListener("stepUpdate", handleStepUpdate);
    
    return () => {
      window.removeEventListener("stepUpdate", handleStepUpdate);
    };
  }, [weeklySteps, updateTodaySteps, setWeeklySteps]);

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

      {/* Hedef Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Günlük Adım Hedefi</DialogTitle>
            <DialogDescription>
              Günlük adım hedefinizi ayarlayın
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