import { useUserStore } from '../store/userStore';
import { referralConfig } from './referralConfig';

export const referralService = {
  // EKSİK OLAN METOD - createReferral
  async createReferral(user: any) {
    if (!user?.uid) {
      console.error('Kullanıcı bilgisi bulunamadı');
      return;
    }
    
    try {
      const newReferralCode = this.generateReferralCode();
      
      // Local state'i güncelle
      const { updateUser } = useUserStore.getState();
      updateUser({
        referralCode: newReferralCode,
        referralCount: 0,
        referralEarnings: 0,
        pendingInvites: 0
      });
      
      console.log('✅ Referral kodu oluşturuldu:', newReferralCode);
      return newReferralCode;
      
    } catch (error) {
      console.error('❌ Referral oluşturma hatası:', error);
      throw error;
    }
  },

  // Referans kodu oluşturma (private method)
  generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  // Referral kodu kullanıldığında
  async useReferralCode(referralCode: string, newUserId: string) {
    console.log('🎯 Referral code used:', { referralCode, newUserId });
    
    // Config'den ödül miktarını al
    const rewardAmount = referralConfig.getRewardAmount();
    
    // Kullanıcıyı güncelle
    const { user, updateUser } = useUserStore.getState();
    if (user) {
      const newEarnings = (user.referralEarnings || 0) + rewardAmount;
      const newCount = (user.referralCount || 0) + 1;
      
      updateUser({
        referralEarnings: newEarnings,
        referralCount: newCount
      });
    }
    
    return { success: true, rewardAmount };
  },

  // Premium satın alma kontrolü
  async checkPremiumEligibility(userId: string) {
    const { user } = useUserStore.getState();
    const earnings = user?.referralEarnings || 0;
    const premiumCost = referralConfig.getPremiumCost();
    const hasEnoughForPremium = earnings >= premiumCost;
    
    return {
      eligible: hasEnoughForPremium,
      currentBalance: earnings,
      requiredAmount: premiumCost,
      missingAmount: Math.max(0, premiumCost - earnings),
      rewardAmount: referralConfig.getRewardAmount()
    };
  },

  // Premium satın al
  async purchasePremium(userId: string) {
    const { user, updateUser } = useUserStore.getState();
    const earnings = user?.referralEarnings || 0;
    const premiumCost = referralConfig.getPremiumCost();
    
    if (earnings >= premiumCost) {
      // Premium satın al
      updateUser({
        isPremium: true,
        referralEarnings: earnings - premiumCost
      });
      
      return { 
        success: true, 
        newBalance: earnings - premiumCost,
        premiumCost: premiumCost
      };
    }
    
    return { 
      success: false, 
      error: `Yetersiz bakiye. ${premiumCost}₺ gerekli.` 
    };
  },

  // İstatistikleri getir
  async getReferralStats(userId: string) {
    const { user } = useUserStore.getState();
    const rewardAmount = referralConfig.getRewardAmount();
    
    return {
      referralCount: user?.referralCount || 0,
      referralEarnings: user?.referralEarnings || 0,
      totalEarned: (user?.referralCount || 0) * rewardAmount,
      rewardAmount: rewardAmount,
      nextRewardAt: (user?.referralCount || 0) + 1
    };
  }
};