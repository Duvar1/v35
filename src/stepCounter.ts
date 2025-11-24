// stepCounter.ts
import { registerPlugin } from '@capacitor/core';

export interface StepCounterPlugin {
  startStepCounting(): Promise<{ success: boolean; message: string }>;
  stopStepCounting(): Promise<{ success: boolean; message: string }>;
  getStepCount(): Promise<{ stepCount: number }>;
  checkPermissions(): Promise<{ activity_recognition: string }>;
  requestPermissions(): Promise<{ activity_recognition: string }>;
  addListener(
    eventName: 'stepCountUpdate',
    listenerFunc: (data: { stepCount: number }) => void,
  ): Promise<any>;
  startService?(): Promise<{ success: boolean; message: string }>;
  stopService?(): Promise<{ success: boolean; message: string }>;
  resetSteps?(): Promise<{ success: boolean; message: string }>;
}

export const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');