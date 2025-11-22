import { registerPlugin } from '@capacitor/core';
import type { StepCounterPlugin } from './capacitor-plugins';

export const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');

export function startStepCounter() {
  StepCounter.startService();

  window.addEventListener("stepUpdate", (event: any) => {
    console.log("Yeni adım:", event.detail.steps);
  });
}
