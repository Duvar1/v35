// src/pages/StepsPage.tsx

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useUserStore } from "../store/userStore";
import { useStepsStore } from "../store/stepsStore";

import { StepService } from "../plugins/stepService"; 
import { AdPlaceholder } from "../components/AdPlaceholder";

export const StepsPage: React.FC = () => {
  const { user } = useUserStore();

  const {
    dailyGoal,
    todaySteps,
    updateTodaySteps,
    addSteps,
    setServiceStarted,
    serviceStarted,
  } = useStepsStore();

  const token = user?.googleAccessToken ?? null;


  // 🚀 FOREGROUND SERVICE — ARKA PLANDA SENSÖR
  useEffect(() => {
    if (serviceStarted) return;

    StepService.addListener("stepUpdate", (data: any) => {
      const step = data.steps;
      if (step > 0) addSteps(step);
    });

    // Servisi başlat
    StepService.startService();

    setServiceStarted(true);
  }, []);

  const progress = Math.min((todaySteps / dailyGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 
      dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 p-4 space-y-6">

      {!user?.isPremium && <AdPlaceholder type="banner" />}

      <Card className="bg-gradient-to-r from-pink-50/80 via-orange-50/80 to-blue-50/80 
        dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 
        border border-pink-200/50 dark:border-purple-500/30 rounded-xl shadow-md">
        
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-light text-pink-800 dark:text-purple-200">
            Günlük Adım Sayısı
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4 text-center">
          <div className="text-6xl font-light text-orange-600 dark:text-orange-300">
            {todaySteps.toLocaleString()}
          </div>

          <Progress value={progress} className="h-3" />

          <div className="flex justify-between text-sm">
            <span className="text-pink-800 dark:text-purple-200">
              Hedef: {dailyGoal.toLocaleString()}
            </span>
            <span className="text-orange-600 dark:text-orange-300 font-medium">
              %{Math.round(progress)}
            </span>
          </div>
        </CardContent>

      </Card>

      {!user?.isPremium && <AdPlaceholder type="banner" />}
      <div className="h-12" />
    </div>
  );
};

export default StepsPage;
