// store/userStore.ts - Eğer yoksa bu dosyayı oluşturun
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
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
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);