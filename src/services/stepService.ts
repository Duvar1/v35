import { StepCounter } from '@/stepCounter';
import { Capacitor } from '@capacitor/core';
import { useStepsStore } from '../store/stepsStore'; 

// Not: useStepsStore, Zustand'ın dışarıya açtığı tiplere sahiptir.
// Aşağıdaki StepCounter metodlarının dönüş tiplerinin doğru olması gerekir.

class StepService {
    private listenerHandle: any = null;
    private isRunning: boolean = false; 
    
    // Sınıf Alanlarının Tipleri
    private updateStoreSteps: (steps: number) => void;
    private setStoreServiceStarted: (started: boolean) => void;
    private setStorePermission: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;

    constructor() {
        // Zustand store metotlarını al
        const state = useStepsStore.getState();
        
        this.updateStoreSteps = state.updateTodaySteps;
        this.setStoreServiceStarted = state.setServiceStarted;
        this.setStorePermission = state.setPermission;
        // NOT: subscribe blokları kaldırıldı.
    }

    async init(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            console.log('Web platformunda çalışıyor, adım sayar devre dışı');
            return false;
        }

        try {
            // 1. İzin Kontrolü
            // Gelen tipi geçici olarak 'any' yapıyoruz. (requestPermissions ile uyumsuzluk sorunu çözülür)
            let permResult = await StepCounter.checkPermissions() as any; 
            this.setStorePermission(permResult.activity_recognition === 'granted' ? 'granted' : 'denied');

            // 2. İzin yoksa, izin iste
            if (permResult.activity_recognition !== 'granted' || permResult.notifications !== 'granted') {
                console.log('İzin yok, kullanıcıdan istenecek');
                
                // İzin isteme çağrısı. Gelen tipi yine 'any' olarak atıyoruz.
                permResult = await StepCounter.requestPermissions() as any; 
                this.setStorePermission(permResult.activity_recognition === 'granted' ? 'granted' : 'denied');
            }
            
            // Eğer izin halen verilmemişse (requestPermissions'tan sonra)
            if (permResult.activity_recognition !== 'granted') {
                console.error('İzin reddedildi, servis başlatılamıyor.');
                return false;
            }

            // 3. Listener ekle (Native servisten veri almak için)
            await this.setupListener();

            // 4. Servisi başlat (Native kodda StepService.java'yı başlatır)
            await this.startStepCounting();

            return true;
        } catch (error) {
            console.error('StepService init hatası:', error);
            return false;
        }
    }

    async setupListener(): Promise<void> {
        try {
            if (this.listenerHandle) {
                if (typeof this.listenerHandle.remove === 'function') {
                    this.listenerHandle.remove();
                }
            }

            this.listenerHandle = await StepCounter.addListener('stepCountUpdate', (data: { stepCount: number }) => {
                console.log('Adım güncellendi:', data.stepCount);
                
                // Zustand Store'u güncelle
                this.updateStoreSteps(data.stepCount); 
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
            this.setStoreServiceStarted(true);
            console.log('Step counting başlatıldı:', result);
        } catch (error) {
            console.error('Step counting başlatma hatası:', error);
            this.setStoreServiceStarted(false);
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
            this.setStoreServiceStarted(false);
            console.log('Step counting durduruldu');
        } catch (error) {
            console.error('Step counting durdurma hatası:', error);
        }
    }

    async cleanup(): Promise<void> {
        try {
            if (this.listenerHandle) {
                if (typeof this.listenerHandle.remove === 'function') {
                    this.listenerHandle.remove();
                }
                this.listenerHandle = null;
            }
            this.isRunning = false;
            this.setStoreServiceStarted(false);
            console.log('Listener temizlendi ve durum sıfırlandı');
        } catch (error) {
            console.error('Cleanup hatası:', error);
        }
    }
}

export const stepService = new StepService();