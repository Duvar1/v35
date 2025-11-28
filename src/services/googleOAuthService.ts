// src/services/googleOAuthService.ts

import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useUserStore } from "../store/userStore";

// Google Fit OAuth bilgileri
const CLIENT_ID =
  "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com";

const REDIRECT_URI = "com.vaktinamaz.app:/oauth2redirect"; // Manifest ile uyumlu

const SCOPES =
  "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.location.read email profile";

// PKCE — random string
function generateCodeVerifier(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

// SHA256 → Base64URL
async function generateCodeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);

  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return base64;
}

export async function googleOAuthLogin(): Promise<boolean> {
  try {
    if (Capacitor.getPlatform() !== "android") {
      console.warn("OAuth sadece Android'de çalışır.");
      return false;
    }

    // PKCE üret
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // OAuth URL
    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` + // IMPORTANT: PKCE kullanıyoruz
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256` +
      `&prompt=consent`;

    await Browser.open({ url: authUrl });

    // Redirect yakalama
    return await new Promise(async (resolve) => {
      const listener = await App.addListener("appUrlOpen", async (event) => {
        if (!event.url.startsWith(REDIRECT_URI)) return;

        await Browser.close();
        listener.remove();

        const code = extractCode(event.url);
        if (!code) return resolve(false);

        const ok = await exchangeCodeForToken(code, codeVerifier);
        resolve(ok);
      });

      setTimeout(async () => {
        await Browser.close();
        resolve(false);
      }, 60000);
    });
  } catch (err) {
    console.error("OAuth error:", err);
    return false;
  }
}

function extractCode(url: string): string | null {
  const match = url.match(/code=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function exchangeCodeForToken(code: string, verifier: string) {
  try {
    // Token alma
    const data = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      code_verifier: verifier,
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data,
    });

    const json = await res.json();

    if (!json.access_token) {
      console.error("Token alınamadı", json);
      return false;
    }

    // Kullanıcı bilgisi
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${json.access_token}` },
      }
    );

    const info = await userRes.json();

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
        googleAccessToken: json.access_token,
        isGoogleFitAuthorized: true,
      });
    } else {
      updateUser({
        googleFitUserId: info.sub,
        googleAccessToken: json.access_token,
        isGoogleFitAuthorized: true,
      });
    }

    return true;
  } catch (err) {
    console.error("Token error:", err);
    return false;
  }
}
