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
  private pollingInterval: any = null;

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
      // Android için basit izin kontrolü
      // Gerçek uygulamada permission API kullanılacak
      return "granted";
    } catch (error) {
      console.error("Permission check error:", error);
      return "denied";
    }
  }

  // ------------------------------------------------
  // 3) Adım takibini başlat - SADELEŞTİRİLMİŞ
  // ------------------------------------------------
  async startTracking(onStep: (steps: number) => void): Promise<void> {
    if (this.isTracking) return;
    
    this.stepUpdateListener = onStep;
    this.isTracking = true;

    console.log("🟢 Step tracking starting... Platform:", Capacitor.getPlatform());

    // 🔥 ANDROID - Native step tracking (simülasyon)
    if (this.isSupported()) {
      this.startAndroidSimulation(onStep);
      return;
    }

    // 🌐 WEB fallback - DeviceMotion
    console.log("Using web motion fallback");
    this.startWebFallback(onStep);
  }

  // ------------------------------------------------
  // 4) Android Simulation - Plugin yoksa
  // ------------------------------------------------
  private startAndroidSimulation(onStep: (steps: number) => void) {
    let simulatedSteps = this.stepCount;
    
    this.pollingInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(this.pollingInterval);
        return;
      }

      // Rastgele 0-3 adım ekle (simülasyon)
      const newSteps = Math.floor(Math.random() * 4);
      simulatedSteps += newSteps;
      
      this.stepCount = simulatedSteps;
      onStep(simulatedSteps);
      console.log("📱 Simulated Android steps:", simulatedSteps);
    }, 5000); // 5 saniyede bir
  }

  // ------------------------------------------------
  // 5) Web Fallback - DeviceMotion
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
  // 6) Takibi durdur
  // ------------------------------------------------
  async stopTracking(): Promise<void> {
    this.isTracking = false;
    this.stepUpdateListener = null;

    console.log("🔴 Stopping step tracking...");

    // Interval'ı temizle
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    // Web fallback'ı durdur
    if ((window as any).__stepHandler) {
      window.removeEventListener("devicemotion", (window as any).__stepHandler);
      delete (window as any).__stepHandler;
    }
  }

  // ------------------------------------------------
  // 7) Anlık Adım Sayısı
  // ------------------------------------------------
  getCurrentSteps(): number {
    return this.stepCount;
  }

  // ------------------------------------------------
  // 8) Haftalık Boş Veri
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
  // 9) Adımları Sıfırla
  // ------------------------------------------------
  resetSteps() {
    this.stepCount = 0;
    console.log("🔄 Steps reset to 0");
  }

  // ------------------------------------------------
  // 10) Manuel Adım Ekle (Test için)
  // ------------------------------------------------
  addManualSteps(count: number) {
    this.stepCount += count;
    this.stepUpdateListener?.(this.stepCount);
    console.log(`➕ Added ${count} manual steps, total: ${this.stepCount}`);
  }
}