declare module '@capacitor/core' {
  interface PluginRegistry {
    StepCounter: StepCounterPlugin;
  }
}

export interface StepCounterPlugin {
  startService(): Promise<void>;
  stopService(): Promise<void>;
}
