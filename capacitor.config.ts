import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vaktinamaz.app",
  appName: "Vaktinamaz",
  webDir: "dist",

  server: {
    androidScheme: "https"
  },

  android: {
    buildOptions: {
      keystorePath: "./release-key.keystore",
    },
    webContentsDebuggingEnabled: true,
    // Android için alarm izinleri
    useLegacyBridge: false,
  },

  ios: {
    scheme: "Vaktinamaz",
    // iOS için background modes
    backgroundColor: "#000000",
    scrollEnabled: false,
    contentInset: "never",
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

    // --------------------------------------
    // 🔔 LOCAL NOTIFICATIONS - EZAN BİLDİRİMLERİ İÇİN
    // --------------------------------------
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#FF6B35", // Turuncu renk
      sound: "alert_sound.wav", // 30 saniyelik ezan sesi
      // Android için notification channel
      channelId: "prayer_reminders",
      channelName: "Namaz Hatırlatmaları",
      channelDescription: "Namaz vakitleri için ezan hatırlatmaları",
      importance: 5, // HIGH öncelik
      visibility: 1, // PUBLIC
      vibration: true,
      lights: true,
      lightColor: "#FF6B35",
    },

    // --------------------------------------
    // 🔔 BACKGROUND RUNNER - ARKA PLANDA ÇALIŞMA
    // --------------------------------------
    BackgroundRunner: {
      label: "com.vaktinamaz.app.background",
      src: "background.js",
      event: "checkPrayerTimes",
      repeat: true,
      interval: 15, // Her 15 dakikada bir kontrol
      autoStart: true,
    },

    // --------------------------------------
    // 📱 APP - UYGULAMA AYARLARI
    // --------------------------------------
    App: {
      // iOS için background modes
      backgroundMode: {
        audio: true,
        location: false,
        fetch: true,
        processing: true,
      }
    },

    // --------------------------------------
    // 🔔 PUSH NOTIFICATIONS - OPSİYONEL
    // --------------------------------------
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // --------------------------------------
    // ⚡ BACKGROUND TASKS
    // --------------------------------------
    BackgroundTask: {
      enabled: true,
      name: "checkPrayerNotifications",
      interval: 900, // 15 dakika = 900 saniye
      autoStart: true,
    },

    // --------------------------------------
    // 🔔 EXACT ALARM - KESİN ALARM (Android 12+)
    // --------------------------------------
    ExactAlarm: {
      enabled: true,
      // Alarm tipi: namaz vakitleri için özel
      alarmType: "prayer_times",
      // Alarm çalma zamanı toleransı (dakika)
      tolerance: 2,
    },
  },
};

export default config;