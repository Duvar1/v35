import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  X, 
  Zap, 
  Star, 
  Shield,
  Palette,
  Volume2,
  BarChart3
} from 'lucide-react';
import { useUserStore } from '../store/userStore';

export const PremiumPage: React.FC = () => {
  const { user, updatePremiumStatus } = useUserStore();

  const handleTestPremium = () => {
    updatePremiumStatus(true);
  };

  const handleCancelPremium = () => {
    updatePremiumStatus(false);
  };

  const features = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Reklamsız Deneyim',
      description: 'Hiçbir reklam görmeden uygulamayı kullanın',
      free: false,
      premium: true
    },
    {
      icon: <Palette className="h-5 w-5" />,
      title: 'Premium Temalar',
      description: 'Özel renk şemaları ve görsel efektler',
      free: false,
      premium: true
    },
    {
      icon: <Volume2 className="h-5 w-5" />,
      title: 'Premium Ezan Sesleri',
      description: 'Yüksek kaliteli ezan sesi koleksiyonu',
      free: false,
      premium: true
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Gelişmiş İstatistikler',
      description: 'Detaylı namaz ve adım takip raporları',
      free: false,
      premium: true
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: 'Öncelikli Destek',
      description: 'Sorularınız için hızlı yanıt',
      free: false,
      premium: true
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Temel Özellikler',
      description: 'Namaz vakitleri, kıble, Kur\'an okuma',
      free: true,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Premium
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Daha iyi bir deneyim için premium'a geçin
        </p>
      </div>

      {/* Current Status */}
      <Card className={user?.isPremium ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 border-yellow-200 dark:border-yellow-700' : ''}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {user?.isPremium ? (
              <>
                <Crown className="h-6 w-6 text-yellow-600" />
                <Badge className="bg-yellow-600 text-white">Premium Aktif</Badge>
              </>
            ) : (
              <>
                <Shield className="h-6 w-6 text-gray-400" />
                <Badge variant="secondary">Ücretsiz Kullanıcı</Badge>
              </>
            )}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {user?.isPremium ? 'Premium üyesiniz!' : 'Ücretsiz sürümü kullanıyorsunuz'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {user?.isPremium 
              ? 'Tüm premium özelliklerden faydalanabilirsiniz'
              : 'Premium\'a geçerek reklamsız deneyim yaşayın'
            }
          </p>
        </CardContent>
      </Card>

      {/* Pricing */}
      {!user?.isPremium && (
        <Card className="border-2 border-yellow-200 dark:border-yellow-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Premium Plan</CardTitle>
            <div className="text-4xl font-bold text-yellow-600">
              ₺44
              <span className="text-lg font-normal text-gray-500">/ay</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleTestPremium}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              size="lg"
            >
              <Crown className="h-5 w-5 mr-2" />
              Premium'u Test Et
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              TODO: Gerçek ödeme sistemi entegre edilecek
            </p>
          </CardContent>
        </Card>
      )}

      {/* Premium Controls (if user is premium) */}
      {user?.isPremium && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button 
              onClick={handleCancelPremium}
              variant="outline"
              className="w-full"
            >
              Test Premium'u Sonlandır
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Gerçek abonelikte iptal işlemi farklı olacaktır
            </p>
          </CardContent>
        </Card>
      )}

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Özellik Karşılaştırması</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                  {feature.icon}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Ücretsiz</p>
                    {feature.free ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-yellow-600 mb-1">Premium</p>
                    {feature.premium ? (
                      <Check className="h-4 w-4 text-yellow-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="border-l-4 border-l-yellow-400">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Premium Avantajları</span>
          </h3>
          
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Hiçbir reklam görmezsiniz</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Özel tema ve görsel efektler</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Yüksek kaliteli ezan sesleri</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Detaylı istatistik raporları</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Öncelikli müşteri desteği</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Sık Sorulan Sorular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Premium iptal edebilir miyim?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Evet, istediğiniz zaman iptal edebilirsiniz. İptal ettiğinizde mevcut dönem sonuna kadar premium özellikler aktif kalır.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Ödeme güvenli mi?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tüm ödemeler SSL şifreli bağlantı ile güvenli şekilde işlenir. Kredi kartı bilgileriniz saklanmaz.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Ücretsiz deneme var mı?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Şu anda ücretsiz deneme bulunmamaktadır, ancak istediğiniz zaman iptal edebilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};