import React from "react";
import { Button } from "@/components/ui/button";
import { googleFitLogin } from "../services/googleFitLogin";
import { useUserStore } from "../store/userStore";

export const LoginPage = () => {
  const setUser = useUserStore((s) => s.setUser);

  const handleLogin = async () => {
    const result = await googleFitLogin();

    if (!result) {
      alert("Google Fit girişi başarısız oldu.");
      return;
    }

    const {
      googleFitUserId,
      googleAccessToken,
    } = useUserStore.getState().user ?? {};

    // ❗ Kullanıcıyı oluşturuyoruz (ZORUNLU)
    setUser({
      id: googleFitUserId || "gf-user",
      referralCode: "XXXXX",
      isPremium: false,

      totalInvited: 0,
      successfulInvites: 0,
      balance: 0,
      referralCount: 0,
      referralEarnings: 0,

      googleFitUserId,
      googleAccessToken,
      isGoogleFitAuthorized: true,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-xl font-semibold mb-4">Adım Sayar Kullanmak İçin Google Fit ile giriş yap</h1>

      <Button onClick={handleLogin} className="px-6 py-3 text-lg">
        Google ile Giriş Yap
      </Button>
    </div>
  );
};
