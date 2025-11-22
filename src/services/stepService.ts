import { StepCounter } from '../stepCounter';
import { useStepsStore } from '../store/stepsStore';
import { Capacitor } from '@capacitor/core';

class StepService {
  private listenerHandle: any = null;
  private isRunning = false;

  async init() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Web platformunda çalışıyor, adım sayar devre dışı');
      return false;
    }

    try {
      const store = useStepsStore.getState();
      
      // Eğer daha önce başlatılmışsa, direkt listener ekle
      if (store.serviceStarted) {
        await this.setupListener();
        this.isRunning = true;
        return true;
      }

      // İzin kontrolü
      const permResult = await StepCounter.checkPermission();
      
      if (!permResult.granted) {
        console.log('İzin yok, kullanıcıdan istenecek');
        store.setPermission('prompt');
        return false;
      }

      store.setPermission('granted');
      store.setSupported(true);

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
      const store = useStepsStore.getState();
      
      console.log('İzin isteniyor...');
      const requestResult = await StepCounter.requestPermissions();
      
      if (!requestResult.granted) {
        store.setPermission('denied');
        return false;
      }

      store.setPermission('granted');
      store.setSupported(true);

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
        
        const store = useStepsStore.getState();
        
        // Store'u güncelle (aylık hesap otomatik yapılıyor)
        store.updateTodaySteps(data.steps);
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
      useStepsStore.getState().setServiceStarted(true);
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
      useStepsStore.getState().setServiceStarted(false);
      console.log('StepService durduruldu');
    } catch (error) {
      console.error('Servis durdurma hatası:', error);
    }
  }

  async reset() {
    try {
      await StepCounter.resetSteps();
      useStepsStore.getState().updateTodaySteps(0);
      console.log('Adımlar sıfırlandı');
    } catch (error) {
      console.error('Sıfırlama hatası:', error);
    }
  }

  async cleanup() {
    try {
      await StepCounter.removeAllListeners();
      this.listenerHandle = null;
      console.log('Listener temizlendi');
    } catch (error) {
      console.error('Cleanup hatası:', error);
    }
  }

  getStatus() {
    return this.isRunning;
  }
}

export const stepService = new StepService();
