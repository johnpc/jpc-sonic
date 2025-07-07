import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jpc.sonicapp',
  appName: 'JPC Sonic App',
  webDir: 'dist-static',
  server: {
    // Allow external URLs for WebSocket connections
    allowNavigation: [
      'https://sonic.jpc.io', 
      'http://localhost:3000',
      'ws://localhost:3000',
      'wss://sonic.jpc.io'
    ],
    // Enable debugging in development
    cleartext: true,
    // Handle CORS and connection issues
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    // iOS-specific configuration
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#667eea',
    // Enable debugging
    webContentsDebuggingEnabled: true,
    // Audio session configuration for better audio handling
    allowsInlineMediaPlayback: true,
    // Handle audio interruptions gracefully
    mediaPlaybackRequiresUserAction: false,
    // Enable background processing for audio
    backgroundMode: 'audio',
    // Handle WebSocket connections better
    limitsNavigationsToAppBoundDomains: false,
    // Handle snapshots and view transitions better
    preferredContentMode: 'mobile',
    // Ensure proper view hierarchy for snapshots
    handleApplicationURL: true
  },
  plugins: {
    // Configure plugins for iOS
    SplashScreen: {
      launchShowDuration: 1000, // Reduced from 2000 to address timeout warning
      backgroundColor: '#667eea',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#667eea'
    },
    // Optimize for audio streaming and WebSocket connections
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
