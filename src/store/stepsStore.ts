import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailySteps {
  date: string;
  steps: number;
}

interface StepsStore {
  dailyGoal: number;
  todaySteps: number;
  lastStepCount: number; // YENİ: Sensörden gelen ham değer
  weeklySteps: DailySteps[];
  monthlySteps: Record<string, number>;
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  serviceStarted: boolean; // YENİ

  setDailyGoal: (goal: number) => void;
  updateTodaySteps: (steps: number) => void;
  setLastStepCount: (count: number) => void; // YENİ
  addSteps: (steps: number) => void;
  setWeeklySteps: (weeklySteps: DailySteps[]) => void;
  setMonthlySteps: (monthlySteps: Record<string, number>) => void;
  setSupported: (supported: boolean) => void;
  setPermission: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;
  setServiceStarted: (started: boolean) => void; // YENİ
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
        
        // Haftalık güncelle
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        const updatedWeekly = state.weeklySteps.map(day => 
          day.date === today ? { ...day, steps } : day
        );
        set({ weeklySteps: updatedWeekly });

        // Aylık güncelle (sadece bugünkü adımı kaydet, her güncelleme +1 değil!)
        const monthKey = new Date().toISOString().slice(0, 7);
        const monthlyData = { ...state.monthlySteps };
        
        // Önce bu ayın eski toplamını al
        const otherDaysTotal = state.weeklySteps
          .filter(d => d.date !== today && d.date.startsWith(monthKey))
          .reduce((sum, d) => sum + d.steps, 0);
        
        // Şimdiki toplam = diğer günler + bugün
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
        const today = new Date();
        const monthKey = today.toISOString().slice(0, 7);

        // Aylık toplam zaten updateTodaySteps'te hesaplanıyor
        // Sadece günü kaydet
        state.saveTodayToWeek();
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
