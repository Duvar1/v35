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
    webContentsDebuggingEnabled: true
  },

  plugins: {
    GoogleAuth: {
      scopes: [
        "profile", 
        "email",
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/fitness.location.read",
      ],
      serverClientId: "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com",
      clientId: "363514939464-n7ir7squ25589sh85g45duvd5a8ttol5.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;