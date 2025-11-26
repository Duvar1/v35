import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { useUserStore } from '../store/userStore';

const CLIENT_ID = '363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com';
const REDIRECT_URI = 'com.vaktinamaz.app://oauth2redirect';
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.location.read',
  'profile',
  'email'
].join(' ');

export const googleOAuthLogin = async (): Promise<boolean> => {
  try {
    console.log('🔄 Google OAuth başlatılıyor...');

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
          // Browser'ı kapat
          await Browser.close();

          // Token'ı URL'den çıkar
          const token = extractAccessTokenFromUrl(data.url);
          
          if (token) {
            console.log('✅ Access token alındı');
            
            // Kullanıcı bilgilerini al ve store'u güncelle
            const success = await handleSuccessfulLogin(token);
            resolve(success);
          } else {
            console.error('❌ Token alınamadı');
            resolve(false);
          }

          // 🔥 DÜZELTME: removeAllListeners kullan
          App.removeAllListeners();
        }
      };

      App.addListener('appUrlOpen', handleUrlChange);

      // 2 dakika timeout
      setTimeout(async () => {
        // 🔥 DÜZELTME: removeAllListeners kullan
        App.removeAllListeners();
        await Browser.close();
        console.log('⏰ OAuth timeout - iptal edildi');
        resolve(false);
      }, 120000);
    });

  } catch (error) {
    console.error('❌ OAuth hatası:', error);
    await Browser.close();
    return false;
  }
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
    console.log('👤 Kullanıcı bilgileri:', userInfo);

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

    console.log('✅ Google OAuth başarılı!');
    return true;

  } catch (error) {
    console.error('❌ Kullanıcı bilgisi alma hatası:', error);
    return false;
  }
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}