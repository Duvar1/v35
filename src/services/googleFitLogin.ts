import { useUserStore } from "../store/userStore";

export const googleFitLogin = async (): Promise<boolean> => {
  try {
    const { user, setUser, updateUser } = useUserStore.getState();

    console.log('🔄 Google Fit girişi başlatılıyor...');

    // Önce mock girişle test edelim
    console.log('🧪 Mock giriş deniyorum...');

    const mockUserData = {
      id: 'test-user-' + Date.now(),
      email: 'test@vaktinamaz.com', 
      name: 'Test Kullanıcı',
      accessToken: 'mock-token-' + Date.now()
    };

    // Referral code generator
    const generateReferralCode = (): string => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    // Kullanıcıyı güncelle
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

    console.log('✅ Mock giriş başarılı! Kullanıcı:', mockUserData);
    
    // 1 saniye bekle ve başarılı dön (UI feedback için)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;

  } catch (error: any) {
    console.error("❌ Google Fit Login Error:", error);
    
    // Daha anlaşılır hata mesajı
    let errorMessage = 'Giriş sırasında bir hata oluştu';
    
    if (error.message.includes('network') || error.message.includes('internet')) {
      errorMessage = 'İnternet bağlantınızı kontrol edin';
    } else if (error.message.includes('cancel')) {
      errorMessage = 'Giriş işlemi iptal edildi';
      return false;
    }
    
    throw new Error(errorMessage);
  }
};