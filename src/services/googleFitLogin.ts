import { useUserStore } from "../store/userStore";

// Google Fit izinleri
const fitnessScopes = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
];

// Web Google OAuth (Google Identity Services)
declare const google: any;

export const googleFitLogin = async () => {
  try {
    const {
      setGoogleFitAuthorized,
      setGoogleFitUserId,
      setGoogleAccessToken
    } = useUserStore.getState();

    console.log("🔵 Google Fit Login başlatılıyor...");

    return new Promise<boolean>((resolve) => {
      google.accounts.oauth2.initTokenClient({
        client_id: "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com",
        scope: fitnessScopes.join(" "),
        prompt: "consent",

        callback: async (tokenResponse: any) => {
          console.log("🔑 Google Token:", tokenResponse);

          if (!tokenResponse || !tokenResponse.access_token) {
            console.error("❌ Access token alınamadı");
            resolve(false);
            return;
          }

          // Kullanıcı bilgisi için request
          const userInfoRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            }
          );

          const userInfo = await userInfoRes.json();

          console.log("👤 Google User:", userInfo);

          // Store kaydı
          setGoogleFitAuthorized(true);
          setGoogleFitUserId(userInfo.sub);
          setGoogleAccessToken(tokenResponse.access_token);

          resolve(true);
        },
      }).requestAccessToken();
    });
  } catch (err) {
    console.error("❌ Google Fit Login Error:", err);
    return false;
  }
};
