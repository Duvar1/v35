import { registerPlugin } from '@capacitor/core';

export interface StepCounterPlugin {
  // Ana method'lar
  startStepCounting(): Promise<{ success: boolean; message: string }>;
  stopStepCounting(): Promise<{ success: boolean; message: string }>;
  getStepCount(): Promise<{ stepCount: number }>;
  
  // Permission method'ları
  checkPermissions(): Promise<{ 
    activity_recognition: string;
    notifications: string;
    hasAllPermissions: boolean;
    isSensorAvailable: boolean;
    androidVersion: number;
  }>;
  
  requestPermissions(): Promise<{ 
    activity_recognition: string;
    notifications: string;
    hasAllPermissions: boolean;
    success: boolean;
  }>;
  
  // Listener
  addListener(
    eventName: 'stepCountUpdate',
    listenerFunc: (data: { stepCount: number }) => void,
  ): Promise<any>;
  
  // Opsiyonel - eğer native'de varsa
  resetSteps?(): Promise<{ success: boolean; message: string }>;
}

export const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');