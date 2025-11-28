// src/pages/StepsPage.tsx

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserStore } from "../store/userStore";
import { getTodaySteps } from "../services/googleFitSteps";

export const StepsPage: React.FC = () => {
  const { user } = useUserStore();
  const accessToken = user?.googleAccessToken ?? null;

  const dailyGoal = 8000;
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (!accessToken) return;

    const fn = async () => {
      const s = await getTodaySteps(accessToken);
      setSteps(s);
    };

    fn();
    const interval = setInterval(fn, 5000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const progress = Math.min((steps / dailyGoal) * 100, 100);

  return (
    <div className="p-5 space-y-4">

      <h1 className="text-3xl font-light text-center tracking-wide">
        Günlük Adımlarım
      </h1>

      <Card className="shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center space-y-4">

          <div className="text-6xl font-light">
            {steps.toLocaleString()}
          </div>

          <Progress value={progress} className="h-4 rounded-full" />

          <div className="flex justify-between text-gray-500 text-sm">
            <span>Hedef: {dailyGoal.toLocaleString()}</span>
            <span>%{Math.round(progress)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Reklam Alanı */}
      <div className="mt-8">
        <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500">
          Reklam Alanı
        </div>
      </div>

    </div>
  );
};
