import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { useUserStore } from '../store/userStore';

const ANDROID_CLIENT_ID =
  '363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com';

const REDIRECT_URI = 'com.vaktinamaz.app://oauth2redirect';

export const googleOAuthLogin = async (): Promise<boolean> => {
  try {
    const CLIENT_ID = ANDROID_CLIENT_ID;

    const SCOPES = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.location.read',
      'email',
      'profile',
    ].join(' ');

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `prompt=consent`;

    const { Browser } = await import('@capacitor/browser');
    const { App } = await import('@capacitor/app');

    await Browser.open({ url: authUrl });

    return new Promise((resolve) => {
      // ⚠ Listener handle promise döndürüyor
      const listenerPromise = App.addListener('appUrlOpen', async (data) => {
        if (!data.url.includes(REDIRECT_URI)) return;

        await Browser.close();

        const token = extractToken(data.url);
        if (!token) {
          console.error("Token yok!");
          resolve(false);
          return;
        }

        const ok = await finishLogin(token);
        resolve(ok);

        // ✔ Doğru remove yöntemi
        listenerPromise.then((h) => h.remove());
      });

      // Timeout
      setTimeout(async () => {
        await Browser.close();
        resolve(false);

        listenerPromise.then((h) => h.remove());
      }, 120000);
    });
  } catch (err) {
    console.error('OAuth error:', err);
    return false;
  }
};

function extractToken(url: string): string | null {
  const m = url.match(/access_token=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function finishLogin(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const info = await res.json();
    const { user, setUser, updateUser } = useUserStore.getState();

    if (!user) {
      setUser({
        id: info.sub,
        email: info.email,
        name: info.name,
        isGoogleFitAuthorized: true,
        googleAccessToken: accessToken,
        googleFitUserId: info.sub,

        // ödül sistemi
        referralCode: gen(),
        isPremium: false,
        totalInvited: 0,
        successfulInvites: 0,
        referralCount: 0,
        referralEarnings: 0,
        balance: 0,
      });
    } else {
      updateUser({
        isGoogleFitAuthorized: true,
        googleAccessToken: accessToken,
        googleFitUserId: info.sub,
      });
    }

    toast.success("Google ile giriş başarılı!");

    return true;
  } catch (err) {
    console.error("Login error:", err);
    return false;
  }
}

function gen() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
