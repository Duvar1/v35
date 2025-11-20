import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailySteps {
  date: string;
  steps: number;
}

interface StepsStore {
  dailyGoal: number;

  todaySteps: number;
  weeklySteps: DailySteps[];

  // Aylık toplama sistemi
  monthlySteps: Record<string, number>; // örnek: { "2025-01": 12500 }

  isSupported: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';

  setDailyGoal: (goal: number) => void;
  updateTodaySteps: (steps: number) => void;
  addSteps: (steps: number) => void;

  setWeeklySteps: (weeklySteps: DailySteps[]) => void;
  setSupported: (supported: boolean) => void;
  setPermission: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;

  saveTodayToWeek: () => void;
  saveTodayToMonth: () => void;

  resetDaily: () => void;
}

export const useStepsStore = create<StepsStore>()(
  persist(
    (set, get) => ({
      dailyGoal: 4000,

      todaySteps: 0,

      weeklySteps: [],

      // Ay: toplam steps
      monthlySteps: {},

      isSupported: false,
      permission: 'unknown',

      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      updateTodaySteps: (steps) => set({ todaySteps: steps }),

      addSteps: (steps) =>
        set((state) => ({
          todaySteps: state.todaySteps + steps
        })),

      setWeeklySteps: (weeklySteps) => set({ weeklySteps }),

      setSupported: (supported) => set({ isSupported: supported }),

      setPermission: (permission) => set({ permission }),

      // 🔥 Bugünü haftaya ekler
      saveTodayToWeek: () => {
        const state = get();
        const today = new Date().toISOString().split("T")[0];

        // Eğer bugün zaten varsa güncelle
        const filtered = state.weeklySteps.filter(d => d.date !== today);

        const updated = [
          ...filtered,
          { date: today, steps: state.todaySteps }
        ].slice(-7);

        set({ weeklySteps: updated });
      },

      // 🔥 Bugünü ay toplamına ekler
      saveTodayToMonth: () => {
        const state = get();
        const today = new Date();
        const monthKey = today.toISOString().slice(0, 7);

        set({
          monthlySteps: {
            ...state.monthlySteps,
            [monthKey]: (state.monthlySteps[monthKey] || 0) + state.todaySteps
          }
        });
      },

      // 🔥 Günlük reset: haftaya ve aya kaydedip sıfırlar
      resetDaily: () => {
        const state = get();

        state.saveTodayToWeek();
        state.saveTodayToMonth();

        // Yeni güne başla
        set({
          todaySteps: 0
        });
      }
    }),
    {
      name: 'steps-storage'
    }
  )
);
