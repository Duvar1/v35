import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  referralCode: string;
  referredBy?: string;
  isPremium: boolean;
  totalInvited: number;
  successfulInvites: number;
  balance: number;
  createdAt: Date;
  referralCount: number; // Bu satırı ekleyin
  referralEarnings: number; // Bu satırı ekleyin
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void; // Bu satırı ekleyin
  updatePremiumStatus: (isPremium: boolean) => void;
  updateInviteStats: (totalInvited: number, successfulInvites: number) => void;
  generateReferralCode: () => string;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      // Yeni updateUser metodunu ekleyin
      updateUser: (updates) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
      
      updatePremiumStatus: (isPremium) => 
        set((state) => ({
          user: state.user ? { ...state.user, isPremium } : null
        })),
      
      updateInviteStats: (totalInvited, successfulInvites) =>
        set((state) => ({
          user: state.user 
            ? { 
                ...state.user, 
                totalInvited, 
                successfulInvites,
                balance: successfulInvites * 20, // 20 TL per successful invite
                referralCount: totalInvited, // referralCount'u totalInvited ile senkronize edebilirsiniz
                referralEarnings: successfulInvites * 20 // referralEarnings'i balance ile senkronize edebilirsiniz
              } 
            : null
        })),
      
      generateReferralCode: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },
      
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: 'user-storage',
    }
  )
);