# App Assets - Icons and Splash Screens

This document explains the app assets (icons and splash screens) for the JPC Sonic App iOS application.

## Asset Structure

The `assets/` directory contains the source images used to generate iOS app icons and splash screens:

```
assets/
├── icon-only.png          # Main app icon (1024x1024)
├── icon-foreground.png    # Foreground layer for adaptive icons (1024x1024)
├── icon-background.png    # Background layer for adaptive icons (1024x1024)
├── splash.png             # Light mode splash screen (2732x2732)
├── splash-dark.png        # Dark mode splash screen (2732x2732)
└── output/                # Temporary generated images (ignored by git)
```

## Generated Assets

When you run `npm run assets:generate:ios`, Capacitor automatically generates all required iOS assets:

### App Icons
- **Location**: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Generated**: Various sizes for different iOS devices and contexts
- **Source**: `assets/icon-only.png`

### Splash Screens
- **Location**: `ios/App/App/Assets.xcassets/Splash.imageset/`
- **Generated**: Light and dark mode versions at 1x, 2x, and 3x resolutions
- **Sources**: 
  - Light mode: `assets/splash.png`
  - Dark mode: `assets/splash-dark.png`

## Design Specifications

### App Icon Design
- **Style**: Modern minimalist design with sound wave/audio theme
- **Colors**: Blue and purple gradient
- **Theme**: Professional tech aesthetic suitable for audio streaming app
- **Format**: PNG with transparency support
- **Size**: 1024x1024 pixels (source)

### Splash Screen Design
- **Style**: Clean, minimalist with centered logo
- **Light Mode**: Dark background with blue/purple accents
- **Dark Mode**: Pure black background with subtle highlights
- **Format**: PNG
- **Size**: 2732x2732 pixels (source)

## Regenerating Assets

### Quick Regeneration
```bash
# Generate all iOS assets
npm run assets:generate:ios

# Generate assets for all platforms
npm run assets:generate
```

### Manual Process
If you need to modify the source images:

1. **Edit source images** in the `assets/` directory
2. **Ensure correct dimensions**:
   - Icons: 1024x1024 pixels minimum
   - Splash screens: 2732x2732 pixels minimum
3. **Regenerate assets**:
   ```bash
   npm run assets:generate:ios
   ```
4. **Sync with Capacitor**:
   ```bash
   npm run cap:sync:prod
   ```

## Image Generation Process

The assets were created using:

1. **AI Image Generation**: Amazon Nova Canvas for initial designs
2. **Image Processing**: ImageMagick for resizing and optimization
3. **Asset Generation**: Capacitor Assets tool for iOS-specific formats

### Commands Used
```bash
# Generate base images with Nova Canvas
# (AI-generated sound wave themed designs)

# Resize and optimize with ImageMagick
magick input.png -resize 1024x1024 -quality 95 output.png
magick splash-temp.png -resize 2732x2732 -gravity center -extent 2732x2732 -quality 95 splash.png

# Generate iOS assets
npx capacitor-assets generate --ios
```

## Customization

### Changing the Icon
1. Replace `assets/icon-only.png` with your new 1024x1024 icon
2. Optionally update `icon-foreground.png` and `icon-background.png` for adaptive icons
3. Run `npm run assets:generate:ios`

### Changing Splash Screens
1. Replace `assets/splash.png` and/or `assets/splash-dark.png` with new 2732x2732 images
2. Run `npm run assets:generate:ios`

### Design Guidelines
- **Icons**: Should be simple, recognizable at small sizes, and follow iOS design guidelines
- **Splash Screens**: Should match your app's branding and provide a smooth transition to the main interface
- **Colors**: Consider both light and dark mode compatibility
- **Branding**: Maintain consistency with your app's visual identity

## File Sizes
- **Source Icons**: ~900KB each (PNG, high quality)
- **Source Splash Screens**: ~4-5MB each (PNG, high resolution)
- **Generated Assets**: Automatically optimized by Capacitor for each use case

## Troubleshooting

### Assets Not Updating
1. Clean and regenerate:
   ```bash
   rm -rf ios/App/App/Assets.xcassets/AppIcon.appiconset/*
   rm -rf ios/App/App/Assets.xcassets/Splash.imageset/*
   npm run assets:generate:ios
   ```

2. Clean Xcode build:
   - Open Xcode
   - Product → Clean Build Folder
   - Rebuild the project

### Image Quality Issues
- Ensure source images are high resolution (1024x1024 for icons, 2732x2732 for splash)
- Use PNG format for best quality and transparency support
- Avoid JPEG for icons as it doesn't support transparency

### Size Requirements
- **Icons**: Must be at least 1024x1024 pixels
- **Splash Screens**: Must be at least 2732x2732 pixels
- **Format**: PNG or JPG (PNG recommended for transparency)

## Integration with Build Process

The asset generation is integrated into the build scripts:

```bash
# Full production build with assets
npm run cap:sync:prod  # Includes asset sync
npm run ios:build:prod # Complete iOS build

# Development build
npm run cap:sync       # Includes asset sync
npm run ios:build      # Complete iOS build
```

Assets are automatically copied to the iOS project during the sync process, ensuring your app always has the latest icons and splash screens.
