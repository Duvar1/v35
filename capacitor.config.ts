import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vaktinamaz.app",
  appName: "Vaktinamaz",
  webDir: "dist",

  android: {
    buildOptions: {
      keystorePath: "./release-key.keystore",   // 🔥 DOĞRU YER
    },
    webContentsDebuggingEnabled: true
  },

  plugins: {
    GoogleFit: {
      scopes: [
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/fitness.activity.write",
        "https://www.googleapis.com/auth/fitness.location.read",
      ],
    },
  },
};

export default config;
