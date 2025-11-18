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
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
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
                balance: successfulInvites * 20 // 20 TL per successful invite
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