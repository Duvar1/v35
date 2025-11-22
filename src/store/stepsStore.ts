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
  monthlySteps: Record<string, number>;
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';

  setDailyGoal: (goal: number) => void;
  updateTodaySteps: (steps: number) => void;
  addSteps: (steps: number) => void;
  setWeeklySteps: (weeklySteps: DailySteps[]) => void;
  setMonthlySteps: (monthlySteps: Record<string, number>) => void; // ✅ EKLENDİ
  setSupported: (supported: boolean) => void;
  setPermission: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;
  saveTodayToWeek: () => void;
  saveTodayToMonth: () => void;
  resetDaily: () => void;
}

export const useStepsStore = create<StepsStore>()(
  persist(
    (set, get) => ({
      dailyGoal: 10000,
      todaySteps: 0,
      weeklySteps: [],
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

      // ✅ YENİ EKLENDİ: Aylık verileri güncelleme
      setMonthlySteps: (monthlySteps) => set({ monthlySteps }),

      setSupported: (supported) => set({ isSupported: supported }),

      setPermission: (permission) => set({ permission }),

      saveTodayToWeek: () => {
        const state = get();
        const today = new Date().toISOString().split("T")[0];

        const filtered = state.weeklySteps.filter(d => d.date !== today);
        const updated = [
          ...filtered,
          { date: today, steps: state.todaySteps }
        ].slice(-7);

        set({ weeklySteps: updated });
      },

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

      resetDaily: () => {
        const state = get();
        state.saveTodayToWeek();
        state.saveTodayToMonth();
        set({ todaySteps: 0 });
      }
    }),
    {
      name: 'steps-storage'
    }
  )
);