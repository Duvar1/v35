// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vaktinamaz.app',
  appName: 'Vakt-i Namaz',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/fitness.activity.read'],
      serverClientId: '363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;