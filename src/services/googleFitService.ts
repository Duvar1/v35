import { useUserStore } from "../store/userStore";

// Google Fit'ten adım verilerini çek
export const getGoogleFitSteps = async (): Promise<number> => {
  try {
    const { user } = useUserStore.getState();
    
    if (!user?.googleAccessToken) {
      console.log('❌ Google access token yok');
      return 0;
    }

    console.log('👣 Google Fit adım verileri çekiliyor...');
    console.log('🔑 Token:', user.googleAccessToken.substring(0, 20) + '...');

    // ŞİMDİLİK MOCK DATA - SONRA GERÇEK API'YE GEÇERİZ
    const mockSteps = Math.floor(Math.random() * 8000) + 2000;
    
    console.log('📊 Mock adım verisi:', mockSteps);
    return mockSteps;

  } catch (error) {
    console.error('❌ Google Fit adım çekme hatası:', error);
    return 0;
  }
};

// Google Fit bağlantısını test et
export const testGoogleFitConnection = async (): Promise<boolean> => {
  try {
    const { user } = useUserStore.getState();
    
    if (!user?.googleAccessToken) {
      console.log('❌ Google Fit bağlantısı yok - token bulunamadı');
      return false;
    }

    console.log('✅ Google Fit bağlantısı mevcut');
    return true;

  } catch (error) {
    console.error('❌ Google Fit bağlantı testi hatası:', error);
    return false;
  }
};