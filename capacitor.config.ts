import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jpc.sonicapp',
  appName: 'JPC Sonic App',
  webDir: 'dist-static',
  server: {
    // Allow external URLs for WebSocket connections
    allowNavigation: ['https://sonic.jpc.io']
  },
  ios: {
    // iOS-specific configuration
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#000000'
  },
  plugins: {
    // Configure plugins if needed
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    }
  }
};

export default config;
