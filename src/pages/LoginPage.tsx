import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void; // Google Sign-In fonksiyonunu burada çağıracağız
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="
      min-h-screen
      flex flex-col items-center justify-center
      bg-gradient-to-br
      from-pink-50 via-orange-50 to-blue-50
      dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900
      p-6
      text-center
    ">
      
      {/* App Logo / Başlık */}
      <h1 className="text-3xl font-light text-pink-800 dark:text-purple-200 mb-2">
        Vakti — Adım Takip
      </h1>

      <p className="text-pink-600 dark:text-purple-300 font-light mb-10">
        Adım verilerinizi Google Fit ile eşleştirin  
      </p>

      {/* Login Card */}
      <Card className="
        w-full max-w-sm
        bg-gradient-to-r
        from-pink-100/80 via-orange-100/80 to-blue-100/80
        dark:from-purple-800/60 dark:via-blue-800/60 dark:to-cyan-800/60
        backdrop-blur-sm
        border border-pink-200/50 dark:border-purple-500/30
      ">
        <CardContent className="p-6 space-y-6">

          <p className="text-sm text-pink-700 dark:text-purple-300 font-light">
            Google hesabınızla giriş yaparak adım verilerinizi güvenli bir şekilde takip edebilirsiniz.
            <br />
            Google Fit arka planda adımlarınızı otomatik kaydeder.
          </p>

          {/* Google Login Button */}
          <Button
            onClick={onLogin}
            className="
              w-full 
              bg-white text-gray-700 
              hover:bg-gray-100 
              dark:bg-gray-200 dark:text-gray-900
              flex items-center justify-center gap-2
              border border-gray-300 rounded-lg shadow
            "
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google Logo"
              className="h-5 w-5"
            />
            <span className="font-medium">Google ile Giriş Yap</span>
            <LogIn className="h-5 w-5" />
          </Button>

        </CardContent>
      </Card>

      {/* Alt Bilgi */}
      <p className="text-xs text-pink-600 dark:text-purple-400 font-light mt-6 max-w-xs">
        Giriş yaptığınızda yalnızca Google Fit’teki adım verilerinize erişilir.
        Başka hiçbir kişisel veri alınmaz.
      </p>
    </div>
  );
};
