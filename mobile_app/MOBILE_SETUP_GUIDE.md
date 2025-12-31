# Mobile App Setup Guide

## Prerequisites

1. **Flutter SDK** (3.0 or higher)
   - Download from: https://flutter.dev/docs/get-started/install
   - Verify installation: `flutter doctor`

2. **Android Studio** or **VS Code** with Flutter extensions

3. **Backend Server Running**
   - Web application must be running (Next.js backend)
   - Note the backend URL (e.g., http://192.168.0.102:3000 or ngrok URL)

## Step-by-Step Setup

### 1. Create Flutter Project

```bash
flutter create ledger_mobile_app
cd ledger_mobile_app
```

### 2. Replace lib Folder

```bash
# Delete the default lib folder
rm -rf lib

# Copy the shared lib folder
cp -r /path/to/shared/lib ./lib
```

### 3. Update pubspec.yaml

Replace the content of `pubspec.yaml` with:

```yaml
name: ledger_mobile_app
description: Ledger mobile application with offline support
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # HTTP requests
  http: ^1.1.0
  
  # Local database
  sqflite: ^2.3.0
  path: ^1.8.3
  
  # Offline/Connectivity
  connectivity_plus: ^5.0.2
  shared_preferences: ^2.2.2
  
  # UI
  cupertino_icons: ^1.0.2
  intl: ^0.18.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
```

### 4. Install Dependencies

```bash
flutter pub get
```

### 5. Configure Backend URL

Edit `lib/services/api_service.dart` (line 10):

**For Local Network:**
```dart
static const String baseUrl = 'http://YOUR_COMPUTER_IP:3000/api';
// Example: 'http://192.168.1.100:3000/api'
```

**For External Access (ngrok):**
```dart
static const String baseUrl = 'https://your-ngrok-url.ngrok-free.dev/api';
```

**How to find your computer's IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### 6. Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Add these permissions BEFORE <application> tag -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    
    <application
        android:label="Ledger App"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <!-- Rest of the file... -->
    </application>
</manifest>
```

### 7. iOS Permissions (if targeting iOS)

Edit `ios/Runner/Info.plist`:

```xml
<dict>
    <!-- Add before </dict> -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
```

### 8. Update Main App File

Edit `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'services/sync_manager.dart';
import 'screens/accounts_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Start automatic background sync
  SyncManager().startAutoSync();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ledger App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const AccountsScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
```

### 9. Run the App

**Connect Device or Start Emulator:**

```bash
# Check connected devices
flutter devices

# Run on connected device
flutter run

# Run on specific device
flutter run -d <device-id>

# For Chrome web (testing only)
flutter run -d chrome
```

## Configuration Checklist

- [ ] Flutter SDK installed and verified
- [ ] Project created with correct name
- [ ] lib folder copied
- [ ] pubspec.yaml updated with all dependencies
- [ ] `flutter pub get` executed successfully
- [ ] Backend URL configured in api_service.dart
- [ ] Android permissions added
- [ ] Backend server is running
- [ ] Device/emulator connected
- [ ] App runs successfully

## Testing Offline Functionality

### 1. Test Initial Sync (Online)

```
1. Ensure backend is running
2. Launch app
3. Navigate to Transactions screen
4. Verify data loads from server
```

### 2. Test Offline Creation

```
1. Turn off WiFi/Mobile data on device
2. Create a new transaction
3. Transaction should save locally
4. Check "Unsynced" indicator (if implemented)
```

### 3. Test Auto-Sync

```
1. Keep app open
2. Turn on WiFi/Mobile data
3. Wait 30 seconds
4. Transaction should auto-sync to server
5. Verify on web dashboard
```

### 4. Test Offline Viewing

```
1. Load data while online
2. Turn off network
3. Close and reopen app
4. All previously loaded data should be visible
```

## Troubleshooting

### Issue: Cannot connect to backend

**Solution:**
1. Verify backend is running: http://YOUR_IP:3000
2. Check IP address is correct
3. Both devices on same WiFi network
4. Firewall not blocking port 3000
5. Test URL in device browser first

### Issue: Certificate error (iOS)

**Solution:**
- Add `NSAllowsArbitraryLoads` to Info.plist (see step 7)

### Issue: Database error

**Solution:**
```bash
# Clear app data
flutter clean
flutter pub get
flutter run
```

### Issue: Dependencies conflict

**Solution:**
```bash
flutter pub upgrade
flutter pub get
```

## Backend Server Requirements

Your backend server must be:

1. ✅ **Running:** `npm run dev` in web folder
2. ✅ **Accessible:** On network or via ngrok
3. ✅ **APIs Working:**
   - GET /api/accounts
   - GET /api/employees
   - GET /api/transactions
   - POST /api/transactions
   - GET /api/attendance
   - POST /api/attendance

**Test Backend API:**
```bash
# From mobile device browser or terminal
curl http://YOUR_IP:3000/api/accounts

# Should return JSON data, not 401 or error
```

## Development Tips

1. **Hot Reload:** Press `r` in terminal while app is running
2. **Full Restart:** Press `R` in terminal
3. **Debug Mode:** Use VS Code debugger or Android Studio
4. **Logs:** Check console for sync messages
5. **Database:** Use DB Browser for SQLite to inspect local.db

## File Structure

```
ledger_mobile_app/
├── android/              # Android config
├── ios/                  # iOS config
├── lib/                  # Shared code (your team's code)
│   ├── main.dart        # Entry point (update this)
│   ├── models/          # Data models
│   ├── screens/         # UI screens
│   └── services/        # API & Database services
│       ├── api_service.dart         # Backend API calls
│       ├── local_database.dart      # SQLite operations
│       ├── sync_manager.dart        # Auto-sync logic
│       └── offline_api_service.dart # Offline-first wrapper
├── pubspec.yaml         # Dependencies (update this)
└── README.md

```

## Next Steps After Setup

1. **Customize UI:** Modify screens in `lib/screens/`
2. **Add Features:** Create new screens/services
3. **Branding:** Update app icon and name
4. **Testing:** Test on multiple devices
5. **Build Release:** `flutter build apk` or `flutter build ios`

## Support

**Common Commands:**
```bash
flutter doctor          # Check setup
flutter clean          # Clean build
flutter pub get        # Install dependencies
flutter run            # Run app
flutter build apk      # Build Android APK
flutter build ios      # Build iOS app
```

**Backend Team Contact:**
- Backend URL: [Your backend URL]
- API Documentation: [Link to API docs if any]

## Production Deployment

When ready for production:

1. Update `baseUrl` to production server
2. Enable ProGuard (Android)
3. Configure app signing
4. Build release APK/IPA
5. Test thoroughly on real devices
6. Submit to Play Store/App Store

---

**Ready to Go!** 🚀

Once setup is complete, your app will:
- ✅ Work offline
- ✅ Auto-sync when online
- ✅ Store data locally
- ✅ Handle network failures gracefully
