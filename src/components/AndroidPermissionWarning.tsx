import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Settings, Battery, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

interface PermissionIssue {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

export const AndroidPermissionWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(true);
  const [issues, setIssues] = useState<PermissionIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkPermissions = async () => {
    if (Capacitor.getPlatform() !== 'android') return;
    
    setIsChecking(true);
    const detectedIssues: PermissionIssue[] = [];

    try {
      // 1. Bildirim izni kontrolü
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display !== 'granted') {
        detectedIssues.push({
          id: 'notification_permission',
          title: 'Bildirim İzni',
          description: 'Namaz hatırlatmaları için gerekli',
          icon: <Bell className="h-4 w-4" />,
          action: async () => {
            await LocalNotifications.requestPermissions();
            toast.success('Bildirim izni istendi');
            setTimeout(checkPermissions, 1000);
          }
        });
      }

      // 2. Notification channel kontrolü
      const channels = await LocalNotifications.listChannels();
      const prayerChannel = channels.channels?.find(c => c.id === 'prayer_reminders');
      
      if (!prayerChannel) {
        detectedIssues.push({
          id: 'notification_channel',
          title: 'Bildirim Kanalı',
          description: 'Bildirimlerin düzgün çalışması için',
          icon: <Bell className="h-4 w-4" />,
          action: async () => {
            try {
              await LocalNotifications.createChannel({
                id: 'prayer_reminders',
                name: 'Namaz Hatırlatmaları',
                description: 'Namaz vakitleri için ezan hatırlatmaları',
                importance: 5,
                sound: 'alert_sound.wav',
                vibration: true
              });
              toast.success('Bildirim kanalı oluşturuldu');
              setTimeout(checkPermissions, 1000);
            } catch (error) {
              toast.error('Kanal oluşturulamadı');
            }
          }
        });
      }

      // 3. Battery optimization kontrolü
      if ((window as any).PowerOptimization) {
        try {
          const isIgnoring = await (window as any).PowerOptimization.isIgnoringBatteryOptimizations();
          if (!isIgnoring) {
            detectedIssues.push({
              id: 'battery_optimization',
              title: 'Pil Optimizasyonu',
              description: 'Arka planda çalışması için',
              icon: <Battery className="h-4 w-4" />,
              action: () => {
                (window as any).PowerOptimization.requestIgnoreBatteryOptimizations()
                  .then(() => {
                    toast.success('Pil optimizasyonu ayarı açıldı');
                    setTimeout(checkPermissions, 1000);
                  })
                  .catch(() => toast.error('Ayar açılamadı'));
              }
            });
          }
        } catch {}
      }

      // 4. Exact Alarm izni (Android 12+)
      const sdkVersion = (window as any).device?.version || 0;
      if (parseInt(sdkVersion) >= 31) {
        try {
          const { checkExactAlarmPermission } = await import('../services/exactAlarmService');
          const hasExact = await checkExactAlarmPermission();
          
          if (!hasExact) {
            detectedIssues.push({
              id: 'exact_alarm',
              title: 'Tam Zamanlı Alarm',
              description: 'Tam vaktinde bildirim için',
              icon: <AlertTriangle className="h-4 w-4" />,
              action: async () => {
                const { requestExactAlarmPermission } = await import('../services/exactAlarmService');
                await requestExactAlarmPermission();
                toast.info('Tam zamanlı alarm izni istendi');
                setTimeout(checkPermissions, 1000);
              }
            });
          }
        } catch {}
      }

    } catch (error) {
      console.error('Permission check error:', error);
    }

    setIssues(detectedIssues);
    setIsChecking(false);
    
    // Eğer sorun kalmadıysa warning'i kapat
    if (detectedIssues.length === 0 && showWarning) {
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  useEffect(() => {
    checkPermissions();
    
    // Her 30 saniyede bir kontrol et
    const interval = setInterval(checkPermissions, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showWarning || issues.length === 0) return null;

  const openAndroidSettings = () => {
    if (Capacitor.getPlatform() === 'android') {
      // Android ayarlarını aç
      window.open('intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;end', '_system');
    }
  };

  const handleFixAll = async () => {
    for (const issue of issues) {
      if (issue.action) {
        await issue.action();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    await checkPermissions();
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/80 backdrop-blur-sm shadow-sm mx-2 my-1">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-yellow-800 text-sm">
                  Android Ayarları Gerekli
                </h3>
                <button 
                  onClick={() => setShowWarning(false)}
                  className="text-yellow-500 hover:text-yellow-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-xs text-yellow-700 mt-1 mb-2">
                Bildirimlerin düzgün çalışması için:
              </p>
              
              <div className="space-y-1.5">
                {issues.map((issue) => (
                  <div 
                    key={issue.id} 
                    className="flex items-center justify-between bg-yellow-100/50 p-1.5 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600">{issue.icon}</span>
                      <div>
                        <p className="text-xs font-medium text-yellow-800">{issue.title}</p>
                        <p className="text-xs text-yellow-600">{issue.description}</p>
                      </div>
                    </div>
                    
                    {issue.action && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-yellow-700 hover:text-yellow-900 hover:bg-yellow-200"
                        onClick={issue.action}
                        disabled={isChecking}
                      >
                        Düzelt
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2 mt-3">
                {issues.length > 1 && (
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={handleFixAll}
                    disabled={isChecking}
                  >
                    {isChecking ? 'Kontrol Ediliyor...' : 'Tümünü Düzelt'}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={openAndroidSettings}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Ayarlar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};