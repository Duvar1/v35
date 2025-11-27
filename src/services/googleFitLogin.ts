import { useUserStore } from "../store/userStore";

// Google Fit izinleri
const fitnessScopes = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
];

// Google Identity Services
declare const google: any;

export const googleFitLogin = async (): Promise<boolean> => {
  try {
    const {
      user,
      setUser,
      updateUser,
      setGoogleFitAuthorized,
      setGoogleFitUserId,
      setGoogleAccessToken,
    } = useUserStore.getState();

    return new Promise<boolean>((resolve) => {
      google.accounts.oauth2
        .initTokenClient({
          client_id:
            "363514939464-og3k4opqlp9upjqdrcrr1csr1f5klai7.apps.googleusercontent.com",
          scope: fitnessScopes.join(" "),
          prompt: "consent",

          callback: async (tokenResponse: any) => {
            if (!tokenResponse?.access_token) {
              resolve(false);
              return;
            }

            // Google kullanıcı bilgisi çekiliyor
            const infoReq = await fetch(
              "https://www.googleapis.com/oauth2/v3/userinfo",
              {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              }
            );

            const userInfo = await infoReq.json();

            if (!user) {
              // İlk kez giriş yapan kullanıcı
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

                email: userInfo.email ?? null,        // ✔ EMAIL EKLEDİK
              });
            } else {
              // Güncelleme
              updateUser({
                googleFitUserId: userInfo.sub,
                googleAccessToken: tokenResponse.access_token,
                isGoogleFitAuthorized: true,
                email: userInfo.email ?? null,
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
    console.error("Google Fit Login Error:", err);
    return false;
  }
};
