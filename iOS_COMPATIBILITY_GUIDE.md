# iOS Compatibility Guide for Ledger App

## ✅ Current Status
Your Flutter app is **already iOS-compatible** at the code level! All dependencies used support iOS:
- ✅ `http` - iOS compatible
- ✅ `provider` - iOS compatible
- ✅ `shared_preferences` - iOS compatible
- ✅ `sqflite` - iOS compatible
- ✅ `connectivity_plus` - iOS compatible
- ✅ `intl` - iOS compatible
- ✅ `fl_chart` - iOS compatible
- ✅ `local_auth` - iOS compatible (includes `local_auth_darwin`)
- ✅ `package_info_plus` - iOS compatible

## 📋 Steps to Build for iOS

### Option 1: Build on macOS (Recommended)
**Requirements:**
- macOS machine (Monterey or later)
- Xcode 13+ installed
- Flutter SDK

**Steps:**
```bash
cd mobile_app

# Get dependencies (generates iOS build files)
flutter pub get

# Generate iOS Podfile and projects
flutter build ios --release

# Or to run on simulator/device:
flutter run -d <device_id>
```

### Option 2: Continuous Integration (GitHub Actions / CI/CD)
Use GitHub Actions to build iOS automatically on every push:

**Create `.github/workflows/build-ios.yml`:**
```yaml
name: Build iOS

on:
  push:
    branches: [ main ]
    paths:
      - 'mobile_app/**'

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.27.1'
      - run: cd mobile_app && flutter pub get
      - run: cd mobile_app && flutter build ios --release
      - uses: actions/upload-artifact@v3
        with:
          name: ios-app
          path: mobile_app/build/ios/iphoneos/
```

## 🔧 iOS-Specific Configuration

### 1. Minimum iOS Deployment Target
When you build on macOS, verify minimum iOS version:

**File:** `ios/Podfile`
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
        '$(inherited)',
        'FLUTTER_ROOT=\$(SRCROOT)/Flutter',
      ]
    end
  end
end
```

**File:** `ios/Podfile` (top section)
```ruby
platform :ios, '12.0'  # Ensure minimum iOS 12.0+
```

### 2. iOS App Configuration
**File:** `ios/Runner/Info.plist` (generated automatically)

Key settings to verify:
```xml
<dict>
  <!-- Network configuration for HTTP requests -->
  <key>NSLocalNetworkUsageDescription</key>
  <string>This app needs access to your local network</string>
  
  <key>NSBonjourServiceTypes</key>
  <array>
    <string>_http._tcp</string>
  </array>

  <!-- Biometric/FaceID for local_auth -->
  <key>NSFaceIDUsageDescription</key>
  <string>This app uses Face ID for secure authentication</string>
  
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>This app needs location access</string>
  
  <!-- Internet access -->
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>
```

### 3. CocoaPods Dependencies
When you run `flutter pub get` on macOS, it generates:
- `ios/Podfile` - Manages native dependencies
- `ios/Pods/` - Installed dependencies
- `ios/Runner.xcworkspace` - Xcode workspace (use this, not .xcodeproj)

## 🚀 Building Release for iOS

### Local Build (on macOS):
```bash
flutter build ios --release

# Creates: ios/build/iphoneos/Runner.app
# For TestFlight/AppStore, use Xcode:
open ios/Runner.xcworkspace
# Then: Product → Archive
```

### For App Store Distribution:
1. Create App Store Connect account
2. Configure signing in Xcode
3. Update app version in `pubspec.yaml`
4. Archive and upload via Xcode or transporter

## 🔐 Permissions Needed for iOS

Add to `ios/Runner/Info.plist`:

```xml
<!-- For local authentication -->
<key>NSFaceIDUsageDescription</key>
<string>We need Face ID to secure your app</string>

<!-- For network requests -->
<key>NSAllowsArbitraryLoads</key>
<true/>

<!-- For offline database -->
<key>NSFilesharingEnabled</key>
<true/>
```

## ✨ Dart Code - Already iOS Compatible

Your code already handles iOS well:

### Currency Formatting (Already works on iOS)
```dart
final currencyFormat = NumberFormat.currency(
  locale: 'en_IN', 
  symbol: '₹'
);
```

### Local Storage (Already iOS compatible)
```dart
// shared_preferences works on iOS
final prefs = await SharedPreferences.getInstance();
await prefs.setString('key', 'value');

// sqflite works on iOS
Database db = await openDatabase(...);
```

### Biometric Auth (Already iOS compatible)
```dart
// local_auth_darwin provides iOS/macOS biometric support
final auth = LocalAuthentication();
bool canCheckBiometrics = await auth.canCheckBiometrics;
```

## 📦 Current App Bundle Configuration

**File:** `pubspec.yaml` - Already configured for iOS:
```yaml
flutter_launcher_icons:
  ios: true  # ✅ Enabled
  adaptive_icon_foreground: assets/ic_brickbook_logo.png
  adaptive_icon_background: "#FFFFFF"
  image_path: "assets/ic_brickbook_logo.png"
  remove_alpha_ios: true
```

When you build on macOS, app icon will be automatically generated.

## 🧪 Testing on iOS

### Simulator (macOS):
```bash
flutter emulators --launch Apple_iPhone_15_Plus
flutter run
```

### Physical Device:
```bash
flutter devices  # List connected devices
flutter run -d <device_uuid>
```

## 📊 Next Steps Summary

| Task | Status | How |
|------|--------|-----|
| Code is iOS-compatible | ✅ Done | No changes needed |
| Dependencies support iOS | ✅ Done | All packages iOS-ready |
| App icons configured | ✅ Done | `flutter_launcher_icons` configured |
| Generate iOS build files | ⏳ To Do | Run on macOS: `flutter pub get` |
| Configure permissions | ⏳ To Do | Xcode will prompt you |
| Build release iOS app | ⏳ To Do | macOS: `flutter build ios --release` |
| TestFlight upload | ⏳ To Do | Use Xcode or Transporter |
| App Store submission | ⏳ To Do | Xcode Archive + Transporter |

## 🆘 Troubleshooting

### Issue: "Pod dependencies failed"
**Solution:** On macOS, run:
```bash
cd ios
rm -rf Pods Podfile.lock
cd ..
flutter pub get
```

### Issue: "iOS deployment target mismatch"
**Solution:** Ensure all pods use same deployment target:
```bash
cd ios
pod repo update
cd ..
flutter clean
flutter pub get
```

### Issue: "Code signing identity not found"
**Solution:** In Xcode:
1. Select Runner project
2. Select Runner target
3. Go to Signing & Capabilities
4. Select your team

## 📝 Notes

- **No code changes needed** - Your app is already iOS-compatible
- **Use macOS for building iOS** - Windows can't build iOS apps natively
- **Testflight for beta testing** - Recommended before App Store release
- **All dependencies work on both platforms** - No platform-specific code needed

For more info: https://flutter.dev/docs/deployment/ios
