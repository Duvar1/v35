import { registerPlugin } from '@capacitor/core';

export interface StepCounterPlugin {
  startListening(): Promise<void>;
  addListener(
    eventName: 'stepUpdate',
    listenerFunc: (data: { steps: number }) => void
  ): Promise<{ remove: () => void }>;
}

export const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');
