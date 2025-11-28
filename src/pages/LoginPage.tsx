// src/pages/LoginPage.tsx

import React from "react";
import { googleOAuthLogin } from "../services/googleOAuthService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const nav = useNavigate();

  const handleLogin = async () => {
    const ok = await googleOAuthLogin();
    if (ok) nav("/steps"); // 🔥 login sonrası yönlendir
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-rose-100 p-6">
      <Card className="w-full max-w-sm shadow-2xl rounded-3xl bg-white/90 backdrop-blur-xl">
        <CardContent className="p-8 space-y-8">

          <h1 className="text-3xl font-bold text-center text-orange-600">
            Adım Takip
          </h1>

          <p className="text-center text-gray-600 text-sm">
            Google Fit ile bağlanarak günlük adımlarını takip edebilirsin.
          </p>

          <Button
            onClick={handleLogin}
            className="w-full h-12 text-lg gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <LogIn className="w-6 h-6" />
            Google ile Giriş Yap
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
