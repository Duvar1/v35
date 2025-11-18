import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Bell } from 'lucide-react';

interface CountdownTimerProps {
  nextPrayer: { name: string; time: string } | null;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ nextPrayer }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!nextPrayer) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const [hours, minutes] = nextPrayer.time.split(':').map(Number);
      
      const nextPrayerTime = new Date();
      nextPrayerTime.setHours(hours, minutes, 0, 0);
      
      // If the prayer time has passed today, set it for tomorrow
      if (nextPrayerTime <= now) {
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
      }
      
      const diff = nextPrayerTime.getTime() - now.getTime();
      
      if (diff > 0) {
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft({
          hours: hoursLeft,
          minutes: minutesLeft,
          seconds: secondsLeft
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately
    calculateTimeLeft();
    
    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [nextPrayer]);

  if (!nextPrayer) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200/50 dark:border-blue-700/50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
            <Clock className="h-5 w-5" />
            <span className="font-light">Namaz vakti bilgisi yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200/50 dark:border-blue-700/50 shadow-sm">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Next Prayer Info */}
          <div className="flex items-center justify-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
              Sıradaki Namaz: {nextPrayer.name}
            </h3>
          </div>
          
          {/* Prayer Time */}
          <div className="text-2xl font-mono font-semibold text-blue-700 dark:text-blue-300">
            {nextPrayer.time}
          </div>
          
          {/* Countdown */}
          <div className="space-y-2">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-light">
              Kalan süre:
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {formatTime(timeLeft.hours)}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-light">
                  Saat
                </div>
              </div>
              <div className="text-2xl text-blue-600 dark:text-blue-400">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {formatTime(timeLeft.minutes)}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-light">
                  Dakika
                </div>
              </div>
              <div className="text-2xl text-blue-600 dark:text-blue-400">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {formatTime(timeLeft.seconds)}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-light">
                  Saniye
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4 text-xs text-blue-500 dark:text-blue-400 font-light">
            🕌 Namaz vaktine hazırlanın
          </div>
        </div>
      </CardContent>
    </Card>
  );
};