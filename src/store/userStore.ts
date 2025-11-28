import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email?: string;
  name?: string;

  referralCode: string;
  isPremium: boolean;
  totalInvited: number;
  successfulInvites: number;
  balance: number;
  referralCount: number;
  referralEarnings: number;

  // ANDROID — Google Fit
  googleFitUserId?: string;
  googleAccessToken?: string;
  isGoogleFitAuthorized: boolean;

  // iOS — Apple Health
  isAppleHealthAuthorized?: boolean;
  appleHealthSteps?: number;
  appleHealthPermissionsRequested?: boolean;
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
  updateInviteStats: (total: number, success: number) => void;
  generateReferralCode: () => string;

  // Google Fit
  setGoogleFitAuthorized: (v: boolean) => void;
  setGoogleFitUserId: (id: string | null) => void;
  setGoogleAccessToken: (token: string | null) => void;

  // Apple Health
  setAppleHealthAuthorized: (v: boolean) => void;
  setAppleHealthSteps: (n: number) => void;
  setAppleHealthPermissionsRequested: (v: boolean) => void;

  // Logout
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Premium
      updatePremiumStatus: (v) =>
        set((state) => ({
          user: state.user ? { ...state.user, isPremium: v } : null,
        })),

      // Davet sistemi
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
            : null,
        })),

      generateReferralCode: () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let out = "";
        for (let i = 0; i < 6; i++) {
          out += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return out;
      },

      // Google Fit
      setGoogleFitAuthorized: (v) =>
        set((state) => ({
          user: state.user ? { ...state.user, isGoogleFitAuthorized: v } : null,
        })),

      setGoogleFitUserId: (id) =>
        set((state) => ({
          user: state.user ? { ...state.user, googleFitUserId: id } : null,
        })),

      setGoogleAccessToken: (token) =>
        set((state) => ({
          user: state.user ? { ...state.user, googleAccessToken: token } : null,
        })),

      // Apple Health
      setAppleHealthAuthorized: (v) =>
        set((state) => ({
          user: state.user ? { ...state.user, isAppleHealthAuthorized: v } : null,
        })),

      setAppleHealthSteps: (n) =>
        set((state) => ({
          user: state.user ? { ...state.user, appleHealthSteps: n } : null,
        })),

      setAppleHealthPermissionsRequested: (v) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, appleHealthPermissionsRequested: v }
            : null,
        })),

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
