import { registerPlugin } from "@capacitor/core";

export interface StepServicePlugin {
  startService(): Promise<void>;
  stopService(): Promise<void>;
  addListener(
    eventName: "stepUpdate",
    listener: (data: { steps: number }) => void
  ): Promise<{ remove: () => void }>;
}

export const StepService = registerPlugin<StepServicePlugin>("StepServicePlugin");
