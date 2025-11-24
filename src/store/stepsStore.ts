import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailySteps {
  date: string;
  steps: number;
}

interface StepsStore {
  dailyGoal: number;
  todaySteps: number;
  lastStepCount: number;
  weeklySteps: DailySteps[];
  monthlySteps: Record<string, number>;
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  serviceStarted: boolean;

  setDailyGoal: (goal: number) => void;
  updateTodaySteps: (steps: number) => void;
  setLastStepCount: (count: number) => void;
  addSteps: (steps: number) => void;
  setWeeklySteps: (weeklySteps: DailySteps[]) => void;
  setMonthlySteps: (monthlySteps: Record<string, number>) => void;
  setSupported: (supported: boolean) => void;
  setPermission: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;
  setServiceStarted: (started: boolean) => void;
  saveTodayToWeek: () => void;
  saveTodayToMonth: () => void;
  resetDaily: () => void;
}

export const useStepsStore = create<StepsStore>()(
  persist(
    (set, get) => ({
      dailyGoal: 10000,
      todaySteps: 0,
      lastStepCount: 0,
      weeklySteps: [],
      monthlySteps: {},
      isSupported: false,
      permission: 'unknown',
      serviceStarted: false,

      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      updateTodaySteps: (steps) => {
        set({ todaySteps: steps });
        
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        
        // Haftalık güncelle
        const updatedWeekly = state.weeklySteps.map(day => 
          day.date === today ? { ...day, steps } : day
        );
        set({ weeklySteps: updatedWeekly });

        // Aylık güncelle
        const monthKey = new Date().toISOString().slice(0, 7);
        const monthlyData = { ...state.monthlySteps };
        
        const otherDaysTotal = state.weeklySteps
          .filter(d => d.date !== today && d.date.startsWith(monthKey))
          .reduce((sum, d) => sum + d.steps, 0);
        
        monthlyData[monthKey] = otherDaysTotal + steps;
        
        set({ monthlySteps: monthlyData });
      },

      setLastStepCount: (count) => set({ lastStepCount: count }),

      addSteps: (steps) =>
        set((state) => ({
          todaySteps: state.todaySteps + steps
        })),

      setWeeklySteps: (weeklySteps) => set({ weeklySteps }),

      setMonthlySteps: (monthlySteps) => set({ monthlySteps }),

      setSupported: (supported) => set({ isSupported: supported }),

      setPermission: (permission) => set({ permission }),

      setServiceStarted: (started) => set({ serviceStarted: started }),

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
        state.saveTodayToWeek();
      },

      resetDaily: () => {
        const state = get();
        state.saveTodayToWeek();
        state.saveTodayToMonth();
        set({ todaySteps: 0, lastStepCount: 0 });
      }
    }),
    {
      name: 'steps-storage'
    }
  )
);