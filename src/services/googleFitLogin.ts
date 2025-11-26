import { useUserStore } from "../store/userStore";

export const googleFitLogin = async (): Promise<boolean> => {
  try {
    const { user, setUser, updateUser } = useUserStore.getState();
    console.log('🔄 Mock giriş başlatılıyor...');

    const mockUserData = {
      id: 'user-' + Date.now(),
      email: 'test@vaktinamaz.com', 
      name: 'Test Kullanıcı',
      accessToken: 'mock-token-' + Date.now()
    };

    const generateReferralCode = (): string => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    if (!user) {
      setUser({
        id: mockUserData.id,
        email: mockUserData.email,
        name: mockUserData.name,
        referralCode: generateReferralCode(),
        isPremium: false,
        totalInvited: 0,
        successfulInvites: 0,
        balance: 0,
        referralCount: 0,
        referralEarnings: 0,
        googleFitUserId: mockUserData.id,
        googleAccessToken: mockUserData.accessToken,
        isGoogleFitAuthorized: true,
      });
    } else {
      updateUser({
        googleFitUserId: mockUserData.id,
        googleAccessToken: mockUserData.accessToken,
        isGoogleFitAuthorized: true,
      });
    }

    console.log('✅ Mock giriş başarılı!');
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;

  } catch (error: any) {
    console.error("❌ Login Error:", error);
    throw new Error('Giriş sırasında bir hata oluştu: ' + error.message);
  }
};