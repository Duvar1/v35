import { useUserStore } from "../store/userStore";
import { Capacitor } from '@capacitor/core';

// Android Client ID - ZATEN SİZDE VAR
const ANDROID_CLIENT_ID = '363514939464-n7ir7squ25589g45duvd5a8ttol5.apps.googleusercontent.com';

export const googleOAuthLogin = async (): Promise<boolean> => {
  try {
    console.log('🔄 Google OAuth başlatılıyor...');
    console.log('📱 Platform:', Capacitor.getPlatform());

    if (Capacitor.getPlatform() === 'android') {
      // Android için Google Sign-In Intent kullanacağız
      return await androidGoogleLogin();
    } else {
      // Web için mock (test amaçlı)
      return await webMockLogin();
    }

  } catch (error) {
    console.error('❌ OAuth hatası:', error);
    return false;
  }
};

// Android için Google Sign-In
const androidGoogleLogin = async (): Promise<boolean> => {
  try {
    console.log('🤖 Android Google Login başlatılıyor...');

    // Bu kısımda native Android code ile Google Sign-In yapacağız
    // Şimdilik mock ile devam edelim, sonra native'i ekleriz
    
    const mockUserData = {
      id: 'android-user-' + Date.now(),
      email: 'android@vaktinamaz.com',
      name: 'Android Test User',
      accessToken: 'android-mock-token-' + Date.now()
    };

    return await handleSuccessfulLogin(
      mockUserData.accessToken,
      mockUserData.id,
      mockUserData.email,
      mockUserData.name
    );

  } catch (error) {
    console.error('❌ Android login hatası:', error);
    return false;
  }
};

// Web için mock login
const webMockLogin = async (): Promise<boolean> => {
  console.log('🌐 Web ortamı - gelişmiş mock login');
  
  const mockUserData = {
    id: 'web-user-' + Date.now(),
    email: 'web@vaktinamaz.com',
    name: 'Web Test User', 
    accessToken: 'web-mock-token-' + Date.now()
  };

  return await handleSuccessfulLogin(
    mockUserData.accessToken,
    mockUserData.id,
    mockUserData.email,
    mockUserData.name
  );
};

// Başarılı login işlemi
const handleSuccessfulLogin = async (
  accessToken: string,
  userId: string,
  email: string,
  name: string
): Promise<boolean> => {
  try {
    console.log('✅ Login başarılı, kullanıcı bilgileri güncelleniyor...');

    // Store'u güncelle
    const { user, setUser, updateUser } = useUserStore.getState();

    if (!user) {
      setUser({
        id: userId,
        email: email,
        name: name,
        referralCode: generateReferralCode(),
        isPremium: false,
        totalInvited: 0,
        successfulInvites: 0,
        balance: 0,
        referralCount: 0,
        referralEarnings: 0,
        googleFitUserId: userId,
        googleAccessToken: accessToken,
        isGoogleFitAuthorized: true,
      });
    } else {
      updateUser({
        googleFitUserId: userId,
        googleAccessToken: accessToken,
        isGoogleFitAuthorized: true,
      });
    }

    console.log('🎉 Kullanıcı başarıyla giriş yaptı!');
    
    // Kısa bekleme (UI feedback için)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;

  } catch (error) {
    console.error('❌ Kullanıcı güncelleme hatası:', error);
    return false;
  }
};

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}