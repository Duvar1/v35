// src/services/googleOAuthService.ts

import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useUserStore } from '../store/userStore';
import { toast } from 'sonner';

const CLIENT_ID =
  "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com";

const REDIRECT_URI = "com.vaktinamaz.app:/oauth2redirect";

const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
  "email",
  "profile",
].join(" ");

export async function googleOAuthLogin(): Promise<boolean> {

  if (Capacitor.getPlatform() !== "android") {
    console.warn("Google OAuth sadece Android’de çalışır.");
    return false;
  }

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&prompt=consent`;

  await Browser.open({ url: authUrl, windowName: "_self" });

  return await new Promise(async (resolve) => {
    const listener = await App.addListener("appUrlOpen", async (event) => {
      if (!event.url.startsWith(REDIRECT_URI)) return;

      await Browser.close();
      listener.remove();

      const token = extractToken(event.url);
      if (!token) {
        toast.error("Google giriş başarısız.");
        resolve(false);
        return;
      }

      const ok = await saveUser(token);
      resolve(ok);
    });

    setTimeout(async () => {
      await Browser.close();
      listener.remove();
      resolve(false);
    }, 60000);
  });
}

function extractToken(url: string): string | null {
  const m = url.match(/access_token=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function saveUser(token: string): Promise<boolean> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
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
        isGoogleFitAuthorized: true,
      });
    } else {
      updateUser({
        googleFitUserId: info.sub,
        googleAccessToken: token,
        isGoogleFitAuthorized: true,
      });
    }

    toast.success("Google Fit bağlantısı başarılı!");
    return true;

  } catch (e) {
    toast.error("Google girişi sırasında hata oluştu.");
    return false;
  }
}
