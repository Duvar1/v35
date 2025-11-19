import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Gift, Users, Coins } from 'lucide-react';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { useUserStore } from '../store/userStore';

export const InvitePage: React.FC = () => {
  const { user, updateUser } = useUserStore();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate referral code if user doesn't have one
  useEffect(() => {
    if (user && !user.referralCode) {
      const newReferralCode = generateReferralCode();
      updateUser({
        ...user,
        referralCode: newReferralCode,
        referralCount: user.referralCount || 0,
        referralEarnings: user.referralEarnings || 0
      });
    }
  }, [user, updateUser]);

  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const referralLink = `https://vakt-namaz.app/invite/${user?.referralCode || ''}`;

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
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareReferralLink = async () => {
    const shareData = {
      title: 'Vakt-i Namaz Uygulaması',
      text: 'Bu harika namaz vakitleri uygulamasını keşfet! Referans kodumla kayıt ol ve ikimiz de ödül kazanalım.',
      url: referralLink
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        await copyToClipboard(referralLink, 'link');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      // Fallback to copying link
      await copyToClipboard(referralLink, 'link');
    }
  };

  const referralCount = user?.referralCount || 0;
  const referralEarnings = user?.referralEarnings || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-6 no-horizontal-scroll">
      {/* Header */}
      <div className="text-center space-y-2 w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Arkadaşlarını Davet Et
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Her davet için ödül kazan ve premium özelliklerin keyfini çıkar
        </p>
      </div>

      {/* Top Ad */}
      {!user?.isPremium && (
        <div className="w-full">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <Card className="text-center w-full">
          <CardContent className="p-4 w-full">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {referralCount}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toplam Davet
            </p>
          </CardContent>
        </Card>

        <Card className="text-center w-full">
          <CardContent className="p-4 w-full">
            <Coins className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {referralEarnings}₺
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kazanılan Ödül
            </p>
          </CardContent>
        </Card>

        <Card className="text-center w-full">
          <CardContent className="p-4 w-full">
            <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              5₺
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Davet Başına
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Referans Kodun</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 w-full">
          <div className="flex items-center space-x-2 w-full">
            <Input
              value={user?.referralCode || ''}
              readOnly
              className="font-mono text-lg text-center flex-1"
            />
            <Button
              onClick={() => copyToClipboard(user?.referralCode || '', 'code')}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copiedCode ? 'Kopyalandı!' : 'Kopyala'}
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg w-full">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 Arkadaşların bu kodu kayıt olurken girdiğinde, sen 5₺ ödül kazanırsın!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Davet Linki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 w-full">
          <div className="flex items-center space-x-2 w-full">
            <Input
              value={referralLink}
              readOnly
              className="text-sm flex-1"
            />
            <Button
              onClick={() => copyToClipboard(referralLink, 'link')}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copiedLink ? 'Kopyalandı!' : 'Kopyala'}
            </Button>
          </div>

          <Button
            onClick={shareReferralLink}
            className="w-full"
            size="lg"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Linki Paylaş
          </Button>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <div className="space-y-4 w-full">
            <div className="flex items-start space-x-3 w-full">
              <Badge variant="secondary" className="mt-1 flex-shrink-0">1</Badge>
              <div className="flex-1">
                <h3 className="font-medium">Arkadaşlarını Davet Et</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Referans kodunu veya linki arkadaşlarınla paylaş
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 w-full">
              <Badge variant="secondary" className="mt-1 flex-shrink-0">2</Badge>
              <div className="flex-1">
                <h3 className="font-medium">Kayıt Olsunlar</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Arkadaşların uygulamaya kayıt olurken kodunu girsin
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 w-full">
              <Badge variant="secondary" className="mt-1 flex-shrink-0">3</Badge>
              <div className="flex-1">
                <h3 className="font-medium">Ödül Kazan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Her başarılı davet için 5₺ ödül kazan
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 w-full">
              <Badge variant="secondary" className="mt-1 flex-shrink-0">4</Badge>
              <div className="flex-1">
                <h3 className="font-medium">Premium Özellikler</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kazandığın ödüllerle premium abonelik satın al
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="border-l-4 border-l-yellow-400 w-full">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">📋 Şartlar ve Koşullar</h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 w-full">
            <li>• Her başarılı davet için 5₺ ödül kazanırsın</li>
            <li>• Ödüller 24 saat içinde hesabına yansır</li>
            <li>• Minimum 20₺ biriktirdiğinde premium satın alabilirsin</li>
            <li>• Sahte hesaplar için ödül verilmez</li>
            <li>• Ödüller geri çekilemez, sadece uygulama içinde kullanılır</li>
          </ul>
        </CardContent>
      </Card>

      {/* Bottom Ad */}
      {!user?.isPremium && (
        <div className="w-full">
          <AdPlaceholder type="banner" className="w-full max-w-full mx-auto" />
        </div>
      )}

      {/* Technical Note */}
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            TODO: Firebase ile gerçek referral sistemi entegre edilecek
          </p>
        </CardContent>
      </Card>
    </div>
  );
};