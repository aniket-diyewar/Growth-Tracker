import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aniketdiyewar.growthtracker',
  appName: 'GrowthTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0e1a",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
