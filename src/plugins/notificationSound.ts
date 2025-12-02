import { registerPlugin } from '@capacitor/core';

export const NotificationSound = registerPlugin<{
  pick(): Promise<{ uri: string | null }>;
}>('NotificationSound');
