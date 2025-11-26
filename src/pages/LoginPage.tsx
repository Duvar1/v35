import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LoginPageProps {
  onLogin: () => Promise<boolean>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      console.log('🔄 Login butonuna tıklandı...');
      const success = await onLogin();
      
      if (success) {
        console.log('✅ Giriş başarılı! StepsPage yönlendiriliyor...');
        navigate('/steps', { replace: true });
      } else {
        console.log('❌ Giriş başarısız (false döndü)');
        alert('Giriş işlemi iptal edildi.');
      }
    } catch (error: any) {
      console.error('💥 Giriş hatası:', error);
      alert('Giriş sırasında bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Vakt-i Namaz</h1>
          <h2 className="text-xl font-semibold text-gray-700">Adım Sayar</h2>
          <p className="text-gray-600">
            Adımlarınızı takip etmek için Google Fit hesabınızla giriş yapın
          </p>
        </div>

        <Button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Giriş Yapılıyor...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5 mr-2"
              />
              Google ile Giriş Yap
            </span>
          )}
        </Button>

        <div className="text-xs text-gray-500 mt-6">
          Giriş yaparak Google Fit verilerinize erişim izni vermiş olursunuz
        </div>
      </div>
    </div>
  );
};