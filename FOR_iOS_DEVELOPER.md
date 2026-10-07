# iOS Build Instructions for Developer

## Quick Start - macOS Only

Your developer needs to run these commands on their Mac:

### Step 1: Clone Latest Code
```bash
cd ~/your-workspace
git clone https://github.com/Sriramrajugit/Brickbook.git
cd Brickbook/mobile_app
```

### Step 2: Ensure Latest Commit
```bash
git pull origin main
git log --oneline -1
# Should show: 430cad08 Mobile App Sync: Currency Symbol & Employee Screen Redesign
```

### Step 3: Get Flutter & Dependencies
```bash
flutter --version
# Should be 3.27.1 or later

flutter pub get
```

### Step 4: Build iOS Release
```bash
flutter build ios --release
```

**Output will be:** `build/ios/iphoneos/Runner.app`

---

## 📦 Distribution Options

### Option A: TestFlight (Recommended for Testing)
```bash
# Opens Xcode with project ready to archive
open ios/Runner.xcworkspace

# In Xcode:
# 1. Select "Runner" target
# 2. Product → Archive
# 3. Upload to TestFlight via Organizer
```

### Option B: App Store Distribution
```bash
# Same as Option A, but upload to App Store instead of TestFlight
```

### Option C: Direct IPA Export
```bash
open ios/Runner.xcworkspace
# Product → Archive → Distribute App → Custom → Save
```

---

## ✅ Verification Checklist

- [ ] Flutter 3.27.1+ installed on Mac
- [ ] Xcode 13+ installed
- [ ] Latest code pulled (commit 430cad08 or later)
- [ ] `flutter pub get` ran successfully
- [ ] `flutter build ios --release` completed without errors
- [ ] App icons show correctly
- [ ] App Name: Brickbook
- [ ] Bundle ID: com.brickbook.ledger (or configure in Xcode)

---

## 🆘 Common macOS Issues

### Problem: Pod Installation Failed
```bash
cd ios
rm -rf Pods Podfile.lock
cd ..
flutter clean
flutter pub get
```

### Problem: CocoaPods Outdated
```bash
sudo gem install cocoapods
pod repo update
flutter pub get
```

### Problem: Deployment Target Mismatch
In Xcode → Runner → Build Settings → iOS Deployment Target = 12.0+

### Problem: Code Signing Issues
In Xcode → Runner → Signing & Capabilities → Select your Team

---

## 📝 Current App Status

| Feature | Status | Notes |
|---------|--------|-------|
| Android APK | ✅ Ready | 27.0MB, tested on device |
| iOS Code | ✅ Ready | No changes needed |
| Dependencies | ✅ Compatible | All support iOS |
| Currency | ✅ Fixed | Now shows ₹ (Indian Rupee) |
| Employee Screen | ✅ Redesigned | Form + DataTable matching web |
| Package Features | ✅ Gated | Bills & Invoices only for STRUCTURE+ |

---

## 📞 Contact Info
- **GitHub:** https://github.com/Sriramrajugit/Brickbook
- **Latest Commit:** 430cad08 - Mobile App Sync
- **All changes:** Synced to `main` branch

---

## 🎯 When Done

Once iOS build is complete:
1. Share app via TestFlight for testing
2. Verify on iOS device (currency, screens, features)
3. When ready, submit to App Store
4. Users can download from App Store

That's it! No code changes needed—just build and ship! 🚀
