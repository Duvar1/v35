import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserStore } from "../store/userStore";
import { getTodaySteps } from "../services/googleFitSteps";

export const StepsPage: React.FC = () => {
  const { user } = useUserStore();
  const accessToken = user?.googleAccessToken ?? null;

  const dailyGoal = 8000; // şimdilik sabit
  const [steps, setSteps] = useState(0);

  // İlk yüklemede ve her 5 sn'de bir günlük adım verisini çek
  useEffect(() => {
    if (!accessToken) return;

    const fetchSteps = async () => {
      const s = await getTodaySteps(accessToken);
      setSteps(s);
    };

    fetchSteps();

    const interval = setInterval(fetchSteps, 5000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const progress = Math.min((steps / dailyGoal) * 100, 100);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-light text-center">Adımlarım</h1>

      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-5xl font-light mb-2">{steps.toLocaleString()}</div>

          <Progress value={progress} className="h-3" />

          <div className="flex justify-between mt-2 text-sm">
            <span>Hedef: {dailyGoal.toLocaleString()}</span>
            <span>%{Math.round(progress)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
