// src/store/userStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  referralCode: string;
  isPremium: boolean;
  totalInvited: number;
  successfulInvites: number;
  balance: number;
  referralCount: number;
  referralEarnings: number;
  googleFitUserId: string;
  googleAccessToken: string;
  isGoogleFitAuthorized: boolean;
  // Yeni alanlar
  pendingInvites?: number;
  totalEarned?: number;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;

  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;

  setGoogleFitAuthorized: (v: boolean) => void;
  setGoogleFitUserId: (id: string | null) => void;
  setGoogleAccessToken: (token: string | null) => void;

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
