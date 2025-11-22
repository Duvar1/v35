import { registerPlugin } from '@capacitor/core';
import type { StepCounterPlugin } from './capacitor-plugins';

export const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');