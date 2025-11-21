// src/services/stepsService.ts
import { Capacitor } from "@capacitor/core";

export interface DailySteps {
  date: string;
  steps: number;
}

export class StepsService {
  private static instance: StepsService;

  private stepCount = 0;
  private isTracking = false;
  private lastAcc: DeviceMotionEventAcceleration | null = null;
  private stepUpdateListener: ((steps: number) => void) | null = null;

  static getInstance(): StepsService {
    if (!this.instance) this.instance = new StepsService();
    return this.instance;
  }

  // ------------------------------------------------
  // 1) Destek kontrolü - Android foreground service
  // ------------------------------------------------
  isSupported(): boolean {
    // Sadece Android native destekleniyor
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  // ------------------------------------------------
  // 2) İzin kontrolü - Android'de runtime permission
  // ------------------------------------------------
  async requestPermission(): Promise<"granted" | "denied"> {
    if (!this.isSupported()) return "denied";

    try {
      // Android için ACTIVITY_RECOGNITION izni kontrolü
      const { StepTracker } = await this.getStepTrackerPlugin();
      const permissionResult = await StepTracker.checkPermission();
      return permissionResult.granted ? "granted" : "denied";
    } catch (error) {
      console.error("Permission check error:", error);
      return "denied";
    }
  }

  // ------------------------------------------------
  // 3) Foreground Service Başlat - KALICI BİLDİRİM
  // ------------------------------------------------
  async startTracking(onStep: (steps: number) => void): Promise<void> {
    if (this.isTracking) return;
    
    this.stepUpdateListener = onStep;
    this.isTracking = true;

    console.log("🟢 Foreground service starting...");

    // 🔥 ANDROID - Foreground Service ile kalıcı adım sayma
    if (this.isSupported()) {
      try {
        const { StepTracker } = await this.getStepTrackerPlugin();
        
        // Foreground service başlat
        const result = await StepTracker.startStepService();
        console.log("✅ Foreground service started:", result);

        // Step güncellemelerini dinle
        this.setupStepListener();

        // Polling ile steps kontrol et (fallback)
        this.startPolling();

      } catch (error) {
        console.error("❌ Service start failed:", error);
        this.isTracking = false;
      }
      return;
    }

    // 🌐 WEB fallback - DeviceMotion
    console.log("Using web motion fallback");
    this.startWebFallback(onStep);
  }

  // ------------------------------------------------
  // 4) Step Güncellemelerini Dinle - Event Listener
  // ------------------------------------------------
  private setupStepListener() {
    // Native taraftan gelen step güncellemelerini dinle
    const handleStepUpdate = (event: any) => {
      if (!this.isTracking) return;
      
      const steps = event.detail || event.steps || 0;
      console.log("📊 Steps updated from service:", steps);
      
      this.stepCount = steps;
      this.stepUpdateListener?.(steps);
    };

    // Event listener'ı ekle
    window.addEventListener('stepUpdate', handleStepUpdate);
    
    // Cleanup için referans sakla
    (window as any).__stepUpdateHandler = handleStepUpdate;
  }

  // ------------------------------------------------
  // 5) Polling - Fallback mekanizması
  // ------------------------------------------------
  private startPolling() {
    const poll = async () => {
      if (!this.isTracking) return;

      try {
        const steps = await this.getCurrentStepsFromService();
        if (steps > this.stepCount) {
          this.stepCount = steps;
          this.stepUpdateListener?.(steps);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }

      // Her 5 saniyede bir kontrol et
      setTimeout(poll, 5000);
    };

    poll();
  }

  // ------------------------------------------------
  // 6) Service'den Anlık Adım Verisi Al
  // ------------------------------------------------
  private async getCurrentStepsFromService(): Promise<number> {
    if (!this.isSupported()) return this.stepCount;

    try {
      const { StepTracker } = await this.getStepTrackerPlugin();
      const result = await StepTracker.getCurrentSteps();
      return result.steps || 0;
    } catch (error) {
      console.error("Get steps error:", error);
      return this.stepCount;
    }
  }

  // ------------------------------------------------
  // 7) Foreground Service Durdur
  // ------------------------------------------------
  async stopTracking(): Promise<void> {
    this.isTracking = false;
    this.stepUpdateListener = null;

    console.log("🔴 Stopping foreground service...");

    // Event listener'ı temizle
    if ((window as any).__stepUpdateHandler) {
      window.removeEventListener('stepUpdate', (window as any).__stepUpdateHandler);
      delete (window as any).__stepUpdateHandler;
    }

    // Web fallback'ı durdur
    if ((window as any).__stepHandler) {
      window.removeEventListener("devicemotion", (window as any).__stepHandler);
      delete (window as any).__stepHandler;
    }

    // Android service'i durdur
    if (this.isSupported()) {
      try {
        const { StepTracker } = await this.getStepTrackerPlugin();
        await StepTracker.stopStepService();
        console.log("✅ Service stopped");
      } catch (error) {
        console.error("Service stop error:", error);
      }
    }
  }

  // ------------------------------------------------
  // 8) Web Fallback - DeviceMotion
  // ------------------------------------------------
  private startWebFallback(onStep: (steps: number) => void) {
    const handler = this.createMotionHandler(onStep);
    (window as any).__stepHandler = handler;
    window.addEventListener("devicemotion", handler);
  }

  private createMotionHandler(onStep: (steps: number) => void) {
    return (event: DeviceMotionEvent) => {
      if (!this.isTracking) return;
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      if (this.lastAcc) {
        const diff = Math.abs((acc.y ?? 0) - (this.lastAcc.y ?? 0));
        if (diff > 1.5) {
          this.stepCount++;
          onStep(this.stepCount);
        }
      }

      this.lastAcc = acc;
    };
  }

  // ------------------------------------------------
  // 9) Plugin Helper - Dynamic Import
  // ------------------------------------------------
  private async getStepTrackerPlugin() {
    if (Capacitor.isNativePlatform()) {
      return await import('../capacitor-plugins/step-tracker');
    }
    return { StepTracker: null };
  }

  // ------------------------------------------------
  // 10) Servis Durumu Kontrolü
  // ------------------------------------------------
  async isServiceRunning(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const { StepTracker } = await this.getStepTrackerPlugin();
      const result = await StepTracker.isServiceRunning();
      return result.running || false;
    } catch (error) {
      return false;
    }
  }

  // ------------------------------------------------
  // 11) Anlık Adım Sayısı
  // ------------------------------------------------
  getCurrentSteps(): number {
    return this.stepCount;
  }

  // ------------------------------------------------
  // 12) Haftalık Boş Veri
  // ------------------------------------------------
  getEmptyWeeklyData(): DailySteps[] {
    const weekly: DailySteps[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      weekly.push({
        date: d.toISOString().split("T")[0],
        steps: 0,
      });
    }

    return weekly;
  }

  // ------------------------------------------------
  // 13) Adımları Sıfırla
  // ------------------------------------------------
  resetSteps() {
    this.stepCount = 0;
    console.log("🔄 Steps reset to 0");
  }

  // ------------------------------------------------
  // 14) Servisi Manuel Başlat (Uygulama açıldığında)
  // ------------------------------------------------
  async startServiceOnAppLaunch(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const isRunning = await this.isServiceRunning();
      if (!isRunning) {
        console.log("🚀 Starting service on app launch...");
        const { StepTracker } = await this.getStepTrackerPlugin();
        await StepTracker.startStepService();
      }
    } catch (error) {
      console.error("App launch service start error:", error);
    }
  }
}