declare module '@capacitor/core' {
  interface PluginRegistry {
    StepCounter: StepCounterPlugin;
  }
}

export interface StepCounterPlugin {
  startService(): Promise<{ success: boolean; message: string }>;
  stopService(): Promise<{ success: boolean; message: string }>;
  checkPermissions?(): Promise<{ granted: boolean }>;
  requestPermissions?(): Promise<{ granted: boolean }>;
}