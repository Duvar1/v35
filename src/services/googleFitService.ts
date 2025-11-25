import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

class GoogleFitService {
  private isAuthenticated = false;
  private accessToken: string | null = null;
  private stepUpdateCallback: ((steps: number) => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private currentSteps = 0;

  async init(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Web platform - Google Fit simüle edilecek');
      this.startSimulatedSteps();
      return true;
    }

    try {
      // Mevcut oturumu kontrol et
      const authResult = await GoogleAuth.refresh();
      this.accessToken = authResult.accessToken;
      this.isAuthenticated = true;
      console.log('✅ Google oturumu mevcut');
      return true;
    } catch (error) {
      console.log('🔐 Google oturumu yok, giriş gerekecek');
      return false;
    }
  }

  setStepUpdateCallback(callback: (steps: number) => void) {
    this.stepUpdateCallback = callback;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const authResult = await GoogleAuth.signIn();
      this.accessToken = authResult.authentication.accessToken;
      this.isAuthenticated = true;
      
      console.log('✅ Google girişi başarılı');
      return true;
    } catch (error) {
      console.error('❌ Google girişi başarısız:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<{ granted: boolean }> {
    return { granted: this.isAuthenticated };
  }

  async startStepCounting(): Promise<boolean> {
    if (!this.isAuthenticated && Capacitor.isNativePlatform()) {
      console.log('🔐 Önce Google girişi yapılmalı');
      return false;
    }

    try {
      // İlk adım verilerini al
      const todaySteps = await this.getTodaySteps();
      this.currentSteps = todaySteps;
      
      if (this.stepUpdateCallback) {
        this.stepUpdateCallback(this.currentSteps);
      }

      // Periyodik senkronizasyonu başlat
      this.startPeriodicSync();
      
      console.log('✅ Adım sayma başlatıldı');
      return true;
    } catch (error) {
      console.error('❌ Adım sayma başlatma hatası:', error);
      return false;
    }
  }

  async stopStepCounting(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('⏹️ Adım sayma durduruldu');
  }

  async getTodaySteps(): Promise<number> {
    if (!this.isAuthenticated || !Capacitor.isNativePlatform()) {
      // Simüle edilmiş veri
      return Math.floor(Math.random() * 5000) + 1000;
    }

    try {
      if (!this.accessToken) {
        throw new Error('Access token yok');
      }

      const today = new Date();
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const endTime = today.getTime();

      const steps = await this.fetchStepsFromGoogleFit(startTime, endTime);
      return steps;
    } catch (error) {
      console.error('❌ Google Fit veri çekme hatası:', error);
      // Hata durumunda simüle edilmiş veri dön
      return Math.floor(Math.random() * 5000) + 1000;
    }
  }

  private async fetchStepsFromGoogleFit(startTime: number, endTime: number): Promise<number> {
    // Bu kısım daha sonra Google Fit API entegrasyonu için
    // Şimdilik simüle edilmiş veri dönüyoruz
    console.log('📡 Google Fit API çağrısı simüle ediliyor...');
    
    // Gerçek Google Fit API entegrasyonu için:
    /*
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
    
    const requestBody = {
      aggregateBy: [{
        dataTypeName: "com.google.step_count.delta",
        dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
      }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startTime,
      endTimeMillis: endTime
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.status}`);
    }

    const data = await response.json();
    return this.extractStepsFromResponse(data);
    */
    
    // Şimdilik simüle edilmiş veri
    return Math.floor(Math.random() * 8000) + 2000;
  }

  private extractStepsFromResponse(response: any): number {
    try {
      if (response.bucket && response.bucket.length > 0) {
        const bucket = response.bucket[0];
        if (bucket.dataset && bucket.dataset.length > 0) {
          const dataset = bucket.dataset[0];
          if (dataset.point && dataset.point.length > 0) {
            const point = dataset.point[0];
            if (point.value && point.value.length > 0) {
              return point.value[0].intVal || 0;
            }
          }
        }
      }
      return 0;
    } catch (error) {
      console.error('Step extraction error:', error);
      return 0;
    }
  }

  private startPeriodicSync() {
    // Her 10 saniyede bir senkronizasyon (test için)
    this.syncInterval = setInterval(async () => {
      try {
        const newSteps = await this.getTodaySteps();
        if (newSteps !== this.currentSteps) {
          this.currentSteps = newSteps;
          if (this.stepUpdateCallback) {
            this.stepUpdateCallback(this.currentSteps);
          }
          console.log('🔄 Adımlar güncellendi:', this.currentSteps);
        }
      } catch (error) {
        console.error('❌ Senkronizasyon hatası:', error);
      }
    }, 10000); // 10 saniye
  }

  private startSimulatedSteps() {
    // Web için simüle edilmiş adımlar
    this.currentSteps = 1500;
    
    setInterval(() => {
      this.currentSteps += Math.floor(Math.random() * 3) + 1;
      if (this.stepUpdateCallback) {
        this.stepUpdateCallback(this.currentSteps);
      }
      console.log('🔄 Simüle adımlar:', this.currentSteps);
    }, 3000);
  }

  async getCurrentSteps(): Promise<number> {
    return this.currentSteps || await this.getTodaySteps();
  }

  getStatus() {
    return this.isAuthenticated;
  }

  async signOut() {
    try {
      await GoogleAuth.signOut();
      this.isAuthenticated = false;
      this.accessToken = null;
      await this.stopStepCounting();
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  }
}

export const googleFitService = new GoogleFitService();