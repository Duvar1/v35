// Referral sisteminin merkezi konfigürasyonu
export const referralConfig = {
  // Ödül miktarı
  rewardAmount: 7,
  
  // Premium üyelik maliyeti
  premiumCost: 44,
  
  // Minimum çekilebilir bakiye
  minWithdrawal: 50,
  
  // Maksimum günlük davet
  maxDailyInvites: 10,
  
  // Kurallar
  rules: {
    rewardPerInvite: 7,
    instantReward: true,
    premiumCost: 45,
    noFakeAccounts: true,
    inAppOnly: true
  },
  
  // Premium özellikleri
  premiumFeatures: [
    "Reklamsız deneyim",
    "Özel temalar",
    "Gelişmiş istatistikler", 
    "Özel bildirimler",
    "Sınırsız geçmiş veri",
    "Öncelikli destek"
  ],
  
  // Getter fonksiyonları
  getRewardAmount() {
    return this.rewardAmount;
  },
  
  getPremiumCost() {
    return this.premiumCost;
  },
  
  getRules() {
    return [
      `Her başarılı davet için ${this.rewardAmount}₺ ödül kazanırsın`,
      'Ödüller anında hesabına yansır',
      `${this.premiumCost}₺ biriktirdiğinde premium satın alabilirsin`,
      'Sahte hesaplar için ödül verilmez',
      'Ödüller sadece uygulama içinde kullanılır'
    ];
  },
  
  // Kuralları güncelleme (admin panel için)
  updateConfig(newConfig: Partial<typeof referralConfig>) {
    Object.assign(this, newConfig);
  }
};