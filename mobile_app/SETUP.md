# Flutter Mobile App Setup Guide

## Prerequisites

1. **Install Flutter SDK**
   - Download from: https://docs.flutter.dev/get-started/install/windows
   - Add Flutter to PATH
   - Run `flutter doctor` to verify installation

2. **Install Android Studio** (for Android development)
   - Download from: https://developer.android.com/studio
   - Install Android SDK and emulator

3. **Install Visual Studio Code** (optional but recommended)
   - Install Flutter and Dart extensions

## Setup Steps

### 1. Install Flutter Dependencies

Open PowerShell in the mobile_app folder and run:

```powershell
cd "C:\My Data\Workspace\Ledger\mobile_app"
flutter pub get
```

### 2. Configure API Endpoint

Update the API base URL in `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://YOUR_IP_ADDRESS:3000/api';
```

Replace `YOUR_IP_ADDRESS` with your computer's local IP (e.g., 192.168.0.102)

**Important:** Do NOT use `localhost` or `127.0.0.1` - the mobile device/emulator needs your actual network IP.

### 3. Ensure Backend is Running

Make sure your Next.js backend is running:

```powershell
cd "C:\My Data\Workspace\Ledger\web"
npm run dev
```

The backend should be accessible at http://192.168.0.102:3000

### 4. Run the App

**On Android Emulator:**
```powershell
flutter run
```

**On Physical Device:**
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect via USB
4. Run: `flutter run`

**On Chrome (Web - for testing):**
```powershell
flutter run -d chrome
```

## Troubleshooting

### Flutter not recognized
- Add Flutter bin folder to PATH
- Restart PowerShell

### Cannot connect to API
- Check your IP address: `ipconfig` (look for IPv4 Address)
- Update `api_service.dart` with correct IP
- Ensure phone/emulator is on same network as PC
- Check Windows Firewall allows Node.js connections

### Dependencies error
```powershell
flutter clean
flutter pub get
```

### Hot reload not working
- Press 'r' in terminal to hot reload
- Press 'R' to hot restart
- Press 'q' to quit

## Building Release APK

```powershell
flutter build apk --release
```

The APK will be in: `build\app\outputs\flutter-apk\app-release.apk`

## Features Implemented

✅ Dashboard with account summaries
✅ Accounts management (view & add)
✅ Employees management (view & add)
✅ Navigation drawer
✅ Pull-to-refresh
✅ Material 3 design

🚧 Coming Soon:
- Transactions screen with add/filter
- Attendance marking
- Payroll calculation
- Reports with charts

## Development Commands

```powershell
# Check Flutter installation
flutter doctor

# Get dependencies
flutter pub get

# Run app
flutter run

# Build APK
flutter build apk

# Clean build
flutter clean

# Analyze code
flutter analyze
```

## File Structure

```
mobile_app/
├── lib/
│   ├── main.dart                  # App entry point
│   ├── models/                    # Data models
│   │   ├── account.dart
│   │   ├── employee.dart
│   │   ├── transaction.dart
│   │   ├── attendance.dart
│   │   └── payroll.dart
│   ├── screens/                   # UI screens
│   │   ├── dashboard_screen.dart
│   │   ├── accounts_screen.dart
│   │   ├── employees_screen.dart
│   │   ├── transactions_screen.dart
│   │   ├── attendance_screen.dart
│   │   ├── payroll_screen.dart
│   │   └── reports_screen.dart
│   ├── services/                  # API services
│   │   └── api_service.dart
│   └── widgets/                   # Reusable widgets
│       └── drawer_menu.dart
├── pubspec.yaml                   # Dependencies
└── README.md                      # Documentation
```

## Next Steps

1. Install Flutter SDK
2. Run `flutter pub get`
3. Update API URL in api_service.dart
4. Run `flutter run`
5. The app will connect to your web backend APIs

Your web version remains untouched in the `web/` folder!
