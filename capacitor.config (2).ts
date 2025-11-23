import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vaktinamaz.app',
  appName: 'Vakt-i Namaz',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StepCounter: {  // ✅ DOĞRU
      // Adım sayar ayarları
    }
  }
};

export default config;