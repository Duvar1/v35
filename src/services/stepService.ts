import { StepCounter } from '@/stepCounter';
import { Capacitor } from '@capacitor/core';

class StepService {
  private listenerHandle: any = null;
  private isRunning = false;
  private stepUpdateCallback: ((steps: number) => void) | null = null;

  // Store callback'ini set etmek için method
  setStepUpdateCallback(callback: (steps: number) => void) {
    this.stepUpdateCallback = callback;
  }

  async init() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Web platformunda çalışıyor, adım sayar devre dışı');
      return false;
    }

    try {
      // Eğer daha önce başlatılmışsa, direkt listener ekle
      if (this.isRunning) {
        await this.setupListener();
        return true;
      }

      // İzin kontrolü
      const permResult = await StepCounter.checkPermission();
      
      if (!permResult.granted) {
        console.log('İzin yok, kullanıcıdan istenecek');
        return false;
      }

      // Listener ekle
      await this.setupListener();

      // Servisi başlat
      await this.start();

      return true;
    } catch (error) {
      console.error('StepService init hatası:', error);
      return false;
    }
  }

  async requestPermissionAndStart() {
    try {
      console.log('İzin isteniyor...');
      const requestResult = await StepCounter.requestPermissions();
      
      if (!requestResult.granted) {
        return false;
      }

      // Listener ekle
      await this.setupListener();

      // Servisi başlat
      await this.start();

      return true;
    } catch (error) {
      console.error('İzin isteme hatası:', error);
      return false;
    }
  }

  async setupListener() {
    try {
      // Eski listener'ı kaldır
      if (this.listenerHandle) {
        await StepCounter.removeAllListeners();
      }

      // Yeni listener ekle
      this.listenerHandle = await StepCounter.addListener('stepUpdate', (data) => {
        console.log('Adım güncellendi:', data.steps);
        
        // Callback ile store'u güncelle
        if (this.stepUpdateCallback) {
          this.stepUpdateCallback(data.steps);
        }
      });

      console.log('Step listener başarıyla eklendi');
    } catch (error) {
      console.error('Listener ekleme hatası:', error);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('Servis zaten çalışıyor');
      return;
    }

    try {
      const result = await StepCounter.startService();
      this.isRunning = true;
      console.log('StepService başlatıldı:', result);
    } catch (error) {
      console.error('Servis başlatma hatası:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Servis zaten durdurulmuş');
      return;
    }

    try {
      await StepCounter.stopService();
      this.isRunning = false;
      console.log('StepService durduruldu');
    } catch (error) {
      console.error('Servis durdurma hatası:', error);
    }
  }

  async reset() {
    try {
      await StepCounter.resetSteps();
      // Callback ile sıfırla
      if (this.stepUpdateCallback) {
        this.stepUpdateCallback(0);
      }
      console.log('Adımlar sıfırlandı');
    } catch (error) {
      console.error('Sıfırlama hatası:', error);
    }
  }

  async cleanup() {
    try {
      await StepCounter.removeAllListeners();
      this.listenerHandle = null;
      this.stepUpdateCallback = null;
      console.log('Listener temizlendi');
    } catch (error) {
      console.error('Cleanup hatası:', error);
    }
  }

  getStatus() {
    return this.isRunning;
  }

  getPermissionStatus(): 'granted' | 'denied' | 'prompt' | 'unknown' {
    // Bu method StepsPage'de permission kontrolü için
    return this.isRunning ? 'granted' : 'unknown';
  }
}

export const stepService = new StepService();