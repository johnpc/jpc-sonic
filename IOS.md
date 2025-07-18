# iOS Development with Capacitor

This document explains how to build and run the JPC Sonic App as an iOS application using Capacitor.

## Prerequisites

1. **macOS**: Required for iOS development
2. **Xcode**: Install from the Mac App Store
3. **Xcode Command Line Tools**: Run `xcode-select --install`
4. **CocoaPods**: Install with `sudo gem install cocoapods`
5. **Node.js**: Version 16 or higher

## Project Structure

```
jpc-sonic-app/
├── ios/                    # iOS native project (generated by Capacitor)
├── dist-static/           # Web assets for the app
├── capacitor.config.ts    # Capacitor configuration
└── package.json          # Node.js dependencies and scripts
```

## Configuration

The app is configured to connect to the WebSocket server at `https://sonic.jpc.io`. This is set in:

1. **Environment variable**: `WEBSOCKET_SERVER_URL` in `.env`
2. **Build script**: `build-static.js` generates `config.js` with the URL
3. **Capacitor config**: `capacitor.config.ts` allows navigation to the WebSocket domain

## Development Scripts

### Building for Development (localhost)
```bash
# Build static files with localhost WebSocket server
npm run build-static

# Sync with iOS project
npm run cap:sync

# Open in Xcode
npm run cap:open:ios
```

### Building for Production (sonic.jpc.io)
```bash
# Build static files with production WebSocket server
npm run build-static:prod

# Sync with iOS project
npm run cap:sync:prod

# Open in Xcode
npm run cap:open:ios
```

### Running on iOS Simulator/Device
```bash
# Development build
npm run cap:run:ios

# Production build
npm run cap:run:ios:prod
```

## Building the iOS App

### Method 1: Using npm scripts (Recommended)
```bash
# For production
npm run ios:build:prod

# For development
npm run ios:build
```

### Method 2: Manual steps
```bash
# 1. Build static files
npm run build-static:prod

# 2. Sync with Capacitor
npx cap sync

# 3. Open in Xcode
npx cap open ios

# 4. Build and run from Xcode
```

## Xcode Configuration

When you open the project in Xcode (`npm run cap:open:ios`):

1. **Select your development team** in the project settings
2. **Choose a bundle identifier** (default: `com.jpc.sonicapp`)
3. **Select target device** (simulator or physical device)
4. **Build and run** using Cmd+R

## App Configuration

### WebSocket Connection
- **Development**: `http://localhost:3000`
- **Production**: `https://sonic.jpc.io`

### iOS-Specific Features
- **Status Bar**: Configured for dark content
- **Splash Screen**: 2-second duration with black background
- **Safe Area**: Automatic content inset handling
- **Navigation**: Allows external navigation to WebSocket domain

## Troubleshooting

### Common Issues

1. **"No development team selected"**
   - Open Xcode → Project Settings → Signing & Capabilities
   - Select your Apple Developer account

2. **CocoaPods errors**
   ```bash
   cd ios/App
   pod install --repo-update
   ```

3. **WebSocket connection fails**
   - Check that `https://sonic.jpc.io` is accessible
   - Verify the URL in `dist-static/config.js`
   - Check iOS simulator/device network connectivity

4. **Build fails in Xcode**
   - Clean build folder: Product → Clean Build Folder
   - Restart Xcode
   - Re-sync Capacitor: `npm run cap:sync:prod`

### Debugging

1. **Web Inspector**: 
   - Safari → Develop → [Device Name] → [App Name]
   - View console logs and debug JavaScript

2. **Xcode Console**:
   - View native iOS logs and errors

3. **Network Debugging**:
   - Check WebSocket connection in Safari Web Inspector
   - Verify server is running at `https://sonic.jpc.io`

## Deployment

### TestFlight (Internal Testing)
1. Archive the app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Add internal testers in TestFlight

### App Store
1. Follow Apple's App Store Review Guidelines
2. Ensure all required metadata is provided
3. Submit for review through App Store Connect

## File Structure

### Key Files
- `capacitor.config.ts`: Main Capacitor configuration
- `ios/App/App/Info.plist`: iOS app configuration
- `dist-static/config.js`: WebSocket server URL configuration
- `dist-static/index.html`: Main app HTML with iOS meta tags

### Generated Files (Do not edit manually)
- `ios/App/App/public/`: Web assets copied from `dist-static/`
- `ios/App/App/capacitor.config.json`: Auto-generated Capacitor config

## Environment Variables

Create a `.env` file with:
```bash
# WebSocket server URL for static builds
WEBSOCKET_SERVER_URL=https://sonic.jpc.io

# CORS origins (if running the server locally)
ALLOWED_ORIGINS=https://sonic.jpc.io,http://localhost:3000
```

## Next Steps

1. **Test the app** on iOS simulator and physical devices
2. **Configure push notifications** if needed
3. **Add app icons** in `ios/App/App/Assets.xcassets/`
4. **Configure app metadata** in Xcode project settings
5. **Set up CI/CD** for automated builds and deployment
