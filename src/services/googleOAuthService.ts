import { useUserStore } from "../store/userStore";
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { testGoogleFitConnection } from './googleFitService';

// Android Client ID
const ANDROID_CLIENT_ID = '363514939464-n7ir7squ25589g45duvd5a8ttol5.apps.googleusercontent.com';

export const googleOAuthLogin = async (): Promise<boolean> => {
  try {
    console.log('🔄 Google OAuth başlatılıyor...');
    console.log('📱 Platform:', Capacitor.getPlatform());

    if (Capacitor.getPlatform() === 'android') {
      return await androidGoogleLogin();
    } else {
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

    // Capacitor Browser ile gerçek OAuth flow
    const { Browser } = await import('@capacitor/browser');
    const { App } = await import('@capacitor/app');

    const CLIENT_ID = ANDROID_CLIENT_ID;
    const REDIRECT_URI = 'com.vaktinamaz.app://oauth2redirect';
    const SCOPES = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.location.read',
      'profile',
      'email'
    ].join(' ');

    const authUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `prompt=consent`;

    console.log('🔗 OAuth URL:', authUrl);
    await Browser.open({ url: authUrl });

    return new Promise((resolve) => {
      const handleUrlChange = async (data: { url: string }) => {
        console.log('📱 URL değişti:', data.url);

        if (data.url.includes(REDIRECT_URI)) {
          await Browser.close();

          // Token'ı URL'den çıkar
          const token = extractAccessTokenFromUrl(data.url);
          
          if (token) {
            console.log('✅ Access token alındı');
            const success = await handleSuccessfulLogin(token);
            resolve(success);
          } else {
            console.error('❌ Token alınamadı');
            resolve(false);
          }

          App.removeAllListeners();
        }
      };

      App.addListener('appUrlOpen', handleUrlChange);

      // 2 dakika timeout
      setTimeout(async () => {
        App.removeAllListeners();
        await Browser.close();
        console.log('⏰ OAuth timeout - iptal edildi');
        resolve(false);
      }, 120000);
    });

  } catch (error) {
    console.error('❌ Android login hatası:', error);
    return false;
  }
};

// Web için mock login (geçici)
const webMockLogin = async (): Promise<boolean> => {
  console.log('🌐 Web ortamı - gelişmiş mock login');
  
  // Web için gerçek OAuth yapalım
  const CLIENT_ID = ANDROID_CLIENT_ID;
  const REDIRECT_URI = window.location.origin + '/oauth';
  const SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.location.read',
    'profile',
    'email'
  ].join(' ');

  const authUrl = 
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=token&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `prompt=consent`;

  // Web'de yeni pencere aç
  const width = 500;
  const height = 600;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  const authWindow = window.open(
    authUrl,
    'google_oauth',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!authWindow) {
    toast.error('Popup engellendi. Lütfen popup engelleyiciyi kapatın.');
    return false;
  }

  return new Promise((resolve) => {
    // Popup'dan mesaj dinle
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS' && event.data.token) {
        console.log('✅ Web OAuth başarılı, token alındı');
        window.removeEventListener('message', messageHandler);
        authWindow.close();
        
        handleSuccessfulLogin(event.data.token)
          .then(resolve)
          .catch(() => resolve(false));
      }
    };

    window.addEventListener('message', messageHandler);

    // Popup kapandı mı kontrol et
    const checkPopup = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        console.log('⏹️ OAuth penceresi kapatıldı');
        resolve(false);
      }
    }, 500);
  });
};

// URL'den access token çıkar
function extractAccessTokenFromUrl(url: string): string | null {
  try {
    const match = url.match(/access_token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// Başarılı login işlemi
async function handleSuccessfulLogin(accessToken: string): Promise<boolean> {
  try {
    console.log('🔐 Access token ile kullanıcı bilgileri alınıyor...');

    // Kullanıcı bilgilerini al
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error(`User info error: ${userInfoResponse.status}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('👤 Gerçek Google kullanıcı bilgileri:', userInfo);

    // Store'u güncelle
    const { user, setUser, updateUser } = useUserStore.getState();

    if (!user) {
      setUser({
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        referralCode: generateReferralCode(),
        isPremium: false,
        totalInvited: 0,
        successfulInvites: 0,
        balance: 0,
        referralCount: 0,
        referralEarnings: 0,
        googleFitUserId: userInfo.sub,
        googleAccessToken: accessToken,
        isGoogleFitAuthorized: true,
      });
    } else {
      updateUser({
        googleFitUserId: userInfo.sub,
        googleAccessToken: accessToken,
        isGoogleFitAuthorized: true,
      });
    }

    console.log('✅ Gerçek Google OAuth başarılı!');
    
    // Google Fit test et
    setTimeout(async () => {
      try {
        const isConnected = await testGoogleFitConnection();
        if (isConnected) {
          toast.success('🎉 Google Fit bağlantısı aktif!', {
            description: 'Adımlarınız gerçek zamanlı olarak takip ediliyor'
          });
        } else {
          toast.info('🔗 Google Fit bağlantısı kuruluyor...', {
            description: 'İlk adım verileri biraz zaman alabilir'
          });
        }
      } catch (error) {
        console.error('Google Fit test hatası:', error);
      }
    }, 2000);
    
    return true;

  } catch (error) {
    console.error('❌ Kullanıcı bilgisi alma hatası:', error);
    toast.error('Google girişi başarısız', {
      description: 'Lütfen tekrar deneyin'
    });
    return false;
  }
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}