import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Footprints, Target, Play, Pause, Settings, Award } from 'lucide-react';
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
    isSupported,
    permission,
    setDailyGoal,
    updateTodaySteps,
    setWeeklySteps,
    setSupported,
    setPermission
  } = useStepsStore();

  const { user } = useUserStore();
  const [isTracking, setIsTracking] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());
  const stepsService = StepsService.getInstance();

  useEffect(() => {
    // Check if step tracking is supported
    const supported = stepsService.isSupported();
    setSupported(supported);

    // Load weekly dummy data if no data exists
    if (weeklySteps.length === 0) {
      const dummyData = stepsService.getWeeklyDummyData();
      setWeeklySteps(dummyData);
    }

    // Set today's steps to dummy value if zero
    if (todaySteps === 0) {
      const dummySteps = stepsService.generateDummySteps();
      updateTodaySteps(dummySteps);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Adımlarım
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Günlük adım hedefinizi takip edin
        </p>
      </div>

      {/* Top Ad */}
      {!user?.isPremium && (
        <AdPlaceholder type="banner" className="max-w-md mx-auto" />
      )}

      {/* Today's Steps */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Footprints className="h-8 w-8 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Bugünkü Adımlar
            </h2>
          </div>
          
          <div className="text-5xl font-bold text-blue-700 dark:text-blue-100 mb-2">
            {todaySteps.toLocaleString()}
          </div>
          
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-300">
                Hedef: {dailyGoal.toLocaleString()}
              </span>
              <span className={`font-medium ${isGoalAchieved ? 'text-green-600' : 'text-blue-600'}`}>
                %{Math.round(progressPercentage)}
              </span>
            </div>
            
            {isGoalAchieved && (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <Award className="h-5 w-5" />
                <span className="font-medium">Günlük hedef tamamlandı! 🎉</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Tracking Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Adım Takibi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">
                ⚠️ Bu cihazda otomatik adım sayar desteklenmiyor. Manuel olarak adım sayınızı girebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Otomatik Takip</span>
                <Button
                  onClick={isTracking ? handleStopTracking : handleStartTracking}
                  variant={isTracking ? "destructive" : "default"}
                  size="sm"
                >
                  {isTracking ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Durdur
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Başlat
                    </>
                  )}
                </Button>
              </div>
              
              {permission === 'denied' && (
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Hareket sensörü izni reddedildi. Tarayıcı ayarlarından izin verebilirsiniz.
                </p>
              )}
            </div>
          )}
          
          {/* Goal Setting */}
          <div className="space-y-2">
            <label className="font-medium flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Günlük Hedef</span>
            </label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Günlük adım hedefi"
                min="1000"
                max="50000"
              />
              <Button onClick={handleUpdateGoal} variant="outline">
                Güncelle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Ad */}
      {!user?.isPremium && (
        <AdPlaceholder type="banner" className="max-w-md mx-auto" />
      )}

      {/* Weekly Chart */}
      <StepChart weeklySteps={weeklySteps} dailyGoal={dailyGoal} />

      {/* Motivational Message */}
      <Card className="border-l-4 border-l-green-400">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">💪 Günün Motivasyonu</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm italic">
            "Her adım, sağlığınıza doğru atılmış bir adımdır. Allah'ın size verdiği bu nimetin kıymetini bilin."
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Bugün {todaySteps.toLocaleString()} adım attınız, harika! 🚶‍♂️
          </p>
        </CardContent>
      </Card>

      {/* Bottom Ad */}
      {!user?.isPremium && (
        <AdPlaceholder type="banner" className="max-w-md mx-auto" />
      )}

      {/* Technical Note */}
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            TODO: DeviceMotion API ile gerçek adım sayımı entegre edilecek
          </p>
        </CardContent>
      </Card>
    </div>
  );
};