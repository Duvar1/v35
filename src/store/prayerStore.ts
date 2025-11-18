import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PrayerTime {
  id: string;
  name: string;
  time: string;
  reminderEnabled: boolean;
  reminderOffset: number;
  isNext?: boolean;
  isPassed?: boolean;
}

export interface PrayerTimes {
  date: string;
  city: string;
  prayers: PrayerTime[];
  nextPrayer?: PrayerTime | null;
}

interface PrayerStore {
  prayerTimes: PrayerTimes | null;
  loading: boolean;
  
  // Actions
  setPrayerTimes: (times: PrayerTimes) => void;
  setLoading: (loading: boolean) => void;
  toggleReminder: (prayerId: string, enabled: boolean) => void;
  updateReminderOffset: (prayerId: string, offset: number) => void;
  getReminderText: (prayerName: string) => string;
}

export const usePrayerStore = create<PrayerStore>()(
  persist(
    (set, get) => ({
      prayerTimes: null,
      loading: false,

      setPrayerTimes: (times) => {
        // Mark next and passed prayers
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const updatedPrayers = times.prayers.map((prayer) => {
          const [hours, minutes] = prayer.time.split(':').map(Number);
          const prayerTime = hours * 60 + minutes;
          
          return {
            ...prayer,
            isPassed: prayerTime <= currentTime,
            isNext: false
          };
        });

        // Find next prayer
        let nextPrayerIndex = -1;
        for (let i = 0; i < updatedPrayers.length; i++) {
          const [hours, minutes] = updatedPrayers[i].time.split(':').map(Number);
          const prayerTime = hours * 60 + minutes;
          
          if (prayerTime > currentTime) {
            nextPrayerIndex = i;
            break;
          }
        }

        // If no prayer found for today, next is first prayer of tomorrow
        if (nextPrayerIndex === -1 && updatedPrayers.length > 0) {
          nextPrayerIndex = 0;
        }

        if (nextPrayerIndex >= 0) {
          updatedPrayers[nextPrayerIndex].isNext = true;
        }

        set({ 
          prayerTimes: {
            ...times,
            prayers: updatedPrayers,
            nextPrayer: nextPrayerIndex >= 0 ? updatedPrayers[nextPrayerIndex] : null
          }
        });
      },

      setLoading: (loading) => set({ loading }),

      toggleReminder: (prayerId, enabled) => {
        const state = get();
        if (!state.prayerTimes) return;

        const updatedPrayers = state.prayerTimes.prayers.map((prayer) =>
          prayer.id === prayerId 
            ? { ...prayer, reminderEnabled: enabled }
            : prayer
        );

        set({
          prayerTimes: {
            ...state.prayerTimes,
            prayers: updatedPrayers
          }
        });
      },

      updateReminderOffset: (prayerId, offset) => {
        const state = get();
        if (!state.prayerTimes) return;

        const updatedPrayers = state.prayerTimes.prayers.map((prayer) =>
          prayer.id === prayerId 
            ? { ...prayer, reminderOffset: offset }
            : prayer
        );

        set({
          prayerTimes: {
            ...state.prayerTimes,
            prayers: updatedPrayers
          }
        });
      },

      getReminderText: (prayerName) => {
        const state = get();
        if (!state.prayerTimes) return 'Kapalı';

        const prayer = state.prayerTimes.prayers.find(p => p.name === prayerName);
        if (!prayer || !prayer.reminderEnabled) return 'Kapalı';

        return `${prayer.reminderOffset} dk önce`;
      }
    }),
    {
      name: 'prayer-store',
      partialize: (state) => ({
        prayerTimes: state.prayerTimes
      })
    }
  )
);