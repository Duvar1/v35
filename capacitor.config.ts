import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vaktinamaz.app",
  appName: "Vaktinamaz",
  webDir: "dist",
  backgroundColor: "#FFFFFF", // Buraya taşı

  server: {
    androidScheme: "https"
  },

  // ✅ SADECE TEMEL iOS AYARLARI
  ios: {
    scheme: "App",
    contentInset: "always",
    allowsLinkPreview: false,
    scrollEnabled: true,
    // Sadece bu 4 property garantili çalışır
  },

  android: {
    buildOptions: {
      keystorePath: "./release-key.keystore",
    },
    webContentsDebuggingEnabled: true,
  },

  plugins: {
    GoogleAuth: {
      scopes: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/fitness.location.read",
      ],
      serverClientId:
        "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com",
      clientId:
        "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },

    LocalNotifications: {
      sound: "alert_sound.wav",
      smallIcon: "ic_stat_icon",
      iconColor: "#FF6B35",
      channelId: "prayer_reminders",
      channelName: "Namaz Hatırlatmaları",
      channelDescription: "Namaz vakitleri için ezan hatırlatmaları",
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: "#FF6B35",
    },
  },
};

export default config;