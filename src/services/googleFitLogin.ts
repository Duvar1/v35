import { useUserStore } from "../store/userStore";

// Google Fit izinleri
const fitnessScopes = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
];

// Google Identity Services
declare const google: any;

export const googleFitLogin = async () => {
  try {
    const {
      user,
      setUser,
      updateUser,
      setGoogleFitAuthorized,
      setGoogleFitUserId,
      setGoogleAccessToken,
    } = useUserStore.getState();

    console.log("🔵 Google Fit Login başlıyor...");

    return new Promise<boolean>((resolve) => {
      google.accounts.oauth2
        .initTokenClient({
          client_id:
            "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com",
          scope: fitnessScopes.join(" "),
          prompt: "consent",

          callback: async (tokenResponse: any) => {
            if (!tokenResponse?.access_token) {
              console.error("❌ Access token alınamadı");
              resolve(false);
              return;
            }

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

            // Eğer user yoksa otomatik oluştur
            if (!user) {
              setUser({
                id: userInfo.sub,
                referralCode: "",
                isPremium: false,
                totalInvited: 0,
                successfulInvites: 0,
                balance: 0,
                referralCount: 0,
                referralEarnings: 0,
                googleFitUserId: userInfo.sub,
                googleAccessToken: tokenResponse.access_token,
                isGoogleFitAuthorized: true,
              });
            } else {
              updateUser({
                googleFitUserId: userInfo.sub,
                googleAccessToken: tokenResponse.access_token,
                isGoogleFitAuthorized: true,
              });
            }

            setGoogleFitAuthorized(true);
            setGoogleFitUserId(userInfo.sub);
            setGoogleAccessToken(tokenResponse.access_token);

            resolve(true);
          },
        })
        .requestAccessToken();
    });
  } catch (err) {
    console.error("❌ Google Fit Login Error:", err);
    return false;
  }
};
