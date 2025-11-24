import { StepCounter } from '@/stepCounter';
import { Capacitor } from '@capacitor/core';

class StepService {
  private listenerHandle: any = null;
  private isRunning = false;
  private stepUpdateCallback: ((steps: number) => void) | null = null;

  setStepUpdateCallback(callback: (steps: number) => void) {
    this.stepUpdateCallback = callback;
  }

  async init(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Web platformunda çalışıyor, adım sayar devre dışı');
      return false;
    }

    try {
      // İzin kontrolü - Capacitor 7 formatında
      const permResult = await StepCounter.checkPermissions();
      
      if (permResult.activity_recognition !== 'granted') {
        console.log('İzin yok, kullanıcıdan istenecek');
        return false;
      }

      // Listener ekle
      await this.setupListener();

      // Servisi başlat
      await this.startStepCounting();

      return true;
    } catch (error) {
      console.error('StepService init hatası:', error);
      return false;
    }
  }

  async requestPermissionAndStart(): Promise<boolean> {
    try {
      console.log('İzin isteniyor...');
      const requestResult = await StepCounter.requestPermissions();
      
      if (requestResult.activity_recognition !== 'granted') {
        return false;
      }

      // Listener ekle
      await this.setupListener();

      // Servisi başlat
      await this.startStepCounting();

      return true;
    } catch (error) {
      console.error('İzin isteme hatası:', error);
      return false;
    }
  }

  async setupListener(): Promise<void> {
    try {
      // Eski listener'ı kaldır
      if (this.listenerHandle) {
        // PluginListenerHandle tipinde remove methodu var
        if (typeof this.listenerHandle.remove === 'function') {
          this.listenerHandle.remove();
        }
      }

      // Yeni listener ekle - Capacitor 7 formatında
      this.listenerHandle = await StepCounter.addListener('stepCountUpdate', (data: { stepCount: number }) => {
        console.log('Adım güncellendi:', data.stepCount);
        
        if (this.stepUpdateCallback) {
          this.stepUpdateCallback(data.stepCount);
        }
      });

      console.log('Step listener başarıyla eklendi');
    } catch (error) {
      console.error('Listener ekleme hatası:', error);
    }
  }

  async startStepCounting(): Promise<void> {
    if (this.isRunning) {
      console.log('Servis zaten çalışıyor');
      return;
    }

    try {
      const result = await StepCounter.startStepCounting();
      this.isRunning = true;
      console.log('Step counting başlatıldı:', result);
    } catch (error) {
      console.error('Step counting başlatma hatası:', error);
      throw error;
    }
  }

  async stopStepCounting(): Promise<void> {
    if (!this.isRunning) {
      console.log('Servis zaten durdurulmuş');
      return;
    }

    try {
      await StepCounter.stopStepCounting();
      this.isRunning = false;
      console.log('Step counting durduruldu');
    } catch (error) {
      console.error('Step counting durdurma hatası:', error);
    }
  }

  async getCurrentStepCount(): Promise<number> {
    try {
      const result = await StepCounter.getStepCount();
      return result.stepCount;
    } catch (error) {
      console.error('Adım sayısı alma hatası:', error);
      return 0;
    }
  }

  async resetStepCount(): Promise<void> {
    try {
      // Capacitor 7'de reset metodu yoksa, local state'i sıfırla
      if (this.stepUpdateCallback) {
        this.stepUpdateCallback(0);
      }
      console.log('Adımlar sıfırlandı');
    } catch (error) {
      console.error('Sıfırlama hatası:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.listenerHandle) {
        // PluginListenerHandle tipinde remove methodu var
        if (typeof this.listenerHandle.remove === 'function') {
          this.listenerHandle.remove();
        }
        this.listenerHandle = null;
      }
      this.stepUpdateCallback = null;
      console.log('Listener temizlendi');
    } catch (error) {
      console.error('Cleanup hatası:', error);
    }
  }

  getStatus(): boolean {
    return this.isRunning;
  }

  getPermissionStatus(): 'granted' | 'denied' | 'prompt' | 'unknown' {
    return this.isRunning ? 'granted' : 'unknown';
  }
}

export const stepService = new StepService();