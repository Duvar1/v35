import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Footprints, Award, CalendarDays, Target, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { StepChart } from '../components/StepChart';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { useStepsStore } from '../store/stepsStore';
import { useUserStore } from '../store/userStore';

declare global {
  interface Window {
    getGoogleFitSteps: () => Promise<number>;
  }
}


export const StepsPage: React.FC = () => {
  const {
    dailyGoal,
    todaySteps,
    weeklySteps,
    monthlySteps,
    setDailyGoal,
    setWeeklySteps,
    updateTodaySteps
  } = useStepsStore();

  const { user } = useUserStore();

  const [newGoal, setNewGoal] = useState(dailyGoal.toString());
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyTotal = monthlySteps[monthKey] || 0;

// Google Fit steps fetcher
const fetchSteps = useCallback(async () => {
  try {
    if (!user?.isGoogleFitAuthorized || !user.googleAccessToken) return;

    const steps = await window.getGoogleFitSteps();

    if (steps > 0) updateTodaySteps(steps);

  } catch (err) {
    console.error('❌ Step fetch error:', err);
  }
}, [user, updateTodaySteps]);


  // App open + every 30 seconds fetch
  useEffect(() => {
    fetchSteps();
    const interval = setInterval(fetchSteps, 30000);
    return () => clearInterval(interval);
  }, [fetchSteps]);

  // Weekly mock data (UI için)
  useEffect(() => {
    if (weeklySteps.length === 0) {
      const today = new Date();
      const mock: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        mock.push({
          date: d.toISOString().split("T")[0],
          steps: Math.floor(Math.random() * 3000) + 1000
        });
      }
      setWeeklySteps(mock);
    }
  }, []);

  const handleResetSteps = async () => {
    updateTodaySteps(0);
    toast.info("Adımlar sıfırlandı. Google Fit yeni veri gönderene kadar 0 görünür.");
  };

  const handleGoalUpdate = () => {
    const goal = parseInt(newGoal) || 10000;
    if (goal >= 1000 && goal <= 50000) {
      setDailyGoal(goal);
      setShowGoalDialog(false);
      toast.success(`Hedef ${goal.toLocaleString()} adım olarak güncellendi`);
    }
  };

  const progress = Math.min((todaySteps / dailyGoal) * 100, 100);
  const isDone = todaySteps >= dailyGoal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 p-4 space-y-6">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">Adımlarım</h1>
        <p className="text-pink-600 dark:text-purple-400 font-light">Günlük adım hedefinizi takip edin</p>

        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          user?.isGoogleFitAuthorized 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        }`}>
          {user?.isGoogleFitAuthorized ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Google Fit Bağlı - {user.email}
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              Google Fit Bağlı Değil
            </>
          )}
        </div>
      </div>

      {!user?.isPremium && (
        <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
      )}

      {/* TODAY STEPS */}
      <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm">
        <CardContent className="p-6 text-center">

          <div className="flex items-center justify-center mb-4">
            <Footprints className="h-8 w-8 text-pink-600 dark:text-purple-300 mr-2" />
            <h2 className="text-lg font-light text-pink-800 dark:text-purple-200">Bugünkü Adımlar</h2>
          </div>

          <div className="text-5xl font-light text-pink-700 dark:text-purple-100 mb-2">
            {todaySteps.toLocaleString()}
          </div>

          <Progress value={progress} />

          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-pink-600 dark:text-purple-300 font-light">
              Hedef: {dailyGoal.toLocaleString()}
            </span>
            <span className={`${isDone ? "text-green-600" : "text-pink-600 dark:text-purple-300"} font-light`}>
              %{Math.round(progress)}
            </span>
          </div>

          {isDone && (
            <div className="flex items-center justify-center gap-2 text-green-600 mt-3">
              <Award className="h-5 w-5" />
              <span>Günlük hedef tamamlandı! 🎉</span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowGoalDialog(true)}>
              <Target className="h-4 w-4 mr-1" /> Hedefi Değiştir
            </Button>

            <Button variant="outline" size="sm" onClick={handleResetSteps}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* MONTHLY */}
      <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            <h3 className="font-light text-pink-800 dark:text-purple-200">Bu Ayki Toplam Adım</h3>
          </div>
          <p className="text-3xl font-light text-purple-700 dark:text-purple-300">
            {monthlyTotal.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <StepChart weeklySteps={weeklySteps} dailyGoal={dailyGoal} />

      {/* GOAL DIALOG */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Günlük Adım Hedefi</DialogTitle>
            <DialogDescription>1000–50000 arası bir değer girin</DialogDescription>
          </DialogHeader>

          <Input
            type="number"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>İptal</Button>
            <Button onClick={handleGoalUpdate}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-4"></div>
    </div>
  );
};
