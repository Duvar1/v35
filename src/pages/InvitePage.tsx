import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Gift, Users, Coins, Sparkles, Crown, Zap } from 'lucide-react';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { useUserStore } from '../store/userStore';
import { referralService } from '../services/referralService';
import { toast } from 'sonner';

export const InvitePage: React.FC = () => {
  const { user, updateUser } = useUserStore();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [premiumEligibility, setPremiumEligibility] = useState<any>(null);

  // Kullanıcı oluşturma ve premium kontrolü
  useEffect(() => {
    const initializeUser = async () => {
      if (user && !user.referralCode) {
        // referralService.createReferral sadece user objesi alıyor
        const newReferralCode = await referralService.createReferral(user);
        
        // Eğer createReferral kod oluşturmuyorsa, local olarak oluştur
        if (!newReferralCode) {
          const generatedCode = generateReferralCode();
          updateUser({
            ...user,
            referralCode: generatedCode,
            referralCount: 0,
            referralEarnings: 0,
            pendingInvites: 0
          });
        }
      }

      // Premium kontrolü
      if (user) {
        const eligibility = await referralService.checkPremiumEligibility(user.id);
        setPremiumEligibility(eligibility);
      }
    };

    initializeUser();
  }, [user, updateUser]);

  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `VK${result}`;
  };

  const referralLink = `https://vaktinamaz.app/invite?code=${user?.referralCode || ''}`;

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      toast.success('Kopyalandı!');
    } catch (error) {
      toast.error('Kopyalama başarısız');
    }
  };

  const shareReferralLink = async () => {
    const shareData = {
      title: 'Vakt-i Namaz - Namaz Vakitleri Uygulaması',
      text: `Namaz vakitleri, Kıble pusulası, Kur'an ve daha fazlası! Benim referans kodumu kullan: ${user?.referralCode}. İndir ve beraber ödül kazanalım!`,
      url: referralLink
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Başarıyla paylaşıldı!');
      } else {
        await copyToClipboard(referralLink, 'link');
      }
    } catch (error) {
      await copyToClipboard(referralLink, 'link');
    }
  };

  const purchasePremium = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await referralService.purchasePremium(user.id);
      if (result.success) {
        toast.success('🎉 Tebrikler! Premium üye oldunuz!');
        // Premium eligibility'yi güncelle
        const eligibility = await referralService.checkPremiumEligibility(user.id);
        setPremiumEligibility(eligibility);
      } else {
        toast.error(result.error || 'Premium satın alınamadı');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // referralConfig'den değerleri al
  const rewardAmount = 7; // referralConfig.rewardAmount
  const premiumCost = 44; // referralConfig.premiumCost
  
  const referralCount = user?.referralCount || 0;
  const referralEarnings = user?.referralEarnings || 0;
  const totalEarned = referralCount * rewardAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 no-horizontal-scroll">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-100/90 via-orange-100/90 to-blue-100/90 dark:from-purple-900/90 dark:via-blue-900/90 dark:to-cyan-900/90 backdrop-blur-md border-b border-pink-200/50 dark:border-purple-500/30">
        <div className="p-4">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-light text-pink-800 dark:text-purple-200">
              Arkadaşlarını Davet Et
            </h1>
            <p className="text-pink-600 dark:text-purple-400 font-light">
              Her davet için {rewardAmount}₺ kazan, premium üye ol!
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20 px-4 space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Top Ad - Sadece premium değilse */}
        {!user?.isPremium && (
          <div className="pt-4 w-full">
            <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
          </div>
        )}

        {/* Premium Banner - Eğer premiumsa */}
        {user?.isPremium && (
          <Card className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 border-0 shadow-lg w-full">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Crown className="h-6 w-6 text-white" />
                <span className="text-white font-semibold">🎉 Premium Üyesiniz!</span>
              </div>
              <p className="text-white/90 text-sm mt-1">
                Tüm reklamsız özelliklere erişiminiz var
              </p>
            </CardContent>
          </Card>
        )}

        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30 text-center w-full">
            <CardContent className="p-4 w-full">
              <Users className="h-8 w-8 text-blue-600 dark:text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-light text-pink-800 dark:text-purple-200">
                {referralCount}
              </div>
              <p className="text-sm text-pink-600 dark:text-purple-400 font-light">
                Başarılı Davet
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30 text-center w-full">
            <CardContent className="p-4 w-full">
              <Coins className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-light text-pink-800 dark:text-purple-200">
                {referralEarnings}₺
              </div>
              <p className="text-sm text-pink-600 dark:text-purple-400 font-light">
                Mevcut Bakiye
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30 text-center w-full">
            <CardContent className="p-4 w-full">
              <Gift className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-light text-pink-800 dark:text-purple-200">
                {totalEarned}₺
              </div>
              <p className="text-sm text-pink-600 dark:text-purple-400 font-light">
                Toplam Kazanç
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Premium Satın Alma - Eğer premium değilse ve yeterli bakiyesi varsa */}
        {!user?.isPremium && premiumEligibility?.eligible && (
          <Card className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/60 dark:to-emerald-900/60 border border-green-200 dark:border-green-500/30 w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Premium'a Geçebilirsin!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {premiumEligibility.currentBalance}₺ bakiyen ile premium üye ol
                  </p>
                </div>
                <Button
                  onClick={purchasePremium}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'İşleniyor...' : 'Premium Ol'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Code */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-light text-pink-800 dark:text-purple-200">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <span>Referans Kodun</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 w-full">
            <div className="flex items-center space-x-2 w-full">
              <Input
                value={user?.referralCode || 'Yükleniyor...'}
                readOnly
                className="font-mono text-lg text-center flex-1 border-pink-300 text-pink-700 bg-pink-50/50 dark:border-purple-600 dark:text-purple-300 dark:bg-purple-900/30"
              />
              <Button
                onClick={() => copyToClipboard(user?.referralCode || '', 'code')}
                variant="outline"
                size="sm"
                className="border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/50"
                disabled={!user?.referralCode}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedCode ? 'Kopyalandı!' : 'Kopyala'}
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 p-3 rounded-lg border border-blue-200/50 dark:border-blue-500/30 w-full">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-light">
                💡 Arkadaşların bu kodu kayıt olurken girdiğinde, sen {rewardAmount}₺ ödül kazanırsın!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="text-lg font-light text-pink-800 dark:text-purple-200">
              Davet Linki
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 w-full">
            <div className="flex items-center space-x-2 w-full">
              <Input
                value={referralLink}
                readOnly
                className="text-sm flex-1 border-pink-300 text-pink-700 bg-pink-50/50 dark:border-purple-600 dark:text-purple-300 dark:bg-purple-900/30"
              />
              <Button
                onClick={() => copyToClipboard(referralLink, 'link')}
                variant="outline"
                size="sm"
                className="border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedLink ? 'Kopyalandı!' : 'Kopyala'}
              </Button>
            </div>

            <Button
              onClick={shareReferralLink}
              className="w-full bg-gradient-to-r from-pink-500 via-orange-500 to-blue-500 hover:from-pink-600 hover:via-orange-600 hover:to-blue-600 border-0 text-white font-light"
              size="lg"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Linki Paylaş
            </Button>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="bg-gradient-to-r from-pink-100/80 via-orange-100/80 to-blue-100/80 dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-purple-500/30 w-full">
          <CardHeader>
            <CardTitle className="text-lg font-light text-pink-800 dark:text-purple-200">
              Nasıl Çalışır?
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            <div className="space-y-4 w-full">
              <div className="flex items-start space-x-3 w-full">
                <Badge className="mt-1 flex-shrink-0 bg-blue-600 dark:bg-cyan-600 text-white">1</Badge>
                <div className="flex-1">
                  <h3 className="font-light text-pink-800 dark:text-purple-200">Arkadaşlarını Davet Et</h3>
                  <p className="text-sm text-pink-600 dark:text-purple-400 font-light">
                    Referans kodunu veya linki arkadaşlarınla paylaş
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 w-full">
                <Badge className="mt-1 flex-shrink-0 bg-green-600 dark:bg-green-500 text-white">2</Badge>
                <div className="flex-1">
                  <h3 className="font-light text-pink-800 dark:text-purple-200">Kayıt Olsunlar</h3>
                  <p className="text-sm text-pink-600 dark:text-purple-400 font-light">
                    Arkadaşların uygulamaya kayıt olurken kodunu girsin
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 w-full">
                <Badge className="mt-1 flex-shrink-0 bg-yellow-600 dark:bg-yellow-500 text-white">3</Badge>
                <div className="flex-1">
                  <h3 className="font-light text-pink-800 dark:text-purple-200">Ödül Kazan</h3>
                  <p className="text-sm text-pink-600 dark:text-purple-400 font-light">
                    Her başarılı davet için {rewardAmount}₺ ödül kazan
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 w-full">
                <Badge className="mt-1 flex-shrink-0 bg-purple-600 dark:bg-purple-500 text-white">4</Badge>
                <div className="flex-1">
                  <h3 className="font-light text-pink-800 dark:text-purple-200">Premium Ol</h3>
                  <p className="text-sm text-pink-600 dark:text-purple-400 font-light">
                    {premiumCost}₺ biriktir ve reklamsız premium üye ol
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Özellikler */}
        {!user?.isPremium && (
          <Card className="bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-red-100/80 dark:from-purple-800/60 dark:via-pink-800/60 dark:to-red-800/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 w-full">
            <CardHeader>
              <CardTitle className="text-lg font-light text-pink-800 dark:text-purple-200 flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-600" />
                Premium Özellikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-pink-700 dark:text-purple-300 font-light">Reklamsız deneyim</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-pink-700 dark:text-purple-300 font-light">Özel temalar</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-pink-700 dark:text-purple-300 font-light">Gelişmiş istatistikler</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-pink-700 dark:text-purple-300 font-light">Özel bildirimler</span>
                </div>
                
                {premiumEligibility && !premiumEligibility.eligible && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg border border-amber-200 dark:border-amber-500/30">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-light text-center">
                      Premium için {premiumEligibility.missingAmount}₺ daha kazanman gerekiyor
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Terms */}
        <Card className="bg-gradient-to-r from-yellow-100/80 via-orange-100/80 to-amber-100/80 dark:from-yellow-900/40 dark:via-orange-900/40 dark:to-amber-900/40 backdrop-blur-sm border-l-4 border-l-yellow-400 border border-yellow-200/50 dark:border-yellow-500/30 w-full">
          <CardContent className="p-4">
            <h3 className="font-light mb-2 text-pink-800 dark:text-purple-200">📋 Şartlar ve Koşullar</h3>
            <ul className="text-sm text-pink-700 dark:text-purple-300 space-y-1 font-light w-full">
              <li>• Her başarılı davet için {rewardAmount}₺ ödül kazanırsın</li>
              <li>• Ödüller anında hesabına yansır</li>
              <li>• {premiumCost}₺ biriktirdiğinde premium satın alabilirsin</li>
              <li>• Sahte hesaplar için ödül verilmez</li>
              <li>• Ödüller sadece uygulama içinde kullanılır</li>
            </ul>
          </CardContent>
        </Card>

        {/* Bottom Ad - Sadece premium değilse */}
        {!user?.isPremium && (
          <div className="w-full">
            <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
          </div>
        )}

        <div className="h-4"></div>
      </div>
    </div>
  );
};