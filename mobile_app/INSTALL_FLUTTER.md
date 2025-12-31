# Flutter Installation Guide for Windows

## Step 1: Download Flutter SDK

1. Open this link in your browser: https://docs.flutter.dev/get-started/install/windows/mobile
2. Click "Download Flutter SDK" (or download directly from: https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.27.1-stable.zip)
3. Save the file (about 1GB)

## Step 2: Extract Flutter

1. Create a folder: `C:\flutter`
2. Extract the downloaded zip file to `C:\flutter`
3. You should now have: `C:\flutter\bin\flutter.exe`

## Step 3: Add Flutter to PATH

1. Press **Windows + R**
2. Type: `sysdm.cpl` and press Enter
3. Click **"Advanced"** tab
4. Click **"Environment Variables"** button
5. Under **"User variables"**, find and select **"Path"**, then click **"Edit"**
6. Click **"New"**
7. Add: `C:\flutter\bin`
8. Click **"OK"** on all windows

## Step 4: Verify Installation

1. **Close and reopen** PowerShell (important!)
2. Run this command:

```powershell
flutter --version
```

You should see Flutter version information.

## Step 5: Run Flutter Doctor

```powershell
flutter doctor
```

This will check what else you need. You might see:
- ❌ Android Studio not installed (needed for Android apps)
- ❌ Visual Studio not installed (optional, for Windows apps)
- ✅ Git installed (you already have this!)

## Step 6: Install Android Studio (Optional but Recommended)

If you want to run the app on Android:

1. Download Android Studio: https://developer.android.com/studio
2. Install it (follow default options)
3. Open Android Studio
4. Go to: Configure → SDK Manager
5. Install Android SDK
6. Run `flutter doctor --android-licenses` and accept all

## Step 7: Continue with Mobile App Setup

Once Flutter is installed, go back to PowerShell and run:

```powershell
cd "C:\My Data\Workspace\Ledger\mobile_app"
flutter pub get
```

---

## Quick Alternative - Skip Flutter for Now

If Flutter installation seems too complex, I can:
1. **Make your web app mobile-responsive** (works on phones via browser)
2. **Create a React Native version** (easier setup, uses Node.js)

Let me know if you want either of these alternatives instead!
