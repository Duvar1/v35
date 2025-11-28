// src/pages/LoginPage.tsx

import React from "react";
import { googleOAuthLogin } from "../services/googleOAuthService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export const LoginPage: React.FC = () => {
  const handleLogin = async () => {
    await googleOAuthLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-sm shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-6">

          <h1 className="text-2xl font-semibold text-center">
            Adım Takip İçin Giriş Yap
          </h1>

          <p className="text-center text-gray-500 text-sm">
            Google Fit ile bağlandıktan sonra günlük adımların otomatik olarak alınır.
          </p>

          <Button
            onClick={handleLogin}
            className="w-full h-12 text-lg gap-2"
          >
            <LogIn className="w-5 h-5" />
            Google ile Giriş Yap
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
