import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DailySteps {
  date: string;
  steps: number;
}

interface StepChartProps {
  weeklySteps: DailySteps[];
  dailyGoal: number;
}

export const StepChart: React.FC<StepChartProps> = ({ weeklySteps, dailyGoal }) => {
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    return days[date.getDay()];
  };

  const maxSteps = Math.max(...weeklySteps.map(day => day.steps), dailyGoal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Haftalık Adım Özeti</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {weeklySteps.map((day, index) => {
            const percentage = (day.steps / maxSteps) * 100;
            const goalAchieved = day.steps >= dailyGoal;
            
            return (
              <div key={day.date} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {getDayName(day.date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${goalAchieved ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {day.steps.toLocaleString()}
                    </span>
                    {goalAchieved && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className="h-3"
                  />
                  {/* Goal line indicator */}
                  <div 
                    className="absolute top-0 h-3 w-0.5 bg-orange-400"
                    style={{ left: `${(dailyGoal / maxSteps) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Günlük Hedef</span>
            <span className="font-medium">{dailyGoal.toLocaleString()} adım</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};