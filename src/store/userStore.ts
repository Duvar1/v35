import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  referralCode: string;
  referredBy?: string;

  // Premium / Reklamlar
  isPremium: boolean;

  // Davet sistemi
  totalInvited: number;
  successfulInvites: number;
  balance: number;
  referralCount: number;
  referralEarnings: number;

  // Google Fit
  googleFitUserId: string | null;
  googleAccessToken: string | null;
  isGoogleFitAuthorized: boolean;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;

  // Login & Update
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;

  // Premium
  updatePremiumStatus: (v: boolean) => void;

  // Davet istatistikleri
  updateInviteStats: (totalInvited: number, successfulInvites: number) => void;
  generateReferralCode: () => string;

  // Google Fit
  setGoogleFitAuthorized: (v: boolean) => void;
  setGoogleFitUserId: (id: string | null) => void;
  setGoogleAccessToken: (token: string | null) => void;

  // Logout
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      // ➤ Kullanıcıyı tamamen oluşturur
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      // ➤ Kullanıcıyı günceller (hiçbir şekilde user'ı null yapmaz)
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        })),

      // ➤ Premium güncelle
      updatePremiumStatus: (v) =>
        set((state) => ({
          user: state.user ? { ...state.user, isPremium: v } : state.user,
        })),

      // ➤ Davet sistemi güncelle
      updateInviteStats: (totalInvited, successfulInvites) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                totalInvited,
                successfulInvites,
                balance: successfulInvites * 20,
                referralCount: totalInvited,
                referralEarnings: successfulInvites * 20,
              }
            : state.user,
        })),

      // ➤ Referral kod üret
      generateReferralCode: () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },

      // ➤ Google Fit: kullanıcı yoksa hiçbir şey yapma (user'ı asla null yapmaz)
      setGoogleFitAuthorized: (v) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, isGoogleFitAuthorized: v }
            : state.user,
        })),

      setGoogleFitUserId: (id) =>
        set((state) => ({
          user: state.user ? { ...state.user, googleFitUserId: id } : state.user,
        })),

      setGoogleAccessToken: (token) =>
        set((state) => ({
          user: state.user ? { ...state.user, googleAccessToken: token } : state.user,
        })),

      // ➤ Tamamen logout
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "user-storage",
    }
  )
);
