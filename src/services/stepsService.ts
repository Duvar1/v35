// src/services/stepsService.ts
import { Capacitor } from "@capacitor/core";

export interface DailySteps {
  date: string;
  steps: number;
}

export class StepsService {
  private static instance: StepsService;

  private stepCount = 0; // Web fallback sayacı
  private isTracking = false;
  private lastAcc: DeviceMotionEventAcceleration | null = null;

  static getInstance(): StepsService {
    if (!this.instance) this.instance = new StepsService();
    return this.instance;
  }

  // ------------------------------
  // 1) Destek kontrolü
  // ------------------------------
  isSupported(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    return "DeviceMotionEvent" in window;
  }

  // ------------------------------
  // 2) Hareket sensörü izni
  // ------------------------------
  async requestPermission(): Promise<"granted" | "denied"> {
    if (!this.isSupported()) return "denied";

    if (Capacitor.isNativePlatform()) return "granted";

    // iOS 13+
    const motion = DeviceMotionEvent as any;
    if (motion.requestPermission) {
      try {
        const res = await motion.requestPermission();
        return res === "granted" ? "granted" : "denied";
      } catch {
        return "denied";
      }
    }

    return "granted";
  }

  // ------------------------------
  // 3) Native adım sensöründen veri çekme (Capacitor 6)
  // ------------------------------
 async getNativeSteps(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return this.stepCount;

  try {
    const result = await (window as any).Capacitor.Plugins.Steps.getSteps();
    return result.steps ?? 0;
  } catch {
    return 0;
  }
}

  // ------------------------------
  // 4) Adım takibi başlat
  // ------------------------------
  async startTracking(onStep: (steps: number) => void): Promise<void> {
    if (this.isTracking) return;
    this.isTracking = true;

    // 🔥 Native cihaz → gerçek sensör
    if (Capacitor.isNativePlatform()) {
      setInterval(async () => {
        const steps = await this.getNativeSteps();
        onStep(Math.floor(steps));
      }, 1500);

      return;
    }

    // ---- WEB FALLBACK ----
    window.addEventListener("devicemotion", this.motionHandler(onStep));
  }

  private motionHandler(onStep: (steps: number) => void) {
    return (event: DeviceMotionEvent) => {
      if (!this.isTracking) return;

      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      if (this.lastAcc) {
        const dy = Math.abs((acc.y ?? 0) - (this.lastAcc.y ?? 0));
        if (dy > 2) {
          this.stepCount++;
          onStep(this.stepCount);
        }
      }

      this.lastAcc = acc;
    };
  }

  // ------------------------------
  // 5) Takibi durdur
  // ------------------------------
  stopTracking() {
    this.isTracking = false;
    window.removeEventListener("devicemotion", this.motionHandler(() => {}));
  }

  // ------------------------------
  // 6) Güncel adım
  // ------------------------------
  getCurrentSteps(): number {
    return this.stepCount;
  }

  // ------------------------------
  // 7) Haftalık boş data
  // ------------------------------
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

  // ------------------------------
  // 8) Dummy step (sadece web için)
  // ------------------------------
  generateDummySteps(): number {
    return Math.floor(Math.random() * 8000) + 1000;
  }
}
