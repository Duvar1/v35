import { registerPlugin } from '@capacitor/core';
import type { StepCounterPlugin } from './capacitor-plugins';

export const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');

export function startStepCounter() {
  StepCounter.startService().then(result => {
    console.log("StepCounter başlatıldı:", result);
  }).catch(error => {
    console.error("StepCounter başlatılamadı:", error);
  });

  window.addEventListener("stepUpdate", (event: any) => {
    console.log("Yeni adım:", event.detail.steps);
  });
}