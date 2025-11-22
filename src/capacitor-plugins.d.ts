declare module '@capacitor/core' {
  interface PluginRegistry {
    StepCounter: StepCounterPlugin;
  }
}

export interface StepCounterPlugin {
  requestPermissions(): Promise<{ granted: boolean }>;
  checkPermission(): Promise<{ granted: boolean }>;
  startService(): Promise<{ success: boolean; message: string }>;
  stopService(): Promise<{ success: boolean; message: string }>;
  resetSteps(): Promise<{ success: boolean; message: string }>;
  addListener(
    eventName: 'stepUpdate',
    listenerFunc: (data: { steps: number }) => void
  ): Promise<any>;
  removeAllListeners(): Promise<void>;
}
