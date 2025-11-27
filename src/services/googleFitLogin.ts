import { Capacitor } from '@capacitor/core';
import { useUserStore } from '../store/userStore';

const FITNESS_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
];

export const googleFitLogin = async () => {
  const { setUser, updateUser, user } = useUserStore.getState();

  if (Capacitor.getPlatform() !== 'android') {
    console.log("Web ortamı – Google Fit yok");
    return false;
  }

  try {
    console.log("🔵 Google Fit authorize başlıyor...");

    const g = await (window as any).plugins.googleFit.authorize({
      scopes: FITNESS_SCOPES,
    });

    console.log("Google Fit yetki OK:", g);

    const userId = g.userId;

    if (!user) {
      setUser({
        id: userId,
        email: '',
        name: '',
        referralCode: '',
        isPremium: false,
        googleFitUserId: userId,
        googleAccessToken: null,
        isGoogleFitAuthorized: true,
        totalInvited: 0,
        successfulInvites: 0,
        balance: 0,
        referralCount: 0,
        referralEarnings: 0,
      });
    } else {
      updateUser({
        googleFitUserId: userId,
        isGoogleFitAuthorized: true,
      });
    }

    return true;

  } catch (err) {
    console.error("❌ Google Fit hata:", err);
    return false;
  }
};
