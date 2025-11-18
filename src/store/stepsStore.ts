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
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  setDailyGoal: (goal: number) => void;
  updateTodaySteps: (steps: number) => void;
  addSteps: (steps: number) => void;
  setWeeklySteps: (weeklySteps: DailySteps[]) => void;
  setSupported: (supported: boolean) => void;
  setPermission: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;
  resetDaily: () => void;
}

export const useStepsStore = create<StepsStore>()(
  persist(
    (set, get) => ({
      dailyGoal: 4000,
      todaySteps: 0,
      weeklySteps: [],
      isSupported: false,
      permission: 'unknown',
      
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      
      updateTodaySteps: (steps) => set({ todaySteps: steps }),
      
      addSteps: (steps) => 
        set((state) => ({ todaySteps: state.todaySteps + steps })),
      
      setWeeklySteps: (weeklySteps) => set({ weeklySteps }),
      
      setSupported: (supported) => set({ isSupported: supported }),
      
      setPermission: (permission) => set({ permission }),
      
      resetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        
        // Add today's steps to weekly data
        const updatedWeekly = [
          ...state.weeklySteps.filter(day => day.date !== today),
          { date: today, steps: state.todaySteps }
        ].slice(-7); // Keep only last 7 days
        
        set({
          todaySteps: 0,
          weeklySteps: updatedWeekly
        });
      }
    }),
    {
      name: 'steps-storage',
    }
  )
);