import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useUserStore } from '../store/userStore';
import { toast } from 'sonner';

const ANDROID_CLIENT_ID =
  "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com";

const REDIRECT_URI = "http://localhost";

const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
  "email",
  "profile"
].join(" ");

export async function googleOAuthLogin(): Promise<boolean> {
  if (Capacitor.getPlatform() !== "android") {
    console.warn("Google OAuth sadece Android'de çalışır.");
    return false;
  }

  try {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${ANDROID_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `prompt=consent`;

    await Browser.open({ url: authUrl });

    return await new Promise((resolve) => {

      // ✔ Capacitor 7 Uyumlu Listener
      const listenerPromise = App.addListener("appUrlOpen", async (event) => {
        if (!event.url.startsWith(REDIRECT_URI)) return;

        await Browser.close();

        const token = extractToken(event.url);
        if (!token) {
          toast.error("Google giriş başarısız.");
          resolve(false);
        } else {
          const ok = await completeGoogleLogin(token);
          resolve(ok);
        }

        // ✔ DOĞRU remove
        listenerPromise.then((l) => l.remove());
      });

      // 60 saniye timeout
      setTimeout(async () => {
        await Browser.close();
        listenerPromise.then((l) => l.remove());
        resolve(false);
      }, 60000);
    });

  } catch (err) {
    console.error("OAuth error:", err);
    return false;
  }
}

function extractToken(url: string): string | null {
  const match = url.match(/access_token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function completeGoogleLogin(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const info = await res.json();
    const { user, setUser, updateUser } = useUserStore.getState();

    if (!user) {
      setUser({
        id: info.sub,
        email: info.email,
        name: info.name,
        referralCode: "",
        isPremium: false,
        totalInvited: 0,
        successfulInvites: 0,
        balance: 0,
        referralCount: 0,
        referralEarnings: 0,
        googleFitUserId: info.sub,
        googleAccessToken: token,
        isGoogleFitAuthorized: true
      });
    } else {
      updateUser({
        googleFitUserId: info.sub,
        googleAccessToken: token,
        isGoogleFitAuthorized: true
      });
    }

    toast.success("Google Fit bağlantısı başarıyla yapıldı!");
    return true;

  } catch (err) {
    console.error("Login error:", err);
    toast.error("Google giriş hatası");
    return false;
  }
}
