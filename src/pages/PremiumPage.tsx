import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, ShieldCheck, Zap, Ban, Star, Heart } from "lucide-react";

export default function PremiumPage() {
  // EKLENDİ: Yön değişikliğinde sayfayı koruma
  useEffect(() => {
    const handleOrientationChange = () => {
      // Sayfayı koru, hiçbir şey yapma
      console.log('PremiumPage: Orientation changed, page preserved');
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Sayfa yüklendiğinde kaydet
    localStorage.setItem('last_visited_page', '/premium');
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-blue-50 
      dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900 p-4">

      {/* HEADER */}
      <div className="text-center space-y-2 mt-4 mb-6">
        <h1 className="text-3xl font-light text-pink-800 dark:text-purple-200">
          Premium Üyelik
        </h1>
        <p className="text-blue-800 dark:text-cyan-300 font-light">
          Aylık abonelik ile sınırsız ve reklamsız deneyim
        </p>
      </div>

      {/* FİYAT KARTI */}
      <Card className="bg-gradient-to-r from-pink-200/80 via-orange-200/80 to-blue-200/80 
        dark:from-pink-900/40 dark:via-orange-900/40 dark:to-blue-900/40 
        border border-pink-300/70 dark:border-pink-700/70 shadow-lg mb-6">
        
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-light text-pink-900 dark:text-pink-100">
            Aylık <span className="font-normal text-orange-700 dark:text-orange-300">44 TL</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm py-1 px-4 rounded-full">
            Aylık Abonelik
          </Badge>

          <p className="text-sm text-pink-800 dark:text-purple-200 leading-relaxed">
            Premium abonelik ile tüm özelliklerin kilidi açılır ve uygulama tamamen reklamsız olur.
          </p>

          <Button
            className="w-full h-12 mt-2 text-lg font-light bg-gradient-to-r 
              from-pink-500 via-orange-500 to-blue-500 text-white shadow-md hover:opacity-90"
            onClick={() => alert("Abonelik sistemi yakında aktif edilecek.")}
          >
            Aylık 44 TL'ye Abone Ol
          </Button>
        </CardContent>
      </Card>

      {/* AVANTAJLAR */}
      <Card className="bg-gradient-to-r from-pink-50/80 via-orange-50/80 to-blue-50/80 
        dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 
        border border-pink-200/50 dark:border-purple-500/30 shadow-sm">

        <CardHeader>
          <CardTitle className="text-lg font-light text-pink-800 dark:text-purple-200 flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>Premium Özellikler</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-pink-800 dark:text-purple-200">

          <div className="flex items-center space-x-3">
            <Ban className="h-5 w-5 text-red-500" />
            <span className="text-sm">Tüm reklamlar tamamen kaldırılır</span>
          </div>

          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-sm">Günün Ayeti, Hadisi ve Duası sınırsız erişim</span>
          </div>

          <div className="flex items-center space-x-3">
            <Zap className="h-5 w-5 text-orange-500" />
            <span className="text-sm">Kıble Modu hızlandırılır + gelişmiş yön algılama</span>
          </div>

          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-sm">Premium hatırlatıcılar: Ezber, Zikir, Özel Dua</span>
          </div>

          <div className="flex items-center space-x-3">
            <Heart className="h-5 w-5 text-pink-500" />
            <span className="text-sm">Tüm temalar ve özel ikon paketleri açılır</span>
          </div>

        </CardContent>
      </Card>

      <div className="h-10"></div>
    </div>
  );
}