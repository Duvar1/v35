import { useUserStore } from "../store/userStore";

// Google Fit için gerekli izinler
const fitnessScopes = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
];

// Google Web Client ID
const WEB_CLIENT_ID =
  "363514939464-og3k4opqlp9upjqdrcrr1csr1f5klai7.apps.googleusercontent.com";

declare const google: any;

export const googleOAuthLogin = async (): Promise<boolean> => {
  try {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: WEB_CLIENT_ID,
      scope: ["profile", "email", ...fitnessScopes].join(" "),
      prompt: "consent",
      callback: async (tokenResponse: any) => {
        if (!tokenResponse?.access_token) return false;
        return await handleSuccessfulLogin(tokenResponse.access_token);
      },
    });

    tokenClient.requestAccessToken();

    return new Promise((resolve) => {
      // tokenClient callback resolve edecek
      const interval = setInterval(() => {
        if (useUserStore.getState().user?.isGoogleFitAuthorized) {
          clearInterval(interval);
          resolve(true);
        }
      }, 200);
    });
  } catch (err) {
    console.error("OAuth ERROR:", err);
    return false;
  }
};

async function handleSuccessfulLogin(token: string): Promise<boolean> {
  try {
    const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    const { user, setUser, updateUser } = useUserStore.getState();

    if (!user) {
      setUser({
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        referralCode: "",
        isPremium: false,
        totalInvited: 0,
        successfulInvites: 0,
        balance: 0,
        referralCount: 0,
        referralEarnings: 0,
        googleFitUserId: userInfo.sub,
        googleAccessToken: token,
        isGoogleFitAuthorized: true,
      });
    } else {
      updateUser({
        googleFitUserId: userInfo.sub,
        googleAccessToken: token,
        isGoogleFitAuthorized: true,
        email: userInfo.email,
      });
    }

    return true;
  } catch (error) {
    console.error("USER INFO ERROR", error);
    return false;
  }
}
