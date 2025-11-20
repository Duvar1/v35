import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Footprints, Target, Play, Pause, Settings, Award, CalendarDays } from 'lucide-react';

import { StepChart } from '../components/StepChart';
import { AdPlaceholder } from '../components/AdPlaceholder';

import { useStepsStore } from '../store/stepsStore';
import { useUserStore } from '../store/userStore';
import { StepsService } from '../services/stepsService';

export const StepsPage: React.FC = () => {
  const {
    dailyGoal,
    todaySteps,
    weeklySteps,
    monthlySteps,
    isSupported,
    permission,
    setDailyGoal,
    updateTodaySteps,
    setWeeklySteps,
    setSupported,
    setPermission,
  } = useStepsStore();

  const { user } = useUserStore();
  const [isTracking, setIsTracking] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());

  const stepsService = StepsService.getInstance();

  // 📌 Şu ayın toplam adımı
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyTotal = monthlySteps[monthKey] || 0;

  useEffect(() => {
    const supported = stepsService.isSupported();
    setSupported(supported);

    // İlk yüklemede haftalık boş liste oluştur
    if (weeklySteps.length === 0) {
      const emptyWeek = stepsService.getEmptyWeeklyData();
      setWeeklySteps(emptyWeek);
    }
  }, []);

  const handleStartTracking = async () => {
    if (!isSupported) {
      alert('Bu cihazda adım sayar desteklenmiyor');
      return;
    }

    try {
      const permissionStatus = await stepsService.requestPermission();
      setPermission(permissionStatus);

      if (permissionStatus === 'granted') {
        await stepsService.startTracking((steps) => {
          updateTodaySteps(steps);
        });
        setIsTracking(true);
      } else {
        alert('Adım sayar için izin gerekli');
      }
    } catch (error) {
      console.error('Failed to start step tracking:', error);
      alert('Adım sayar başlatılamadı: ' + (error as Error).message);
    }
  };

  const handleStopTracking = () => {
    stepsService.stopTracking();
    setIsTracking(false);
  };

  const handleUpdateGoal = () => {
    const goal = parseInt(newGoal);
    if (goal > 0) {
      setDailyGoal(goal);
    }
  };

  const progressPercentage = Math.min((todaySteps / dailyGoal) * 100, 100);
  const isGoalAchieved = todaySteps >= dailyGoal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 p-4 space-y-6 no-horizontal-scroll">

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
        </CardContent>
      </Card>

      {/* 📅 MONTHLY TOTAL CARD */}
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

      {/* Step Tracking */}
      <Card className="bg-gradient-to-r from-pink-50/80 via-orange-50/80 to-blue-50/80 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-light text-pink-800 dark:text-purple-200">
            <Settings className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
            <span>Adım Takibi</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="bg-gradient-to-r from-red-100/80 to-pink-100/80 dark:from-red-900/40 dark:to-pink-900/40 p-4 rounded-lg text-red-700 dark:text-red-300 text-sm border border-red-200/50 dark:border-red-500/30">
              ⚠️ Bu cihazda otomatik adım sayar desteklenmiyor.
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-light text-pink-800 dark:text-purple-200">Otomatik Takip</span>

              <Button
                onClick={isTracking ? handleStopTracking : handleStartTracking}
                variant={isTracking ? 'destructive' : 'default'}
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 border-0 text-white font-light"
              >
                {isTracking ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" /> Durdur
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Başlat
                  </>
                )}
              </Button>
            </div>
          )}

          {permission === 'denied' && (
            <p className="text-red-600 dark:text-red-400 text-sm font-light">
              Hareket sensörü izni reddedildi. Tarayıcı ayarlarından açmalısınız.
            </p>
          )}

          {/* Goal */}
          <div className="space-y-2">
            <label className="font-light flex items-center space-x-2 text-pink-800 dark:text-purple-200">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span>Günlük Hedef</span>
            </label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                min="1000"
                max="50000"
                className="flex-1 bg-white/70 dark:bg-gray-800/70 border-pink-200/50 dark:border-purple-500/30 font-light"
                placeholder="Günlük hedefiniz"
              />
              <Button 
                onClick={handleUpdateGoal} 
                variant="outline"
                className="bg-gradient-to-r from-pink-100/80 to-blue-100/80 dark:from-purple-800/60 dark:to-cyan-800/60 border-pink-200/50 dark:border-purple-500/30 text-pink-800 dark:text-purple-200 font-light hover:from-pink-200/80 hover:to-blue-200/80"
              >
                Güncelle
              </Button>
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

      {/* Weekly Chart */}
      <StepChart weeklySteps={weeklySteps} dailyGoal={dailyGoal} />

      {/* Motivational Message */}
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

      {/* Bottom Ad - DÜZELTİLDİ */}
      {!user?.isPremium && (
        <div className="w-full mt-6 pb-4">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* Bottom spacing for menu */}
      <div className="h-4"></div>
    </div>
  );
};