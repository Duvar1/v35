import { useUserStore } from "../store/userStore";


export const googleOAuthLogin = async (): Promise<boolean> => {
  try {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.location.read",
      prompt: "consent",
      callback: async (tokenResponse: any) => {
        if (!tokenResponse?.access_token) {
          console.error("No token!");
          return false;
        }

        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        const userInfo = await userInfoRes.json();

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
            googleAccessToken: tokenResponse.access_token,
            isGoogleFitAuthorized: true
          });
        } else {
          updateUser({
            googleFitUserId: userInfo.sub,
            googleAccessToken: tokenResponse.access_token,
            isGoogleFitAuthorized: true
          });
        }
      },
    });

    tokenClient.requestAccessToken();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
