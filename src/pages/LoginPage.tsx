import React from "react";
import { Button } from "@/components/ui/button";

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl mb-4">Adım Sayar</h1>

      <Button onClick={onLogin} className="w-full bg-white text-gray-700">
        Google ile Giriş Yap
      </Button>
    </div>
  );
};
