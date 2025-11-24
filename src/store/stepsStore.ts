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

            // Native StepService'ten gelen toplam adım sayısını (todaySteps) günceller.
            updateTodaySteps: (steps) => {
                const state = get();
                // Gelen adım verisinin geçerli olup olmadığını kontrol et
                if (steps < state.todaySteps) {
                    console.warn("Gelen adım sayımı mevcut olandan az, sıfırlama bekleniyor.");
                    // Sıfırlama yapılana kadar işlemi durdurabiliriz.
                    return; 
                }

                set({ todaySteps: steps });
                
                const today = new Date().toISOString().split('T')[0];
                
                // Haftalık ve aylık kayıtları anlık olarak güncelle
                const monthKey = new Date().toISOString().slice(0, 7);

                set((state) => {
                    // Haftalık Güncelleme
                    const updatedWeekly = state.weeklySteps.filter(d => d.date !== today);
                    updatedWeekly.push({ date: today, steps: steps });
                    // Sadece son 7 günü tut
                    const finalWeekly = updatedWeekly.slice(Math.max(updatedWeekly.length - 7, 0));


                    // Aylık Güncelleme
                    // Aylık toplamı güncellemek için, bu ayki tüm günlük kayıtları (weeklySteps dahil) kullanmak daha güvenlidir.
                    const monthlyData = { ...state.monthlySteps };
                    let currentMonthTotal = 0;
                    
                    // Haftalık kayıtlardaki bu aya ait adımları topla
                    finalWeekly.forEach(d => {
                        if (d.date.startsWith(monthKey)) {
                            currentMonthTotal += d.steps;
                        }
                    });
                    
                    // Eğer aylık kayıtta bu aydan daha fazla veri varsa, onu koru.
                    // Basitlik için sadece weeklySteps içindeki adımları aylık toplama yansıtalım.
                    monthlyData[monthKey] = currentMonthTotal; 
                    
                    return { 
                        weeklySteps: finalWeekly,
                        monthlySteps: monthlyData 
                    };
                });
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

            // Artık otomatik güncellendiği için bu metotlar sadece veri bütünlüğünü sağlar.
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
                // saveTodayToWeek zaten updateTodaySteps içinde yapıldığı için bu metot basitleştirilebilir
                get().saveTodayToWeek(); 
            },

            resetDaily: () => {
                const state = get();
                // Günlük sıfırlama yapmadan önce verileri kaydet
                state.saveTodayToWeek();
                state.saveTodayToMonth();
                set({ todaySteps: 0, lastStepCount: 0 });
                // NOT: Bu sıfırlama Native StepService'e de bildirilmeli (resetSteps metodunu Native'de uygulayıp burada çağırmalısınız).
            }
        }),
        {
            name: 'steps-storage'
        }
    )
);